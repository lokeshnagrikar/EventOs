package com.eventos.event.service;

import com.eventos.event.dto.CreateInvoiceDto;
import com.eventos.event.entity.Invoice;
import com.eventos.event.entity.TenantSequence;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.InvoiceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final BookingRepository bookingRepository;
    private final com.eventos.event.repository.TenantSequenceRepository tenantSequenceRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          BookingRepository bookingRepository,
                          com.eventos.event.repository.TenantSequenceRepository tenantSequenceRepository,
                          StringRedisTemplate redisTemplate,
                          ObjectMapper objectMapper) {
        this.invoiceRepository = invoiceRepository;
        this.bookingRepository = bookingRepository;
        this.tenantSequenceRepository = tenantSequenceRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<Invoice> getAllInvoices(UUID tenantId) {
        return invoiceRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public Page<Invoice> getAllInvoices(UUID tenantId, Pageable pageable) {
        return invoiceRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getInvoiceStats(UUID tenantId) {
        String cacheKey = "events:stats:invoices:" + tenantId.toString();
        if (redisTemplate != null) {
            try {
                String cached = redisTemplate.opsForValue().get(cacheKey);
                if (cached != null) {
                    return objectMapper.readValue(cached, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                }
            } catch (Exception e) {
                System.err.println("Redis read failed: " + e.getMessage());
            }
        }

        // Fetch from database
        List<Object[]> statusCountsAndSums = invoiceRepository.getInvoiceSumsAndCountsByStatus(tenantId);
        List<Object[]> summary = invoiceRepository.getInvoiceSummaryAndTenantId(tenantId);

        Map<String, Map<String, Object>> byStatus = new java.util.HashMap<>();
        long totalInvoices = 0;
        for (Object[] row : statusCountsAndSums) {
            if (row[0] != null) {
                Map<String, Object> statusMap = new java.util.HashMap<>();
                long count = (Long) row[1];
                statusMap.put("count", count);
                statusMap.put("sum", row[2]);
                byStatus.put(row[0].toString(), statusMap);
                totalInvoices += count;
            }
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;
        BigDecimal discount = BigDecimal.ZERO;

        if (summary != null && !summary.isEmpty()) {
            Object[] row = summary.get(0);
            if (row != null) {
                if (row[0] != null) totalAmount = (BigDecimal) row[0];
                if (row[1] != null) subtotal = (BigDecimal) row[1];
                if (row[2] != null) tax = (BigDecimal) row[2];
                if (row[3] != null) discount = (BigDecimal) row[3];
            }
        }

        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalInvoices", totalInvoices);
        stats.put("byStatus", byStatus);
        stats.put("totalAmount", totalAmount);
        stats.put("subtotal", subtotal);
        stats.put("tax", tax);
        stats.put("discount", discount);

        if (redisTemplate != null) {
            try {
                String json = objectMapper.writeValueAsString(stats);
                redisTemplate.opsForValue().set(cacheKey, json, 5, java.util.concurrent.TimeUnit.MINUTES);
            } catch (Exception e) {
                System.err.println("Redis write failed: " + e.getMessage());
            }
        }

        return stats;
    }

    private void evictCache(UUID tenantId) {
        if (redisTemplate != null) {
            try {
                redisTemplate.delete("events:stats:invoices:" + tenantId.toString());
            } catch (Exception e) {
                System.err.println("Redis evict failed: " + e.getMessage());
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Invoice> getInvoicesByBooking(UUID bookingId, UUID tenantId) {
        // Enforce boundary check on booking
        bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found or access denied"));
        return invoiceRepository.findAllByBookingIdAndTenantIdOrderByCreatedAtDesc(bookingId, tenantId);
    }

    @Transactional(readOnly = true)
    public Invoice getInvoiceById(UUID id, UUID tenantId) {
        return invoiceRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found or access denied"));
    }

    public Invoice createInvoice(CreateInvoiceDto dto, UUID tenantId) {
        bookingRepository.findByIdAndTenantId(dto.getBookingId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found or access denied"));

        // Generate sequential invoice number: INV-YYYY-XXXX using pessimistic write lock
        TenantSequence seq = tenantSequenceRepository
                .findByTenantIdAndSequenceTypeForUpdate(tenantId, "INVOICE")
                .orElse(null);

        long nextVal;
        if (seq == null) {
            seq = TenantSequence.builder()
                    .tenantId(tenantId)
                    .sequenceType("INVOICE")
                    .currentValue(1)
                    .build();
            try {
                seq = tenantSequenceRepository.saveAndFlush(seq);
                nextVal = 1;
            } catch (Exception e) {
                seq = tenantSequenceRepository
                        .findByTenantIdAndSequenceTypeForUpdate(tenantId, "INVOICE")
                        .orElseThrow(() -> new IllegalStateException("Failed to initialize or lock sequence for INVOICE"));
                nextVal = seq.getCurrentValue() + 1;
                seq.setCurrentValue(nextVal);
                tenantSequenceRepository.saveAndFlush(seq);
            }
        } else {
            nextVal = seq.getCurrentValue() + 1;
            seq.setCurrentValue(nextVal);
            tenantSequenceRepository.saveAndFlush(seq);
        }

        int year = LocalDateTime.now().getYear();
        String invoiceNumber = "INV-" + year + "-" + String.format("%04d", nextVal);

        // totalAmount = subtotal + tax - discount
        BigDecimal totalAmount = dto.getSubtotal().add(dto.getTax()).subtract(dto.getDiscount());

        Invoice invoice = Invoice.builder()
                .tenantId(tenantId)
                .bookingId(dto.getBookingId())
                .invoiceNumber(invoiceNumber)
                .subtotal(dto.getSubtotal())
                .tax(dto.getTax())
                .discount(dto.getDiscount())
                .totalAmount(totalAmount)
                .dueDate(dto.getDueDate())
                .status("DRAFT")
                .clientName(dto.getClientName())
                .clientEmail(dto.getClientEmail())
                .billingAddress(dto.getBillingAddress())
                .notes(dto.getNotes())
                .build();

        Invoice saved = invoiceRepository.save(invoice);
        evictCache(tenantId);
        return saved;
    }

    public Invoice updateInvoiceStatus(UUID id, String status, UUID tenantId) {
        Invoice invoice = getInvoiceById(id, tenantId);
        
        String cleanStatus = status.toUpperCase();
        if (!List.of("DRAFT", "SENT", "PENDING", "PARTIAL", "PAID", "OVERDUE", "REFUNDED", "CANCELLED").contains(cleanStatus)) {
            throw new IllegalArgumentException("Invalid invoice status: " + status);
        }

        invoice.setStatus(cleanStatus);
        Invoice saved = invoiceRepository.save(invoice);
        evictCache(tenantId);
        return saved;
    }

    public void deleteInvoice(UUID id, UUID tenantId) {
        Invoice invoice = getInvoiceById(id, tenantId);
        invoiceRepository.delete(invoice);
        evictCache(tenantId);
    }

    public void sendPaymentReminder(UUID id, UUID tenantId) {
        Invoice invoice = getInvoiceById(id, tenantId);
        // Log reminder sending or trigger email logic (mocked)
        System.out.println("Payment reminder sent for invoice: " + invoice.getInvoiceNumber() + " to " + invoice.getClientEmail());
        
        // Append to notes or audit trail to record the reminder
        String reminderNote = "\n[Reminder Sent: " + java.time.LocalDateTime.now().toString().replace('T', ' ').substring(0, 19) + "]";
        if (invoice.getNotes() == null) {
            invoice.setNotes("Payment reminder sent." + reminderNote);
        } else {
            invoice.setNotes(invoice.getNotes() + reminderNote);
        }
        invoiceRepository.save(invoice);
        evictCache(tenantId);
    }

    @Transactional(readOnly = true)
    public List<Invoice> getInvoicesByClientEmail(String clientEmail, UUID tenantId) {
        return invoiceRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
    }
}
