package com.eventos.event.service;

import com.eventos.event.dto.CreateInvoiceDto;
import com.eventos.event.entity.Invoice;
import com.eventos.event.entity.TenantSequence;
import com.eventos.event.entity.InvoiceHistory;
import com.eventos.event.entity.Event;
import com.eventos.event.entity.EventStatus;
import com.eventos.event.entity.Booking;
import com.eventos.event.entity.BookingStatus;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.InvoiceRepository;
import com.eventos.event.repository.BookingAssignmentRepository;
import com.eventos.event.repository.InvoiceHistoryRepository;
import com.eventos.event.repository.PaymentRepository;
import com.eventos.event.repository.EventRepository;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.io.ByteArrayOutputStream;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
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
@SuppressWarnings("null")
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final BookingRepository bookingRepository;
    private final com.eventos.event.repository.TenantSequenceRepository tenantSequenceRepository;
    private final BookingAssignmentRepository bookingAssignmentRepository;
    private final InvoiceHistoryRepository invoiceHistoryRepository;
    private final PaymentRepository paymentRepository;
    private final EventRepository eventRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          BookingRepository bookingRepository,
                          com.eventos.event.repository.TenantSequenceRepository tenantSequenceRepository,
                          BookingAssignmentRepository bookingAssignmentRepository,
                          InvoiceHistoryRepository invoiceHistoryRepository,
                          PaymentRepository paymentRepository,
                          EventRepository eventRepository,
                          StringRedisTemplate redisTemplate,
                          ObjectMapper objectMapper) {
        this.invoiceRepository = invoiceRepository;
        this.bookingRepository = bookingRepository;
        this.tenantSequenceRepository = tenantSequenceRepository;
        this.bookingAssignmentRepository = bookingAssignmentRepository;
        this.invoiceHistoryRepository = invoiceHistoryRepository;
        this.paymentRepository = paymentRepository;
        this.eventRepository = eventRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<Invoice> getAllInvoices(UUID tenantId) {
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        String rolesStr = principal.getRoles();
        List<String> roles = java.util.stream.Stream.of(rolesStr.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .toList();

        if (roles.contains("OWNER") || roles.contains("ADMIN") || roles.contains("MANAGER")) {
            return invoiceRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);
        } else if (roles.contains("STAFF")) {
            List<com.eventos.event.entity.BookingAssignment> assignments = 
                bookingAssignmentRepository.findStaffAssignments(principal.getEmail(), principal.getUserId().toString());
            List<UUID> bookingIds = assignments.stream().map(com.eventos.event.entity.BookingAssignment::getBookingId).toList();
            if (bookingIds.isEmpty()) {
                return java.util.Collections.emptyList();
            }
            return invoiceRepository.findAllByBookingIdInAndTenantIdOrderByCreatedAtDesc(bookingIds, tenantId);
        } else if (roles.contains("CLIENT")) {
            return invoiceRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(principal.getEmail(), tenantId);
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: Unknown role");
    }

    @Transactional(readOnly = true)
    public Page<Invoice> getAllInvoices(UUID tenantId, Pageable pageable) {
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        String rolesStr = principal.getRoles();
        List<String> roles = java.util.stream.Stream.of(rolesStr.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .toList();

        if (roles.contains("OWNER") || roles.contains("ADMIN") || roles.contains("MANAGER")) {
            return invoiceRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
        } else if (roles.contains("STAFF")) {
            List<com.eventos.event.entity.BookingAssignment> assignments = 
                bookingAssignmentRepository.findStaffAssignments(principal.getEmail(), principal.getUserId().toString());
            List<UUID> bookingIds = assignments.stream().map(com.eventos.event.entity.BookingAssignment::getBookingId).toList();
            if (bookingIds.isEmpty()) {
                return Page.empty(pageable);
            }
            return invoiceRepository.findAllByBookingIdInAndTenantIdOrderByCreatedAtDesc(bookingIds, tenantId, pageable);
        } else if (roles.contains("CLIENT")) {
            return invoiceRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(principal.getEmail(), tenantId, pageable);
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: Unknown role");
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
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        validateBookingAccess(bookingId, principal);
        return invoiceRepository.findAllByBookingIdAndTenantIdOrderByCreatedAtDesc(bookingId, tenantId);
    }

    @Transactional(readOnly = true)
    public Invoice getInvoiceById(UUID id, UUID tenantId) {
        Invoice invoice = invoiceRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found or access denied"));
        checkInvoiceAccess(invoice);
        return invoice;
    }

    private void logInvoiceHistory(UUID invoiceId, String status, String action, String notes, UUID tenantId) {
        com.eventos.event.config.UserPrincipal principal = null;
        try {
            principal = getCurrentPrincipal();
        } catch (Exception e) {
            // Can happen when automatically triggered by RabbitMQ/Quote acceptance
        }
        String actionBy = (principal != null) ? principal.getEmail() : "SYSTEM";
        InvoiceHistory history = InvoiceHistory.builder()
                .invoiceId(invoiceId)
                .status(status)
                .action(action)
                .notes(notes)
                .actionBy(actionBy)
                .build();
        history.setTenantId(tenantId);
        invoiceHistoryRepository.save(history);
    }

    public Invoice createInvoice(CreateInvoiceDto dto, UUID tenantId) {
        bookingRepository.findByIdAndTenantId(dto.getBookingId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found or access denied"));

        // Generate sequential invoice number: INV-YYYY-XXXXXX using pessimistic write lock
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
        String invoiceNumber = "INV-" + year + "-" + String.format("%06d", nextVal);

        // Tax calculation: if taxRate is provided, calculate tax = subtotal * (taxRate / 100)
        BigDecimal tax = dto.getTax();
        if (dto.getTaxRate() != null && dto.getTaxRate().compareTo(BigDecimal.ZERO) > 0) {
            tax = dto.getSubtotal().multiply(dto.getTaxRate()).divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP);
        }

        // totalAmount = subtotal + tax - discount
        BigDecimal totalAmount = dto.getSubtotal().add(tax).subtract(dto.getDiscount());

        Invoice invoice = Invoice.builder()
                .bookingId(dto.getBookingId())
                .invoiceNumber(invoiceNumber)
                .subtotal(dto.getSubtotal())
                .tax(tax)
                .discount(dto.getDiscount())
                .totalAmount(totalAmount)
                .dueDate(dto.getDueDate())
                .status("DRAFT")
                .clientName(dto.getClientName())
                .clientEmail(dto.getClientEmail())
                .billingAddress(dto.getBillingAddress())
                .notes(dto.getNotes())
                .build();
        invoice.setTenantId(tenantId);

        Invoice saved = invoiceRepository.save(invoice);

        // Log Invoice History
        logInvoiceHistory(saved.getId(), "DRAFT", "CREATED", "Invoice generated automatically", tenantId);

        evictCache(tenantId);
        return saved;
    }

    public Invoice updateInvoiceStatus(UUID id, String status, UUID tenantId) {
        Invoice invoice = getInvoiceById(id, tenantId);

        String currentStatus = invoice.getStatus().toUpperCase();
        if (List.of("PAID", "VOIDED", "CANCELLED", "COMPLETED").contains(currentStatus)) {
            throw new IllegalStateException("Cannot update status of invoice that is already " + currentStatus);
        }

        String cleanStatus = status.toUpperCase();
        if (!List.of("DRAFT", "SENT", "PENDING", "PARTIAL", "PARTIALLY_PAID", "PAID", "OVERDUE", "REFUNDED", "CANCELLED", "VOIDED").contains(cleanStatus)) {
            throw new IllegalArgumentException("Invalid invoice status: " + status);
        }

        invoice.setStatus(cleanStatus);
        Invoice saved = invoiceRepository.save(invoice);

        // Log Invoice History
        logInvoiceHistory(saved.getId(), cleanStatus, "STATUS_UPDATE", "Status updated manually from " + currentStatus + " to " + cleanStatus, tenantId);

        evictCache(tenantId);
        return saved;
    }

    public void deleteInvoice(UUID id, UUID tenantId) {
        Invoice invoice = getInvoiceById(id, tenantId);

        // Enforce transition checks
        String currentStatus = invoice.getStatus().toUpperCase();
        if (List.of("PAID", "VOIDED", "CANCELLED", "COMPLETED").contains(currentStatus)) {
            throw new IllegalStateException("Cannot void an invoice that is already " + currentStatus);
        }

        // Soft void logic
        invoice.setStatus("VOIDED");
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        invoice.setVoidedBy(principal.getUserId());
        invoice.setVoidedAt(LocalDateTime.now());
        invoice.setVoidReason("Invoice deleted by user");

        Invoice saved = invoiceRepository.save(invoice);

        // Log Invoice History
        logInvoiceHistory(saved.getId(), "VOIDED", "VOIDED", "Invoice deleted by user", tenantId);

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
        Invoice saved = invoiceRepository.save(invoice);

        // Log Invoice History
        logInvoiceHistory(saved.getId(), saved.getStatus(), "REMINDER_SENT", "Payment reminder sent to " + saved.getClientEmail(), tenantId);

        evictCache(tenantId);
    }

    @Transactional(readOnly = true)
    public List<Invoice> getInvoicesByClientEmail(String clientEmail, UUID tenantId) {
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        if (!principal.getEmail().equalsIgnoreCase(clientEmail)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: Email mismatch");
        }
        return invoiceRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
    }

    // --- Helper Security Methods ---

    private com.eventos.event.config.UserPrincipal getCurrentPrincipal() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.event.config.UserPrincipal) {
            return (com.eventos.event.config.UserPrincipal) auth.getPrincipal();
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.UNAUTHORIZED, "Authentication context is missing");
    }

    private void checkInvoiceAccess(Invoice invoice) {
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        if (!invoice.getTenantId().equals(principal.getTenantId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Access denied to this invoice");
        }

        String rolesStr = principal.getRoles();
        if (rolesStr == null || rolesStr.isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: No roles assigned");
        }

        List<String> roles = java.util.stream.Stream.of(rolesStr.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .toList();

        if (roles.contains("OWNER") || roles.contains("ADMIN") || roles.contains("MANAGER")) {
            return;
        }

        if (roles.contains("STAFF")) {
            boolean assigned = false;
            List<com.eventos.event.entity.BookingAssignment> assignments = 
                bookingAssignmentRepository.findAllByBookingIdOrderByAssignedAtDesc(invoice.getBookingId());
            for (com.eventos.event.entity.BookingAssignment assignment : assignments) {
                if ("STAFF".equalsIgnoreCase(assignment.getResourceType()) &&
                        (principal.getEmail().equalsIgnoreCase(assignment.getResourceName()) ||
                                principal.getUserId().toString().equalsIgnoreCase(assignment.getResourceName()))) {
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: You are not assigned to this booking");
            }
            return;
        }

        if (roles.contains("CLIENT")) {
            if (invoice.getClientEmail() != null && invoice.getClientEmail().equalsIgnoreCase(principal.getEmail())) {
                return;
            }
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: Invoice is not linked to your email");
        }

        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: Unknown role");
    }

    private void validateBookingAccess(UUID bookingId, com.eventos.event.config.UserPrincipal principal) {
        String rolesStr = principal.getRoles();
        if (rolesStr == null || rolesStr.isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: No roles assigned");
        }

        List<String> roles = java.util.stream.Stream.of(rolesStr.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .toList();

        if (roles.contains("OWNER") || roles.contains("ADMIN") || roles.contains("MANAGER")) {
            return;
        }

        if (roles.contains("STAFF")) {
            boolean assigned = false;
            List<com.eventos.event.entity.BookingAssignment> assignments = 
                bookingAssignmentRepository.findAllByBookingIdOrderByAssignedAtDesc(bookingId);
            for (com.eventos.event.entity.BookingAssignment assignment : assignments) {
                if ("STAFF".equalsIgnoreCase(assignment.getResourceType()) &&
                        (principal.getEmail().equalsIgnoreCase(assignment.getResourceName()) ||
                                principal.getUserId().toString().equalsIgnoreCase(assignment.getResourceName()))) {
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: You are not assigned to this booking");
            }
            return;
        }

        if (roles.contains("CLIENT")) {
            boolean hasAccess = invoiceRepository.findAllByBookingIdAndTenantIdOrderByCreatedAtDesc(bookingId, principal.getTenantId())
                    .stream()
                    .anyMatch(invoice -> invoice.getClientEmail() != null && invoice.getClientEmail().equalsIgnoreCase(principal.getEmail()));
            if (!hasAccess) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: Booking is not linked to your account");
            }
            return;
        }
    }

    public List<InvoiceHistory> getInvoiceHistory(UUID invoiceId, UUID tenantId) {
        getInvoiceById(invoiceId, tenantId);
        return invoiceHistoryRepository.findAllByInvoiceIdAndTenantIdOrderByActionAtDesc(invoiceId, tenantId);
    }

    public byte[] generateInvoicePdf(UUID invoiceId, UUID tenantId) {
        Invoice invoice = getInvoiceById(invoiceId, tenantId);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            // Set up fonts
            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD);
            Font headerFont = new Font(Font.HELVETICA, 12, Font.BOLD);
            Font bodyFont = new Font(Font.HELVETICA, 10, Font.NORMAL);

            // Title
            Paragraph title = new Paragraph("INVOICE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Invoice details
            document.add(new Paragraph("Invoice Number: " + invoice.getInvoiceNumber(), headerFont));
            document.add(new Paragraph("Status: " + invoice.getStatus(), bodyFont));
            document.add(new Paragraph("Due Date: " + invoice.getDueDate().toString(), bodyFont));
            document.add(new Paragraph("Client Name: " + invoice.getClientName(), bodyFont));
            document.add(new Paragraph("Client Email: " + (invoice.getClientEmail() != null ? invoice.getClientEmail() : "N/A"), bodyFont));
            document.add(new Paragraph("Billing Address: " + (invoice.getBillingAddress() != null ? invoice.getBillingAddress() : "N/A"), bodyFont));
            document.add(new Paragraph("Notes: " + (invoice.getNotes() != null ? invoice.getNotes() : "N/A"), bodyFont));
            document.add(new Paragraph("\n"));

            // Table of items
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.addCell(new PdfPCell(new Phrase("Description", headerFont)));
            table.addCell(new PdfPCell(new Phrase("Amount", headerFont)));

            table.addCell(new PdfPCell(new Phrase("Subtotal", bodyFont)));
            table.addCell(new PdfPCell(new Phrase(invoice.getSubtotal().toString(), bodyFont)));

            table.addCell(new PdfPCell(new Phrase("Tax", bodyFont)));
            table.addCell(new PdfPCell(new Phrase(invoice.getTax().toString(), bodyFont)));

            table.addCell(new PdfPCell(new Phrase("Discount", bodyFont)));
            table.addCell(new PdfPCell(new Phrase(invoice.getDiscount().toString(), bodyFont)));

            table.addCell(new PdfPCell(new Phrase("Total Amount", headerFont)));
            table.addCell(new PdfPCell(new Phrase(invoice.getTotalAmount().toString(), headerFont)));

            document.add(table);

            document.close();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate PDF", e);
        }
        return baos.toByteArray();
    }

    public Invoice reconcileInvoice(UUID invoiceId, UUID tenantId) {
        Invoice invoice = getInvoiceById(invoiceId, tenantId);

        List<com.eventos.event.entity.Payment> payments = paymentRepository.findAllByInvoiceIdAndStatusIn(invoiceId, List.of("SUCCESSFUL", "COMPLETED"));
        BigDecimal sum = payments.stream()
                .map(com.eventos.event.entity.Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal oldPaid = invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO;
        invoice.setPaidAmount(sum);

        String oldStatus = invoice.getStatus();
        String newStatus;
        if (sum.compareTo(BigDecimal.ZERO) == 0) {
            if (List.of("PAID", "PARTIAL", "PARTIALLY_PAID").contains(oldStatus.toUpperCase())) {
                newStatus = "SENT";
            } else {
                newStatus = oldStatus;
            }
        } else if (sum.compareTo(invoice.getTotalAmount()) >= 0) {
            newStatus = "PAID";
        } else {
            newStatus = "PARTIALLY_PAID";
        }

        invoice.setStatus(newStatus);
        Invoice saved = invoiceRepository.save(invoice);

        // Log Invoice History
        logInvoiceHistory(saved.getId(), newStatus, "RECONCILED",
                String.format("Payment reconciled. Paid amount adjusted from %s to %s. Status changed from %s to %s",
                        oldPaid, sum, oldStatus, newStatus), tenantId);

        // Auto-confirm event when invoice is reconciled as PAID
        if ("PAID".equals(newStatus)) {
            Booking booking = bookingRepository.findByIdAndTenantId(saved.getBookingId(), tenantId).orElse(null);
            if (booking != null && booking.getEventId() != null) {
                Event eventObj = eventRepository.findByIdAndTenantId(booking.getEventId(), tenantId).orElse(null);
                if (eventObj != null && eventObj.getStatus() == EventStatus.PLANNING) {
                    eventObj.setStatus(EventStatus.CONFIRMED);
                    eventRepository.save(eventObj);
                }
            }
        }

        evictCache(tenantId);
        return saved;
    }
}

