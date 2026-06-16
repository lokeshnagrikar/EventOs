package com.eventos.event.service;

import com.eventos.event.dto.CreatePaymentDto;
import com.eventos.event.entity.Booking;
import com.eventos.event.entity.BookingStatus;
import com.eventos.event.entity.Payment;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.PaymentRepository;
import com.eventos.event.repository.InvoiceRepository;
import com.eventos.event.repository.TransactionRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private PaymentService paymentService;

    private UUID tenantId;
    private UUID bookingId;
    private Booking mockBooking;
    private Payment mockPayment;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        bookingId = UUID.randomUUID();

        mockBooking = Booking.builder()
                .id(bookingId)
                .tenantId(tenantId)
                .bookingNumber("BK-0001")
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(100000))
                .paidAmount(BigDecimal.ZERO)
                .build();

        mockPayment = Payment.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .bookingId(bookingId)
                .amount(BigDecimal.valueOf(40000))
                .paymentMethod("UPI")
                .status("SUCCESSFUL")
                .paymentDate(LocalDateTime.now())
                .build();
    }

    @Test
    void testGetAllPayments() {
        when(paymentRepository.findAllByTenantIdOrderByPaymentDateDesc(tenantId))
                .thenReturn(Collections.singletonList(mockPayment));

        List<Payment> list = paymentService.getAllPayments(tenantId);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("UPI", list.get(0).getPaymentMethod());
        verify(paymentRepository, times(1)).findAllByTenantIdOrderByPaymentDateDesc(tenantId);
    }

    @Test
    void testSavePayment_RecalculatesBookingCorrectly() {
        CreatePaymentDto dto = CreatePaymentDto.builder()
                .bookingId(bookingId)
                .amount(BigDecimal.valueOf(60000))
                .paymentMethod("BANK_TRANSFER")
                .paymentDate(LocalDateTime.now())
                .notes("First advance instalment")
                .build();

        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId)).thenReturn(Optional.of(mockBooking));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When recalculating, mock repository returns list of successful payments
        Payment p1 = Payment.builder().amount(BigDecimal.valueOf(40000)).status("SUCCESSFUL").build();
        Payment p2 = Payment.builder().amount(BigDecimal.valueOf(60000)).status("SUCCESSFUL").build();
        when(paymentRepository.findAllByBookingIdAndStatus(bookingId, "SUCCESSFUL")).thenReturn(Arrays.asList(p1, p2));

        Payment saved = paymentService.savePayment(dto, tenantId);

        assertNotNull(saved);
        assertEquals("BANK_TRANSFER", saved.getPaymentMethod());
        assertEquals(0, mockBooking.getPaidAmount().compareTo(BigDecimal.valueOf(100000)));
        assertEquals(BookingStatus.CONFIRMED, mockBooking.getStatus()); // fully paid promotes status
        verify(bookingRepository, times(1)).save(mockBooking);
    }

    @Test
    void testDeletePayment() {
        UUID paymentId = mockPayment.getId();
        when(paymentRepository.findByIdAndTenantId(paymentId, tenantId)).thenReturn(Optional.of(mockPayment));
        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId)).thenReturn(Optional.of(mockBooking));
        when(paymentRepository.findAllByBookingIdAndStatus(bookingId, "SUCCESSFUL")).thenReturn(Collections.emptyList());
        when(transactionRepository.findAllByTenantIdOrderByTransactionDateDesc(tenantId)).thenReturn(Collections.emptyList());

        paymentService.deletePayment(paymentId, tenantId);

        verify(paymentRepository, times(1)).delete(mockPayment);
        assertEquals(0, mockBooking.getPaidAmount().compareTo(BigDecimal.ZERO));
        verify(bookingRepository, times(1)).save(mockBooking);
    }

    @Test
    void testSavePayment_BookingNotFoundThrowsException() {
        CreatePaymentDto dto = CreatePaymentDto.builder()
                .bookingId(bookingId)
                .amount(BigDecimal.valueOf(5000))
                .paymentDate(LocalDateTime.now())
                .build();

        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> paymentService.savePayment(dto, tenantId));
        verify(paymentRepository, never()).save(any(Payment.class));
    }
}
