package com.eventos.crm.service;

import com.eventos.crm.dto.CreateQuoteDto;
import com.eventos.crm.dto.CreateQuoteItemDto;
import com.eventos.crm.entity.*;
import com.eventos.crm.repository.LeadRepository;
import com.eventos.crm.repository.QuoteRepository;
import com.eventos.crm.repository.TenantSequenceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import java.util.Map;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class QuoteService {

    private static final Logger log = LoggerFactory.getLogger(QuoteService.class);

    private final QuoteRepository quoteRepository;
    private final LeadRepository leadRepository;
    private final LeadService leadService;
    private final TenantSequenceRepository tenantSequenceRepository;
    private final PdfGenerationService pdfGenerationService;
    private final CloudinaryService cloudinaryService;

    public QuoteService(QuoteRepository quoteRepository,
                        LeadRepository leadRepository,
                        LeadService leadService,
                        TenantSequenceRepository tenantSequenceRepository,
                        PdfGenerationService pdfGenerationService,
                        CloudinaryService cloudinaryService) {
        this.quoteRepository = quoteRepository;
        this.leadRepository = leadRepository;
        this.leadService = leadService;
        this.tenantSequenceRepository = tenantSequenceRepository;
        this.pdfGenerationService = pdfGenerationService;
        this.cloudinaryService = cloudinaryService;
    }

    @Transactional(readOnly = true)
    public List<Quote> getAllQuotes(UUID tenantId) {
        return quoteRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public Page<Quote> getAllQuotes(UUID tenantId, Pageable pageable) {
        return quoteRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
    }

    @Transactional(readOnly = true)
    public Quote getQuoteById(UUID id, UUID tenantId) {
        return quoteRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Quote not found or access denied"));
    }

    @Transactional(readOnly = true)
    public List<Quote> getQuotesByLeadId(UUID leadId, UUID tenantId) {
        leadRepository.findByIdAndTenantIdAndIsDeletedFalse(leadId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found or access denied"));
        return quoteRepository.findAllByLeadIdAndTenantId(leadId, tenantId);
    }

    public Quote createQuote(CreateQuoteDto dto, UUID tenantId) {
        leadRepository.findByIdAndTenantIdAndIsDeletedFalse(dto.getLeadId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Associated lead not found or access denied"));

        BigDecimal subtotal = BigDecimal.ZERO;
        List<QuoteItem> items = new ArrayList<>();

        for (CreateQuoteItemDto itemDto : dto.getItems()) {
            BigDecimal qty = BigDecimal.valueOf(itemDto.getQuantity());
            BigDecimal itemTotal = itemDto.getUnitPrice().multiply(qty);

            QuoteItem item = QuoteItem.builder()
                    .itemName(itemDto.getItemName())
                    .description(itemDto.getDescription())
                    .unitPrice(itemDto.getUnitPrice())
                    .quantity(itemDto.getQuantity())
                    .total(itemTotal)
                    .build();

            items.add(item);
            subtotal = subtotal.add(itemTotal);
        }

        BigDecimal discount = dto.getDiscount() != null ? dto.getDiscount() : BigDecimal.ZERO;
        BigDecimal taxableAmount = subtotal.subtract(discount);
        if (taxableAmount.compareTo(BigDecimal.ZERO) < 0) {
            taxableAmount = BigDecimal.ZERO;
        }

        BigDecimal taxRate = dto.getTaxRate() != null ? dto.getTaxRate() : BigDecimal.ZERO;
        BigDecimal tax = taxableAmount.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = taxableAmount.add(tax);

        TenantSequence seq = tenantSequenceRepository
                .findByTenantIdAndSequenceTypeForUpdate(tenantId, "QUOTE")
                .orElse(null);

        long nextVal;
        if (seq == null) {
            seq = TenantSequence.builder()
                    .tenantId(tenantId)
                    .sequenceType("QUOTE")
                    .currentValue(1)
                    .build();
            try {
                seq = tenantSequenceRepository.saveAndFlush(seq);
                nextVal = 1;
            } catch (Exception e) {
                seq = tenantSequenceRepository
                        .findByTenantIdAndSequenceTypeForUpdate(tenantId, "QUOTE")
                        .orElseThrow(() -> new IllegalStateException("Failed to initialize or lock sequence for QUOTE"));
                nextVal = seq.getCurrentValue() + 1;
                seq.setCurrentValue(nextVal);
                tenantSequenceRepository.saveAndFlush(seq);
            }
        } else {
            nextVal = seq.getCurrentValue() + 1;
            seq.setCurrentValue(nextVal);
            tenantSequenceRepository.saveAndFlush(seq);
        }

        String quoteNumber = "QT-" + String.format("%04d", nextVal);

        Quote quote = Quote.builder()
                .tenantId(tenantId)
                .leadId(dto.getLeadId())
                .quoteNumber(quoteNumber)
                .status(QuoteStatus.DRAFT)
                .templateName(dto.getTemplateName() != null ? dto.getTemplateName() : "MINIMALIST")
                .subtotal(subtotal)
                .discount(discount)
                .tax(tax)
                .total(total)
                .clientNotes(dto.getClientNotes())
                .termsConditions(dto.getTermsConditions())
                .items(items)
                .build();

        quote = quoteRepository.save(quote);
        return regenerateAndUploadPdf(quote);
    }

    public Quote updateQuoteStatus(UUID id, QuoteStatus status, UUID tenantId) {
        Quote quote = getQuoteById(id, tenantId);
        quote.setStatus(status);
        quote = quoteRepository.save(quote);
        return regenerateAndUploadPdf(quote);
    }

    public Quote markAsViewed(UUID id, UUID tenantId) {
        Quote quote = getQuoteById(id, tenantId);
        // Only transition to VIEWED if it's currently DRAFT or SENT to avoid regressing ACCEPTED/REJECTED statuses
        if (quote.getStatus() == QuoteStatus.DRAFT || quote.getStatus() == QuoteStatus.SENT) {
            quote.setStatus(QuoteStatus.VIEWED);
            quote = quoteRepository.save(quote);
            return regenerateAndUploadPdf(quote);
        }
        return quote;
    }

    public Quote approveQuote(UUID id, UUID tenantId, UUID userId) {
        Quote quote = getQuoteById(id, tenantId);

        if (quote.getStatus() == QuoteStatus.ACCEPTED) {
            return quote;
        }

        quote.setStatus(QuoteStatus.ACCEPTED);
        quote.setApprovedAt(LocalDateTime.now());
        quote = quoteRepository.save(quote);

        // Promote Lead Status in CRM to BOOKED
        leadService.updateLeadStatus(quote.getLeadId(), LeadStatus.BOOKED, tenantId, userId);

        quote = regenerateAndUploadPdf(quote);

        // Trigger booking creation in event-service
        triggerBookingCreation(quote.getId(), tenantId);

        return quote;
    }

    private void triggerBookingCreation(UUID quoteId, UUID tenantId) {
        ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        String authHeader = (attr != null) ? attr.getRequest().getHeader("Authorization") : null;

        try {
            HttpHeaders headers = new HttpHeaders();
            if (authHeader != null) {
                headers.set("Authorization", authHeader);
            }
            headers.set("X-Tenant-ID", tenantId.toString());
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            RestTemplate restTemplate = new RestTemplate();
            restTemplate.exchange(
                    "http://localhost:8083/api/v1/events/bookings/from-quote/" + quoteId.toString(),
                    HttpMethod.POST,
                    entity,
                    Map.class);
            log.info("Successfully triggered booking creation for quote {} in event-service", quoteId);
        } catch (Exception e) {
            log.error("Failed to auto-provision booking for quote {} in event-service: {}", quoteId, e.getMessage());
        }
    }

    public Quote rejectQuote(UUID id, UUID tenantId) {
        Quote quote = getQuoteById(id, tenantId);
        quote.setStatus(QuoteStatus.REJECTED);
        quote = quoteRepository.save(quote);
        return regenerateAndUploadPdf(quote);
    }

    public Quote regenerateAndUploadPdf(Quote quote) {
        try {
            Lead lead = leadRepository.findByIdAndTenantIdAndIsDeletedFalse(quote.getLeadId(), quote.getTenantId())
                    .orElse(null);
            byte[] pdfBytes = pdfGenerationService.generateQuotePdf(quote, lead);
            String fileName = "quote_" + quote.getTenantId() + "_" + quote.getQuoteNumber();
            String pdfUrl = cloudinaryService.uploadPdf(pdfBytes, fileName);
            quote.setPdfUrl(pdfUrl);
            return quoteRepository.save(quote);
        } catch (Exception e) {
            log.error("Failed to generate and upload proposal PDF for quote {}: {}", quote.getQuoteNumber(), e.getMessage());
            // Do not fail the outer transaction, return saved quote record
            return quote;
        }
    }

    @Transactional(readOnly = true)
    public List<Quote> getQuotesByClientEmail(String email, UUID tenantId) {
        List<Lead> leads = leadRepository.findByEmailIgnoreCaseAndTenantIdAndIsDeletedFalse(email, tenantId);
        List<Quote> quotes = new ArrayList<>();
        for (Lead lead : leads) {
            quotes.addAll(quoteRepository.findAllByLeadIdAndTenantId(lead.getId(), tenantId));
        }
        return quotes;
    }
}
