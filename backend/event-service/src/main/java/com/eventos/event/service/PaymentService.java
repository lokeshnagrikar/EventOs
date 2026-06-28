package com.eventos.event.service;

import com.eventos.event.dto.CreatePaymentDto;
import com.eventos.event.entity.*;
import com.eventos.event.event.PaymentRecordedEvent;
import com.eventos.event.repository.*;
import com.eventos.event.repository.InvoiceHistoryRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
@SuppressWarnings("null")
public class PaymentService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PaymentService.class);

    @org.springframework.beans.factory.annotation.Value("${service.crm.base-url:http://localhost:8082/api/v1}")
    private String crmServiceBaseUrl;

    private final org.springframework.web.reactive.function.client.WebClient webClient = 
        org.springframework.web.reactive.function.client.WebClient.builder().build();

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;
    private final TransactionRepository transactionRepository;
    private final BookingAssignmentRepository bookingAssignmentRepository;
    private final InvoiceHistoryRepository invoiceHistoryRepository;
    private final EventRepository eventRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final RabbitTemplate rabbitTemplate;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository,
                          InvoiceRepository invoiceRepository,
                          TransactionRepository transactionRepository,
                          BookingAssignmentRepository bookingAssignmentRepository,
                          InvoiceHistoryRepository invoiceHistoryRepository,
                          EventRepository eventRepository,
                          StringRedisTemplate redisTemplate,
                          ObjectMapper objectMapper,
                          RabbitTemplate rabbitTemplate) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.invoiceRepository = invoiceRepository;
        this.transactionRepository = transactionRepository;
        this.bookingAssignmentRepository = bookingAssignmentRepository;
        this.invoiceHistoryRepository = invoiceHistoryRepository;
        this.eventRepository = eventRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Transactional(readOnly = true)
    public List<Payment> getAllPayments(UUID tenantId) {
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        String rolesStr = principal.getRoles();
        List<String> roles = java.util.stream.Stream.of(rolesStr.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .toList();

        if (roles.contains("OWNER") || roles.contains("ADMIN") || roles.contains("MANAGER")) {
            return paymentRepository.findAllByTenantIdOrderByPaymentDateDesc(tenantId);
        } else if (roles.contains("STAFF")) {
            List<com.eventos.event.entity.BookingAssignment> assignments = 
                bookingAssignmentRepository.findStaffAssignments(principal.getEmail(), principal.getUserId().toString());
            List<UUID> bookingIds = assignments.stream().map(com.eventos.event.entity.BookingAssignment::getBookingId).toList();
            if (bookingIds.isEmpty()) {
                return java.util.Collections.emptyList();
            }
            return paymentRepository.findAllByBookingIdInAndTenantIdOrderByPaymentDateDesc(bookingIds, tenantId);
        } else if (roles.contains("CLIENT")) {
            return paymentRepository.findAllByClientEmailAndTenantId(principal.getEmail(), tenantId);
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: Unknown role");
    }

    @Transactional(readOnly = true)
    public Page<Payment> getAllPayments(UUID tenantId, Pageable pageable) {
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        String rolesStr = principal.getRoles();
        List<String> roles = java.util.stream.Stream.of(rolesStr.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .toList();

        if (roles.contains("OWNER") || roles.contains("ADMIN") || roles.contains("MANAGER")) {
            return paymentRepository.findAllByTenantIdOrderByPaymentDateDesc(tenantId, pageable);
        } else if (roles.contains("STAFF")) {
            List<com.eventos.event.entity.BookingAssignment> assignments = 
                bookingAssignmentRepository.findStaffAssignments(principal.getEmail(), principal.getUserId().toString());
            List<UUID> bookingIds = assignments.stream().map(com.eventos.event.entity.BookingAssignment::getBookingId).toList();
            if (bookingIds.isEmpty()) {
                return Page.empty(pageable);
            }
            return paymentRepository.findAllByBookingIdInAndTenantIdOrderByPaymentDateDesc(bookingIds, tenantId, pageable);
        } else if (roles.contains("CLIENT")) {
            return paymentRepository.findAllByClientEmailAndTenantId(principal.getEmail(), tenantId, pageable);
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: Unknown role");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentStats(UUID tenantId) {
        String cacheKey = "events:stats:payments:" + tenantId.toString();
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
        List<Object[]> statusCounts = paymentRepository.countByStatusAndTenantId(tenantId);
        List<Object[]> methodCountsAndSums = paymentRepository.countAndSumByPaymentMethodAndTenantId(tenantId);
        
        BigDecimal totalCredits = transactionRepository.sumAmountByTenantIdAndType(tenantId, "CREDIT");
        BigDecimal totalRefunds = transactionRepository.sumAmountByTenantIdAndType(tenantId, "REFUND");
        BigDecimal netRevenue = totalCredits.subtract(totalRefunds);

        List<Object[]> monthlyRev = paymentRepository.getMonthlyRevenueByTenantId(tenantId);

        Map<String, Long> byStatus = new java.util.HashMap<>();
        for (Object[] row : statusCounts) {
            if (row[0] != null) {
                byStatus.put(row[0].toString(), (Long) row[1]);
            }
        }

        Map<String, Map<String, Object>> byMethod = new java.util.HashMap<>();
        for (Object[] row : methodCountsAndSums) {
            if (row[0] != null) {
                Map<String, Object> methodStats = new java.util.HashMap<>();
                methodStats.put("count", row[1]);
                methodStats.put("sum", row[2]);
                byMethod.put(row[0].toString(), methodStats);
            }
        }

        Map<String, BigDecimal> monthlyRevenue = new java.util.LinkedHashMap<>();
        for (Object[] row : monthlyRev) {
            if (row[0] != null) {
                BigDecimal amt = row[1] instanceof BigDecimal ? (BigDecimal) row[1] : BigDecimal.valueOf(((Number) row[1]).doubleValue());
                monthlyRevenue.put(row[0].toString(), amt);
            }
        }

        long totalPayments = byStatus.values().stream().mapToLong(Long::longValue).sum();

        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalPayments", totalPayments);
        stats.put("byStatus", byStatus);
        stats.put("byMethod", byMethod);
        stats.put("totalVolume", totalCredits);
        stats.put("totalRefunds", totalRefunds);
        stats.put("netRevenue", netRevenue);
        stats.put("monthlyRevenue", monthlyRevenue);

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
                redisTemplate.delete("events:stats:payments:" + tenantId.toString());
            } catch (Exception e) {
                System.err.println("Redis evict failed: " + e.getMessage());
            }
        }
        if (tenantId != null) {
            org.springframework.web.context.request.ServletRequestAttributes attr = 
                (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            String authHeader = (attr != null) ? attr.getRequest().getHeader("Authorization") : null;
            
            webClient.delete()
                .uri(crmServiceBaseUrl + "/dashboard/metrics/cache")
                .headers(headers -> {
                    if (authHeader != null) {
                        headers.set("Authorization", authHeader);
                    }
                })
                .retrieve()
                .toBodilessEntity()
                .subscribe(
                    response -> {},
                    error -> System.out.println("Failed to invalidate dashboard cache in event-service payment: " + error.getMessage())
                );
        }
    }

    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByBooking(UUID bookingId, UUID tenantId) {
        bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found or access denied"));
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        validateBookingAccess(bookingId, principal);
        return paymentRepository.findAllByBookingIdAndTenantIdOrderByPaymentDateDesc(bookingId, tenantId);
    }

    @Transactional(readOnly = true)
    public Payment getPaymentById(UUID id, UUID tenantId) {
        Payment payment = paymentRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found or access denied"));
        checkPaymentAccess(payment);
        return payment;
    }
    public Payment savePayment(CreatePaymentDto dto, UUID tenantId) {
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        validateBookingAccess(dto.getBookingId(), principal);

        Booking booking = bookingRepository.findByIdAndTenantId(dto.getBookingId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found or access denied"));

        // Enforce state transition check on Booking
        String bookingStatus = booking.getStatus().toString().toUpperCase();
        if (List.of("CANCELLED", "COMPLETED").contains(bookingStatus)) {
            throw new IllegalStateException("Cannot record payment for booking in final state: " + bookingStatus);
        }

        // Enforce state transition check on Invoice
        if (dto.getInvoiceId() != null) {
            Invoice invoice = invoiceRepository.findByIdAndTenantId(dto.getInvoiceId(), tenantId)
                    .orElseThrow(() -> new IllegalArgumentException("Invoice not found or access denied"));
            String invoiceStatus = invoice.getStatus().toUpperCase();
            if (List.of("PAID", "VOIDED", "CANCELLED").contains(invoiceStatus)) {
                throw new IllegalStateException("Cannot record payment for invoice in final state: " + invoiceStatus);
            }
        }

        // Validate and normalize payment method
        String method = dto.getPaymentMethod();
        if (method == null || method.trim().isEmpty()) {
            throw new IllegalArgumentException("Payment method is required");
        }
        String cleanMethod = method.trim();
        boolean validMethod = false;
        String matchedMethod = null;
        for (String m : List.of("UPI", "Bank transfer", "Cash", "Credit card")) {
            if (m.equalsIgnoreCase(cleanMethod)) {
                validMethod = true;
                matchedMethod = m;
                break;
            }
        }
        if (!validMethod) {
            if ("BANK_TRANSFER".equalsIgnoreCase(cleanMethod)) {
                validMethod = true;
                matchedMethod = "Bank transfer";
            } else if ("CREDIT_CARD".equalsIgnoreCase(cleanMethod) || "CARD".equalsIgnoreCase(cleanMethod)) {
                validMethod = true;
                matchedMethod = "Credit card";
            } else if ("CASH".equalsIgnoreCase(cleanMethod)) {
                validMethod = true;
                matchedMethod = "Cash";
            } else if ("UPI".equalsIgnoreCase(cleanMethod)) {
                validMethod = true;
                matchedMethod = "UPI";
            }
        }
        if (!validMethod) {
            throw new IllegalArgumentException("Invalid payment method: " + method + ". Allowed: UPI, Bank transfer, Cash, Credit card");
        }

        String status = dto.getStatus() != null ? dto.getStatus().toUpperCase() : "COMPLETED";
        if ("SUCCESSFUL".equals(status)) {
            status = "COMPLETED";
        }

        // Defense-in-depth: CLIENT role must never produce a COMPLETED payment
        // (which would auto-confirm invoices and bookings). Downgrade to PENDING_VERIFICATION.
        String rolesStr = principal.getRoles() != null ? principal.getRoles() : "";
        boolean isClientOnly = java.util.stream.Stream.of(rolesStr.split(","))
                .map(String::trim).map(String::toUpperCase)
                .anyMatch(r -> r.equals("CLIENT"))
                && !java.util.stream.Stream.of(rolesStr.split(","))
                        .map(String::trim).map(String::toUpperCase)
                        .anyMatch(r -> r.equals("OWNER") || r.equals("ADMIN") || r.equals("MANAGER") || r.equals("STAFF"));
        if (isClientOnly && "COMPLETED".equals(status)) {
            status = "PENDING_VERIFICATION";
        }

        Payment payment = Payment.builder()
                .bookingId(dto.getBookingId())
                .invoiceId(dto.getInvoiceId())
                .amount(dto.getAmount())
                .paymentMethod(matchedMethod)
                .transactionReference(dto.getTransactionReference())
                .status(status)
                .paymentDate(dto.getPaymentDate())
                .notes(dto.getNotes())
                .build();
        payment.setTenantId(tenantId);

        Payment saved = paymentRepository.save(payment);

        // Record financial ledger transaction
        if ("COMPLETED".equals(status)) {
            Transaction tx = Transaction.builder()
                    .bookingId(dto.getBookingId())
                    .invoiceId(dto.getInvoiceId())
                    .paymentId(saved.getId())
                    .amount(dto.getAmount())
                    .type("CREDIT")
                    .description("Payment recorded against Booking: " + booking.getBookingNumber() + " (Method: " + matchedMethod + ")")
                    .transactionDate(dto.getPaymentDate())
                    .build();
            tx.setTenantId(tenantId);
            transactionRepository.save(tx);
        } else if ("REFUNDED".equals(status)) {
            Transaction tx = Transaction.builder()
                    .bookingId(dto.getBookingId())
                    .invoiceId(dto.getInvoiceId())
                    .paymentId(saved.getId())
                    .amount(dto.getAmount())
                    .type("REFUND")
                    .description("Refund processed against Booking: " + booking.getBookingNumber())
                    .transactionDate(dto.getPaymentDate())
                    .build();
            tx.setTenantId(tenantId);
            transactionRepository.save(tx);
        }

        // Update Booking Paid Amount
        recalculateBookingPaidAmount(booking.getId(), tenantId);

        // Update Invoice Paid Amount if invoiceId is set
        if (dto.getInvoiceId() != null) {
            recalculateInvoicePaidAmount(dto.getInvoiceId(), tenantId);
        }

        if ("COMPLETED".equals(status)) {
            try {
                PaymentRecordedEvent event = PaymentRecordedEvent.builder()
                        .paymentId(saved.getId())
                        .tenantId(tenantId)
                        .bookingId(saved.getBookingId())
                        .invoiceId(saved.getInvoiceId())
                        .amount(saved.getAmount())
                        .paymentMethod(saved.getPaymentMethod())
                        .transactionReference(saved.getTransactionReference())
                        .paymentDate(saved.getPaymentDate())
                        .build();
                rabbitTemplate.convertAndSend(com.eventos.event.config.MessagingConfig.EXCHANGE, com.eventos.event.config.MessagingConfig.PAYMENT_RECORDED_ROUTING_KEY, event);
                log.info("Published PaymentRecordedEvent for Payment ID: {}", saved.getId());
            } catch (Exception e) {
                log.error("Failed to publish PaymentRecordedEvent for Payment ID: {}", saved.getId(), e);
            }
        }

        evictCache(tenantId);
        return saved;
    }

    public void deletePayment(UUID id, UUID tenantId) {
        Payment payment = getPaymentById(id, tenantId);

        // Enforce transition checks
        String currentStatus = payment.getStatus().toUpperCase();
        if (List.of("VOIDED", "CANCELLED", "COMPLETED", "SUCCESSFUL").contains(currentStatus)) {
            throw new IllegalStateException("Cannot void a payment that is already " + currentStatus);
        }

        // Soft void logic
        payment.setStatus("VOIDED");
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        payment.setVoidedBy(principal.getUserId());
        payment.setVoidedAt(java.time.LocalDateTime.now());
        payment.setVoidReason("Payment voided by user");
        paymentRepository.save(payment);

        // Record reversing transaction in financial ledger using optimized repository check
        List<Transaction> txs = transactionRepository.findByPaymentIdAndTenantId(payment.getId(), tenantId);
        for (Transaction tx : txs) {
            String reverseType = "DEBIT";
            if ("DEBIT".equals(tx.getType())) {
                reverseType = "CREDIT";
            } else if ("REFUND".equals(tx.getType())) {
                reverseType = "CREDIT";
            }
            Transaction revTx = Transaction.builder()
                    .bookingId(tx.getBookingId())
                    .invoiceId(tx.getInvoiceId())
                    .paymentId(payment.getId())
                    .amount(tx.getAmount())
                    .type(reverseType)
                    .description("Reversal of transaction " + tx.getId() + " due to payment voiding")
                    .transactionDate(java.time.LocalDateTime.now())
                    .build();
            revTx.setTenantId(tenantId);
            transactionRepository.save(revTx);
        }

        // Update Booking Paid Amount
        recalculateBookingPaidAmount(payment.getBookingId(), tenantId);

        // Update Invoice Paid Amount if invoiceId is set
        if (payment.getInvoiceId() != null) {
            recalculateInvoicePaidAmount(payment.getInvoiceId(), tenantId);
        }

        evictCache(tenantId);
    }

    private void recalculateBookingPaidAmount(UUID bookingId, UUID tenantId) {
        Booking booking = bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        List<Payment> payments = paymentRepository.findAllByBookingIdAndStatusIn(bookingId, List.of("SUCCESSFUL", "COMPLETED"));
        BigDecimal sum = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        booking.setPaidAmount(sum);

        // Auto-promote status to CONFIRMED if positive payment balance is recorded
        if (booking.getStatus() == BookingStatus.PENDING && booking.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            booking.setStatus(BookingStatus.CONFIRMED);
        }

        bookingRepository.save(booking);
    }

    private void recalculateInvoicePaidAmount(UUID invoiceId, UUID tenantId) {
        Invoice invoice = invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        List<Payment> payments = paymentRepository.findAllByInvoiceIdAndStatusIn(invoiceId, List.of("SUCCESSFUL", "COMPLETED"));
        BigDecimal sum = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        invoice.setPaidAmount(sum);

        String status;
        // Update Invoice Status based on payments
        if (sum.compareTo(BigDecimal.ZERO) == 0) {
            status = "PENDING";
        } else if (sum.compareTo(invoice.getTotalAmount()) >= 0) {
            status = "PAID";
        } else {
            status = "PARTIALLY_PAID";
        }
        invoice.setStatus(status);

        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Log Invoice History
        InvoiceHistory history = InvoiceHistory.builder()
                .invoiceId(invoiceId)
                .status(status)
                .action("PAYMENT_RECORDED")
                .notes("Payment recorded and reconciled. Paid amount: " + sum)
                .actionBy("SYSTEM")
                .build();
        history.setTenantId(tenantId);
        invoiceHistoryRepository.save(history);

        // Auto-confirm event when invoice is marked PAID
        if ("PAID".equals(status)) {
            Booking booking = bookingRepository.findByIdAndTenantId(savedInvoice.getBookingId(), tenantId).orElse(null);
            if (booking != null && booking.getEventId() != null) {
                Event eventObj = eventRepository.findByIdAndTenantId(booking.getEventId(), tenantId).orElse(null);
                if (eventObj != null && eventObj.getStatus() == EventStatus.PLANNING) {
                    eventObj.setStatus(EventStatus.CONFIRMED);
                    eventRepository.save(eventObj);
                    log.info("Event ID {} status promoted to CONFIRMED automatically as Invoice ID {} is fully PAID", eventObj.getId(), savedInvoice.getId());
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByClientEmail(String clientEmail, UUID tenantId) {
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        if (!principal.getEmail().equalsIgnoreCase(clientEmail)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: Email mismatch");
        }
        return paymentRepository.findAllByClientEmailAndTenantId(clientEmail, tenantId);
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

    private void checkPaymentAccess(Payment payment) {
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        if (!payment.getTenantId().equals(principal.getTenantId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Access denied to this payment");
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
                bookingAssignmentRepository.findAllByBookingIdOrderByAssignedAtDesc(payment.getBookingId());
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
            if (payment.getInvoiceId() != null) {
                Invoice invoice = invoiceRepository.findById(payment.getInvoiceId()).orElse(null);
                if (invoice != null && invoice.getClientEmail() != null && invoice.getClientEmail().equalsIgnoreCase(principal.getEmail())) {
                    return;
                }
            }
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN, "Access denied: Payment is not linked to your email");
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
            Booking booking = bookingRepository.findByIdAndTenantId(bookingId, principal.getTenantId()).orElse(null);
            if (booking != null && booking.getClientEmail() != null && booking.getClientEmail().equalsIgnoreCase(principal.getEmail())) {
                return;
            }
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
}
