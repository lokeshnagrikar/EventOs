package com.eventos.event.service;

import com.eventos.event.entity.Booking;
import com.eventos.event.entity.BookingStatus;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class BookingConcurrencySecurityTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private com.eventos.event.repository.BookingAuditLogRepository bookingAuditLogRepository;

    @InjectMocks
    private BookingService bookingService;

    private UUID tenantId;
    private UUID bookingId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        bookingId = UUID.randomUUID();
    }

    @Test
    @DisplayName("2Q-01A: Two concurrent payment requests exceeding remaining balance - one succeeds, one rejected")
    void testConcurrentPaymentsExceedingRemaining_PreventsOverCollection() throws Exception {
        // Total = 40,000, AlreadyPaid = 10,000, Remaining = 30,000
        Booking booking = Booking.builder()
                .id(bookingId)
                .bookingNumber("BK-CONCURRENCY-1")
                .status(BookingStatus.CONFIRMED)
                .totalAmount(new BigDecimal("40000.00"))
                .paidAmount(new BigDecimal("10000.00"))
                .version(0L)
                .build();
        booking.setTenantId(tenantId);

        // Simulate row-level locking (PESSIMISTIC_WRITE):
        // When locked and fetched, the thread sees current state. Once updated, subsequent thread sees updated state.
        when(bookingRepository.findByIdAndTenantIdForUpdate(bookingId, tenantId)).thenAnswer(invocation -> {
            // Returns the synchronized instance of the booking
            return Optional.of(booking);
        });
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(2);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger rejectedCount = new AtomicInteger(0);

        Callable<Void> task = () -> {
            startLatch.await();
            try {
                // Each request attempts 25,000
                synchronized (booking) {
                    bookingService.updatePaidAmount(bookingId, new BigDecimal("25000.00"), tenantId);
                }
                successCount.incrementAndGet();
            } catch (ResponseStatusException e) {
                if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                    rejectedCount.incrementAndGet();
                }
            } finally {
                doneLatch.countDown();
            }
            return null;
        };

        executor.submit(task);
        executor.submit(task);

        startLatch.countDown();
        boolean completed = doneLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(completed, "Concurrent payment tasks did not complete within timeout");
        assertEquals(1, successCount.get(), "Exactly one payment should have succeeded");
        assertEquals(1, rejectedCount.get(), "The second payment exceeding remaining balance must be rejected");
        assertEquals(new BigDecimal("35000.00"), booking.getPaidAmount(), "Final paid amount must be exactly 35,000.00 (<= 40,000.00)");
        assertTrue(booking.getPaidAmount().compareTo(booking.getTotalAmount()) <= 0, "Paid amount must never exceed total amount");
    }

    @Test
    @DisplayName("2Q-01B: Negative payment amount is rejected with 400 BAD_REQUEST")
    void testNegativePaymentAmountRejected() {
        assertThrows(ResponseStatusException.class, () -> {
            bookingService.updatePaidAmount(bookingId, new BigDecimal("-500.00"), tenantId);
        });
    }

    @Test
    @DisplayName("2Q-01C: Zero payment amount is rejected with 400 BAD_REQUEST")
    void testZeroPaymentAmountRejected() {
        assertThrows(ResponseStatusException.class, () -> {
            bookingService.updatePaidAmount(bookingId, BigDecimal.ZERO, tenantId);
        });
    }

    @Test
    @DisplayName("2Q-01D: Payment exceeding remaining balance on single request is rejected")
    void testPaymentExceedingRemainingRejected() {
        Booking booking = Booking.builder()
                .id(bookingId)
                .bookingNumber("BK-101")
                .status(BookingStatus.CONFIRMED)
                .totalAmount(new BigDecimal("10000.00"))
                .paidAmount(new BigDecimal("8000.00"))
                .build();
        booking.setTenantId(tenantId);

        when(bookingRepository.findByIdAndTenantIdForUpdate(bookingId, tenantId)).thenReturn(Optional.of(booking));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            bookingService.updatePaidAmount(bookingId, new BigDecimal("3000.00"), tenantId);
        });
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("exceeds remaining booking balance"));
    }

    @Test
    @DisplayName("2Q-01E: Payment on already fully paid booking is rejected")
    void testPaymentOnFullyPaidBookingRejected() {
        Booking booking = Booking.builder()
                .id(bookingId)
                .bookingNumber("BK-102")
                .status(BookingStatus.CONFIRMED)
                .totalAmount(new BigDecimal("10000.00"))
                .paidAmount(new BigDecimal("10000.00"))
                .build();
        booking.setTenantId(tenantId);

        when(bookingRepository.findByIdAndTenantIdForUpdate(bookingId, tenantId)).thenReturn(Optional.of(booking));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            bookingService.updatePaidAmount(bookingId, new BigDecimal("100.00"), tenantId);
        });
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("already fully settled"));
    }

    @Test
    @DisplayName("2Q-01F: Cross-tenant payment update is rejected with 404 NOT_FOUND")
    void testCrossTenantPaymentRejected() {
        UUID unauthorizedTenantId = UUID.randomUUID();
        when(bookingRepository.findByIdAndTenantIdForUpdate(bookingId, unauthorizedTenantId)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            bookingService.updatePaidAmount(bookingId, new BigDecimal("500.00"), unauthorizedTenantId);
        });
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }
}
