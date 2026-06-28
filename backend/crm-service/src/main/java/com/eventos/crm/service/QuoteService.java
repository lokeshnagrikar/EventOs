package com.eventos.crm.service;

import com.eventos.crm.config.UserPrincipal;
import com.eventos.crm.dto.CreateQuoteDto;
import com.eventos.crm.dto.CreateQuoteItemDto;
import com.eventos.crm.entity.*;
import com.eventos.crm.event.QuotePdfGenerationEvent;
import com.eventos.crm.event.QuoteAcceptedEvent;
import com.eventos.crm.repository.LeadRepository;
import com.eventos.crm.repository.QuoteRepository;
import com.eventos.crm.repository.TenantSequenceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class QuoteService {

    private static final Logger log = LoggerFactory.getLogger(QuoteService.class);

    // ─── Valid status transitions ──────────────────────────────────────────────
    private static final Map<QuoteStatus, Set<QuoteStatus>> VALID_TRANSITIONS = new EnumMap<>(QuoteStatus.class);

    static {
        VALID_TRANSITIONS.put(QuoteStatus.DRAFT,       EnumSet.of(QuoteStatus.SENT));
        VALID_TRANSITIONS.put(QuoteStatus.SENT,        EnumSet.of(QuoteStatus.VIEWED));
        VALID_TRANSITIONS.put(QuoteStatus.VIEWED,      EnumSet.of(QuoteStatus.ACCEPTED, QuoteStatus.REJECTED));
        VALID_TRANSITIONS.put(QuoteStatus.ACCEPTED,    Collections.emptySet()); // Terminal state
        VALID_TRANSITIONS.put(QuoteStatus.REJECTED,    Collections.emptySet()); // Terminal state
        VALID_TRANSITIONS.put(QuoteStatus.EXPIRED,     Collections.emptySet()); // Terminal state
    }

    private final QuoteRepository quoteRepository;
    private final LeadRepository leadRepository;
    private final LeadService leadService;
    private final TenantSequenceRepository tenantSequenceRepository;
    private final PdfGenerationService pdfGenerationService;
    private final CloudinaryService cloudinaryService;
    private final ApplicationEventPublisher eventPublisher;
    private final RabbitTemplate rabbitTemplate;

    public QuoteService(QuoteRepository quoteRepository,
                        LeadRepository leadRepository,
                        LeadService leadService,
                        TenantSequenceRepository tenantSequenceRepository,
                        PdfGenerationService pdfGenerationService,
                        CloudinaryService cloudinaryService,
                        ApplicationEventPublisher eventPublisher,
                        RabbitTemplate rabbitTemplate) {
        this.quoteRepository = quoteRepository;
        this.leadRepository = leadRepository;
        this.leadService = leadService;
        this.tenantSequenceRepository = tenantSequenceRepository;
        this.pdfGenerationService = pdfGenerationService;
        this.cloudinaryService = cloudinaryService;
        this.eventPublisher = eventPublisher;
        this.rabbitTemplate = rabbitTemplate;
    }

    // ─── Helper Methods for Role-Based Context ───────────────────────────────

    private UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        throw new AccessDeniedException("Authentication context is missing");
    }

    private boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_" + role));
    }

    private boolean isAdminOrOwner() {
        return hasRole("OWNER") || hasRole("ADMIN");
    }

    private boolean isManager() {
        return hasRole("MANAGER");
    }

    // ─── Service Layer APIs ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Quote> getAllQuotes(UUID tenantId) {
        if (hasRole("STAFF") && !isAdminOrOwner() && !isManager()) {
            UUID userId = getCurrentUser().getUserId();
            return quoteRepository.findAllByTenantIdAndAssignedUserIdOrderByCreatedAtDesc(tenantId, userId);
        }
        return quoteRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public Page<Quote> getAllQuotes(UUID tenantId, Pageable pageable) {
        if (hasRole("STAFF") && !isAdminOrOwner() && !isManager()) {
            UUID userId = getCurrentUser().getUserId();
            return quoteRepository.findAllByTenantIdAndAssignedUserIdOrderByCreatedAtDesc(tenantId, userId, pageable);
        }
        return quoteRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
    }

    @Transactional(readOnly = true)
    public Quote getQuoteById(UUID id, UUID tenantId) {
        Quote quote = quoteRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Quote not found or access denied"));

        // Enforce horizontal security boundaries
        if (hasRole("STAFF") && !isAdminOrOwner() && !isManager()) {
            UUID userId = getCurrentUser().getUserId();
            Lead lead = leadRepository.findByIdAndTenantIdAndIsDeletedFalse(quote.getLeadId(), tenantId)
                    .orElseThrow(() -> new AccessDeniedException("Access denied: Lead not found"));
            if (lead.getAssignedUserId() == null || !lead.getAssignedUserId().equals(userId)) {
                throw new AccessDeniedException("Access denied: You are not assigned to this quote's lead");
            }
        } else if (hasRole("CLIENT")) {
            UserPrincipal principal = getCurrentUser();
            UUID clientUserId = principal.getUserId();
            String clientEmail = principal.getEmail();
            
            if (principal.getTenantId() == null || !principal.getTenantId().equals(tenantId)) {
                throw new AccessDeniedException("Access denied: Tenant mismatch");
            }
            if (clientEmail == null || clientEmail.isEmpty()) {
                throw new AccessDeniedException("Access denied: Client email is missing");
            }
            if (clientUserId == null) {
                throw new AccessDeniedException("Access denied: Client user ID is missing");
            }
            
            Lead lead = leadRepository.findByIdAndTenantIdAndIsDeletedFalse(quote.getLeadId(), tenantId)
                    .orElseThrow(() -> new AccessDeniedException("Access denied: Lead not found"));
            if (lead.getContact() == null || lead.getContact().getEmail() == null || !lead.getContact().getEmail().equalsIgnoreCase(clientEmail)) {
                throw new AccessDeniedException("Access denied: This quote does not belong to you");
            }
        }

        return quote;
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

        // Quote number format QT-XXXX-v1
        String quoteNumber = "QT-" + String.format("%04d", nextVal) + "-v1";

        Quote quote = Quote.builder()
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
                .parentQuoteId(null)
                .revisionNumber(1)
                .build();
        quote.setTenantId(tenantId);

        if (items != null) {
            for (QuoteItem item : items) {
                item.setQuote(quote);
            }
            quote.setItems(items);
        }

        Quote saved = quoteRepository.save(quote);
        
        // Dispatch asynchronous PDF generation event
        eventPublisher.publishEvent(new QuotePdfGenerationEvent(this, saved.getId(), tenantId));
        return saved;
    }

    public Quote updateQuote(UUID id, CreateQuoteDto dto, UUID tenantId) {
        Quote quote = getQuoteById(id, tenantId);

        // Make accepted quotes immutable
        if (quote.getStatus() == QuoteStatus.ACCEPTED) {
            throw new IllegalStateException("Accepted quotes are immutable and cannot be updated");
        }

        // STAFF role check
        if (hasRole("STAFF") && !isAdminOrOwner() && !isManager()) {
            if (quote.getStatus() != QuoteStatus.DRAFT) {
                throw new AccessDeniedException("Staff can only update draft quotes");
            }
        }

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

        quote.setTemplateName(dto.getTemplateName() != null ? dto.getTemplateName() : "MINIMALIST");
        quote.setSubtotal(subtotal);
        quote.setDiscount(discount);
        quote.setTax(tax);
        quote.setTotal(total);
        quote.setClientNotes(dto.getClientNotes());
        quote.setTermsConditions(dto.getTermsConditions());

        quote.getItems().clear();
        if (items != null) {
            for (QuoteItem item : items) {
                item.setQuote(quote);
            }
            quote.getItems().addAll(items);
        }

        Quote saved = quoteRepository.save(quote);

        // Dispatch asynchronous PDF generation event
        eventPublisher.publishEvent(new QuotePdfGenerationEvent(this, saved.getId(), tenantId));
        return saved;
    }

    public Quote createRevision(UUID id, UUID tenantId) {
        Quote parent = getQuoteById(id, tenantId);

        int nextRevision = parent.getRevisionNumber() != null ? parent.getRevisionNumber() + 1 : 2;
        String baseNumber = parent.getQuoteNumber();
        if (baseNumber.contains("-v")) {
            baseNumber = baseNumber.substring(0, baseNumber.indexOf("-v"));
        }

        String newQuoteNumber = baseNumber + "-v" + nextRevision;

        List<QuoteItem> items = new ArrayList<>();
        for (QuoteItem parentItem : parent.getItems()) {
            items.add(QuoteItem.builder()
                    .itemName(parentItem.getItemName())
                    .description(parentItem.getDescription())
                    .unitPrice(parentItem.getUnitPrice())
                    .quantity(parentItem.getQuantity())
                    .total(parentItem.getTotal())
                    .build());
        }

        Quote revision = Quote.builder()
                .leadId(parent.getLeadId())
                .quoteNumber(newQuoteNumber)
                .status(QuoteStatus.DRAFT)
                .templateName(parent.getTemplateName())
                .subtotal(parent.getSubtotal())
                .discount(parent.getDiscount())
                .tax(parent.getTax())
                .total(parent.getTotal())
                .clientNotes(parent.getClientNotes())
                .termsConditions(parent.getTermsConditions())
                .parentQuoteId(parent.getId())
                .revisionNumber(nextRevision)
                .build();
        revision.setTenantId(tenantId);

        if (items != null) {
            for (QuoteItem item : items) {
                item.setQuote(revision);
            }
            revision.setItems(items);
        }

        Quote saved = quoteRepository.save(revision);

        // Dispatch asynchronous PDF generation event
        eventPublisher.publishEvent(new QuotePdfGenerationEvent(this, saved.getId(), tenantId));
        return saved;
    }

    public Quote updateQuoteStatus(UUID id, QuoteStatus newStatus, UUID tenantId) {
        Quote quote = getQuoteById(id, tenantId);
        QuoteStatus current = quote.getStatus();

        if (current == newStatus) {
            return quote;
        }

        // Validate state machine transitions
        Set<QuoteStatus> allowed = VALID_TRANSITIONS.getOrDefault(current, Collections.emptySet());
        if (!allowed.contains(newStatus)) {
            throw new IllegalStateException(
                    String.format("Invalid status transition from %s to %s. Allowed transitions: %s",
                            current, newStatus, allowed.isEmpty() ? "none (terminal state)" : allowed));
        }

        // Enforce staff restrictions
        if (hasRole("STAFF") && !isAdminOrOwner() && !isManager()) {
            throw new AccessDeniedException("Staff do not have permissions to modify quote status");
        }

        quote.setStatus(newStatus);
        Quote saved = quoteRepository.save(quote);

        // Dispatch asynchronous PDF generation event
        eventPublisher.publishEvent(new QuotePdfGenerationEvent(this, saved.getId(), tenantId));
        return saved;
    }

    public Quote markAsViewed(UUID id, UUID tenantId) {
        Quote quote = getQuoteById(id, tenantId);
        if (quote.getStatus() == QuoteStatus.SENT) {
            return updateQuoteStatus(id, QuoteStatus.VIEWED, tenantId);
        }
        return quote;
    }

    public Quote approveQuote(UUID id, UUID tenantId, UUID userId) {
        Quote quote = getQuoteById(id, tenantId);

        if (quote.getStatus() == QuoteStatus.ACCEPTED) {
            return quote;
        }

        // Ensure approval validation follows transitions
        updateQuoteStatus(id, QuoteStatus.ACCEPTED, tenantId);

        quote.setApprovedAt(LocalDateTime.now());
        Quote saved = quoteRepository.save(quote);

        // Promote Lead Status in CRM to WON
        leadService.updateLeadStatus(saved.getLeadId(), LeadStatus.WON, tenantId, userId);

        // Trigger booking creation asynchronously via RabbitMQ
        triggerBookingCreation(saved.getId(), tenantId);

        return saved;
    }

    public Quote rejectQuote(UUID id, UUID tenantId) {
        Quote quote = getQuoteById(id, tenantId);
        if (quote.getStatus() == QuoteStatus.REJECTED) {
            return quote;
        }

        updateQuoteStatus(id, QuoteStatus.REJECTED, tenantId);
        return quote;
    }

    // ─── Async PDF generation and upload handler ──────────────────────────────

    public void generateAndUploadPdfInBackground(UUID quoteId, UUID tenantId) throws Exception {
        Quote quote = quoteRepository.findByIdAndTenantId(quoteId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Quote not found in thread context"));

        Lead lead = leadRepository.findByIdAndTenantIdAndIsDeletedFalse(quote.getLeadId(), tenantId)
                .orElse(null);

        byte[] pdfBytes = pdfGenerationService.generateQuotePdf(quote, lead);
        String fileName = "quote_" + quote.getTenantId() + "_" + quote.getQuoteNumber();
        String pdfUrl = cloudinaryService.uploadPdf(pdfBytes, fileName);
        
        quote.setPdfUrl(pdfUrl);
        quoteRepository.save(quote);
        log.info("Finished background PDF update for quote: {}", quote.getQuoteNumber());
    }

    private void triggerBookingCreation(UUID quoteId, UUID tenantId) {
        Quote quote = quoteRepository.findByIdAndTenantId(quoteId, tenantId).orElse(null);
        if (quote == null) return;
        Lead lead = leadRepository.findByIdAndTenantIdAndIsDeletedFalse(quote.getLeadId(), tenantId).orElse(null);
        if (lead == null) return;

        List<QuoteAcceptedEvent.QuoteItemDto> itemDtos = quote.getItems().stream()
                .map(item -> QuoteAcceptedEvent.QuoteItemDto.builder()
                        .itemName(item.getItemName())
                        .description(item.getDescription())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());
        QuoteAcceptedEvent event = QuoteAcceptedEvent.builder()
                .quoteId(quoteId)
                .tenantId(tenantId)
                .leadId(quote.getLeadId())
                .customerId(lead.getContact() != null ? lead.getContact().getId() : null)
                .clientId(lead.getContact() != null ? lead.getContact().getId() : null)
                .quoteNumber(quote.getQuoteNumber())
                .totalAmount(quote.getTotal())
                .contractUrl(quote.getPdfUrl())
                .clientName(lead.getName())
                .clientEmail(lead.getContact() != null ? lead.getContact().getEmail() : null)
                .clientPhone(lead.getContact() != null ? lead.getContact().getPhone() : null)
                .eventName(lead.getName())
                .eventType(lead.getEventType())
                .eventDate(lead.getEventDate() != null ? lead.getEventDate().toString() : null)
                .items(itemDtos)
                .build();

        rabbitTemplate.convertAndSend("eventos.exchange", "quote.accepted", event);
        log.info("Published QuoteAcceptedEvent to RabbitMQ. Quote ID: {}", quoteId);
    }

    @Transactional
    public Quote createQuoteFromEvent(com.eventos.crm.event.BudgetConvertedToLeadEvent event) {
        if (quoteRepository.existsById(event.getQuoteId())) {
            log.warn("Quote with ID {} already exists. Skipping creation.", event.getQuoteId());
            return quoteRepository.findById(event.getQuoteId()).orElse(null);
        }
        log.info("Asynchronously creating Quote from event for Lead ID: {}", event.getLeadId());

        UUID tenantId = event.getTenantId();
        
        // Map items
        List<QuoteItem> items = new ArrayList<>();

        // Catering line item
        if (event.getCateringTotal() != null && event.getCateringTotal().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal qty = BigDecimal.valueOf(event.getGuestCount());
            items.add(QuoteItem.builder()
                    .itemName("Catering Service (" + event.getEventType() + ")")
                    .description("Per-plate catering fee for " + event.getGuestCount() + " guests.")
                    .unitPrice(event.getCateringTotal().divide(qty, 2, RoundingMode.HALF_UP))
                    .quantity(event.getGuestCount())
                    .total(event.getCateringTotal())
                    .build());
        }

        // Venue line item
        if (event.getVenueTotal() != null && event.getVenueTotal().compareTo(BigDecimal.ZERO) > 0) {
            items.add(QuoteItem.builder()
                    .itemName("Venue Rental (" + event.getVenueType() + ")")
                    .description("Venue lease flat rate pricing.")
                    .unitPrice(event.getVenueTotal())
                    .quantity(1)
                    .total(event.getVenueTotal())
                    .build());
        }

        // Decor line item
        if (event.getDecorTotal() != null && event.getDecorTotal().compareTo(BigDecimal.ZERO) > 0) {
            items.add(QuoteItem.builder()
                    .itemName("Decoration Package (" + event.getDecorStyle() + ")")
                    .description("Full themed layout installation.")
                    .unitPrice(event.getDecorTotal())
                    .quantity(1)
                    .total(event.getDecorTotal())
                    .build());
        }

        // Add-ons/Effects item
        if (event.getEffectsTotal() != null && event.getEffectsTotal().compareTo(BigDecimal.ZERO) > 0) {
            items.add(QuoteItem.builder()
                    .itemName("Effects & Add-ons Packages")
                    .description("Integrated setup: " + event.getEffectsList())
                    .unitPrice(event.getEffectsTotal())
                    .quantity(1)
                    .total(event.getEffectsTotal())
                    .build());
        }

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

        String quoteNumber = "QT-" + String.format("%04d", nextVal) + "-v1";

        Quote quote = Quote.builder()
                .id(event.getQuoteId()) // pre-generated UUID
                .leadId(event.getLeadId())
                .quoteNumber(quoteNumber)
                .status(QuoteStatus.DRAFT)
                .templateName("MINIMALIST")
                .subtotal(event.getSubTotal())
                .discount(BigDecimal.ZERO)
                .tax(event.getTaxTotal())
                .total(event.getGrandTotal())
                .clientNotes("Generated automatically from online Budget Estimate tool.")
                .termsConditions("Standard EventOS Terms and Conditions apply.")
                .parentQuoteId(null)
                .revisionNumber(1)
                .build();
        quote.setTenantId(tenantId);

        if (items != null) {
            for (QuoteItem item : items) {
                item.setQuote(quote);
            }
            quote.setItems(items);
        }

        Quote saved = quoteRepository.save(quote);
        eventPublisher.publishEvent(new QuotePdfGenerationEvent(this, saved.getId(), tenantId));
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Quote> getQuotesByClientEmail(String email, UUID tenantId) {
        List<Lead> leads = leadRepository.findByContactEmailIgnoreCaseAndTenantIdAndIsDeletedFalse(email, tenantId);
        List<Quote> quotes = new ArrayList<>();
        for (Lead lead : leads) {
            quotes.addAll(quoteRepository.findAllByLeadIdAndTenantId(lead.getId(), tenantId));
        }
        return quotes;
    }
}
