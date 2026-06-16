package com.eventos.event.service;

import com.eventos.event.dto.CreatePaymentDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.*;
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
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;
    private final TransactionRepository transactionRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository,
                          InvoiceRepository invoiceRepository,
                          TransactionRepository transactionRepository,
                          StringRedisTemplate redisTemplate,
                          ObjectMapper objectMapper) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.invoiceRepository = invoiceRepository;
        this.transactionRepository = transactionRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<Payment> getAllPayments(UUID tenantId) {
        return paymentRepository.findAllByTenantIdOrderByPaymentDateDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public Page<Payment> getAllPayments(UUID tenantId, Pageable pageable) {
        return paymentRepository.findAllByTenantIdOrderByPaymentDateDesc(tenantId, pageable);
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
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    java.net.URL url = new java.net.URL("http://localhost:8082/api/v1/crm/dashboard/metrics/cache");
                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("DELETE");
                    if (authHeader != null) {
                        conn.setRequestProperty("Authorization", authHeader);
                    }
                    conn.setConnectTimeout(2000);
                    conn.setReadTimeout(2000);
                    conn.getResponseCode();
                } catch (Exception e) {
                    System.out.println("Failed to invalidate dashboard cache in event-service payment: " + e.getMessage());
                }
            });
        }
    }

    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByBooking(UUID bookingId, UUID tenantId) {
        bookingRepository.findByIdAndTenantId(bookingId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found or access denied"));
        return paymentRepository.findAllByBookingIdAndTenantIdOrderByPaymentDateDesc(bookingId, tenantId);
    }

    @Transactional(readOnly = true)
    public Payment getPaymentById(UUID id, UUID tenantId) {
        return paymentRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found or access denied"));
    }

    public Payment savePayment(CreatePaymentDto dto, UUID tenantId) {
        Booking booking = bookingRepository.findByIdAndTenantId(dto.getBookingId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found or access denied"));

        String status = dto.getStatus() != null ? dto.getStatus().toUpperCase() : "SUCCESSFUL";

        Payment payment = Payment.builder()
                .tenantId(tenantId)
                .bookingId(dto.getBookingId())
                .invoiceId(dto.getInvoiceId())
                .amount(dto.getAmount())
                .paymentMethod(dto.getPaymentMethod())
                .transactionReference(dto.getTransactionReference())
                .status(status)
                .paymentDate(dto.getPaymentDate())
                .notes(dto.getNotes())
                .build();

        Payment saved = paymentRepository.save(payment);

        // Record financial ledger transaction
        if ("SUCCESSFUL".equals(status)) {
            Transaction tx = Transaction.builder()
                    .tenantId(tenantId)
                    .bookingId(dto.getBookingId())
                    .invoiceId(dto.getInvoiceId())
                    .paymentId(saved.getId())
                    .amount(dto.getAmount())
                    .type("CREDIT")
                    .description("Payment recorded against Booking: " + booking.getBookingNumber() + " (Method: " + dto.getPaymentMethod() + ")")
                    .transactionDate(dto.getPaymentDate())
                    .build();
            transactionRepository.save(tx);
        } else if ("REFUNDED".equals(status)) {
            Transaction tx = Transaction.builder()
                    .tenantId(tenantId)
                    .bookingId(dto.getBookingId())
                    .invoiceId(dto.getInvoiceId())
                    .paymentId(saved.getId())
                    .amount(dto.getAmount())
                    .type("REFUND")
                    .description("Refund processed against Booking: " + booking.getBookingNumber())
                    .transactionDate(dto.getPaymentDate())
                    .build();
            transactionRepository.save(tx);
        }

        // Update Booking Paid Amount
        recalculateBookingPaidAmount(booking.getId(), tenantId);

        // Update Invoice Paid Amount if invoiceId is set
        if (dto.getInvoiceId() != null) {
            recalculateInvoicePaidAmount(dto.getInvoiceId(), tenantId);
        }

        evictCache(tenantId);
        return saved;
    }

    public void deletePayment(UUID id, UUID tenantId) {
        Payment payment = getPaymentById(id, tenantId);
        paymentRepository.delete(payment);

        // Remove transactions linked to payment
        List<Transaction> txs = transactionRepository.findAllByTenantIdOrderByTransactionDateDesc(tenantId);
        for (Transaction tx : txs) {
            if (payment.getId().equals(tx.getPaymentId())) {
                transactionRepository.delete(tx);
            }
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

        List<Payment> payments = paymentRepository.findAllByBookingIdAndStatus(bookingId, "SUCCESSFUL");
        BigDecimal sum = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        booking.setPaidAmount(sum);

        // Auto-promote status to CONFIRMED if fully paid
        if (booking.getPaidAmount().compareTo(booking.getTotalAmount()) >= 0) {
            booking.setStatus(BookingStatus.CONFIRMED);
        }

        bookingRepository.save(booking);
    }

    private void recalculateInvoicePaidAmount(UUID invoiceId, UUID tenantId) {
        Invoice invoice = invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        List<Payment> payments = paymentRepository.findAllByInvoiceIdAndStatus(invoiceId, "SUCCESSFUL");
        BigDecimal sum = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        invoice.setPaidAmount(sum);

        // Update Invoice Status based on payments
        if (sum.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus("PENDING");
        } else if (sum.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus("PAID");
        } else {
            invoice.setStatus("PARTIAL");
        }

        invoiceRepository.save(invoice);
    }

    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByClientEmail(String clientEmail, UUID tenantId) {
        List<Invoice> clientInvoices = invoiceRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
        List<UUID> bookingIds = clientInvoices.stream().map(Invoice::getBookingId).distinct().collect(java.util.stream.Collectors.toList());
        List<Payment> payments = new java.util.ArrayList<>();
        for (UUID bookingId : bookingIds) {
            payments.addAll(paymentRepository.findAllByBookingIdAndTenantIdOrderByPaymentDateDesc(bookingId, tenantId));
        }
        return payments;
    }
}
