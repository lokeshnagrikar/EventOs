package com.eventos.event.service;

import com.eventos.event.dto.CreateInvoiceDto;
import com.eventos.event.entity.Booking;
import com.eventos.event.entity.Invoice;
import com.eventos.event.entity.TenantSequence;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.InvoiceRepository;
import com.eventos.event.repository.TenantSequenceRepository;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TenantSequenceRepository tenantSequenceRepository;

    @Mock
    private com.eventos.event.repository.BookingAssignmentRepository bookingAssignmentRepository;

    @Mock
    private com.eventos.event.repository.InvoiceHistoryRepository invoiceHistoryRepository;

    @Mock
    private com.eventos.event.repository.PaymentRepository paymentRepository;

    @Mock
    private com.eventos.event.repository.EventRepository eventRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ObjectMapper objectMapper;

    private InvoiceService invoiceService;

    private UUID tenantId;
    private UUID bookingId;
    private Booking mockBooking;
    private Invoice mockInvoice;

    private void setupSecurityContext(String roles) {
        com.eventos.event.config.UserPrincipal principal = new com.eventos.event.config.UserPrincipal(
                UUID.randomUUID(), tenantId, "test@eventos.com", roles);
        List<org.springframework.security.core.authority.SimpleGrantedAuthority> authorities =
                java.util.Arrays.stream(roles.split(","))
                        .map(r -> new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + r.trim().toUpperCase()))
                        .toList();
        org.springframework.security.core.Authentication auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(principal, null, authorities);
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        bookingId = UUID.randomUUID();
        setupSecurityContext("OWNER");

        invoiceService = new InvoiceService(
                invoiceRepository,
                bookingRepository,
                tenantSequenceRepository,
                bookingAssignmentRepository,
                invoiceHistoryRepository,
                paymentRepository,
                eventRepository,
                redisTemplate,
                objectMapper
        );

        mockBooking = Booking.builder()
                .id(bookingId)
                .bookingNumber("BK-0001")
                .totalAmount(BigDecimal.valueOf(100000))
                .paidAmount(BigDecimal.ZERO)
                .build();
        mockBooking.setTenantId(tenantId);

        mockInvoice = Invoice.builder()
                .id(UUID.randomUUID())
                .bookingId(bookingId)
                .invoiceNumber("INV-2026-0001")
                .subtotal(BigDecimal.valueOf(90000))
                .tax(BigDecimal.valueOf(16200)) // 18% tax
                .discount(BigDecimal.valueOf(5000))
                .totalAmount(BigDecimal.valueOf(101200))
                .dueDate(LocalDateTime.now().plusDays(7))
                .status("DRAFT")
                .clientName("Sanjay Shah")
                .build();
        mockInvoice.setTenantId(tenantId);
    }

    @Test
    void testGetAllInvoices() {
        when(invoiceRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId))
                .thenReturn(Collections.singletonList(mockInvoice));

        List<Invoice> list = invoiceService.getAllInvoices(tenantId);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("INV-2026-0001", list.get(0).getInvoiceNumber());
        verify(invoiceRepository, times(1)).findAllByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Test
    void testCreateInvoice_CalculatesTotalsAndSaves() {
        CreateInvoiceDto dto = CreateInvoiceDto.builder()
                .bookingId(bookingId)
                .subtotal(BigDecimal.valueOf(50000))
                .tax(BigDecimal.valueOf(9000))
                .discount(BigDecimal.valueOf(2000))
                .dueDate(LocalDateTime.now().plusDays(10))
                .clientName("Preeti Gupta")
                .clientEmail("preeti@gmail.com")
                .billingAddress("12 Ring Road, Delhi")
                .notes("Advance milestone billing")
                .build();

        // 50000 + 9000 - 2000 = 57000
        BigDecimal expectedTotal = BigDecimal.valueOf(57000);

        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId)).thenReturn(Optional.of(mockBooking));
        TenantSequence mockSeq = TenantSequence.builder()
                .tenantId(tenantId)
                .sequenceType("INVOICE")
                .currentValue(5L)
                .build();
        when(tenantSequenceRepository.findByTenantIdAndSequenceTypeForUpdate(tenantId, "INVOICE"))
                .thenReturn(Optional.of(mockSeq));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Invoice created = invoiceService.createInvoice(dto, tenantId);

        assertNotNull(created);
        assertEquals(0, created.getTotalAmount().compareTo(expectedTotal));
        assertTrue(created.getInvoiceNumber().startsWith("INV-"));
        assertTrue(created.getInvoiceNumber().endsWith("-000006")); // count is 5, next is 6
        assertEquals("DRAFT", created.getStatus());
        assertEquals("Preeti Gupta", created.getClientName());
        verify(invoiceRepository, times(1)).save(any(Invoice.class));
    }

    @Test
    void testUpdateInvoiceStatus_ValidatesAndSaves() {
        UUID invoiceId = mockInvoice.getId();
        when(invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)).thenReturn(Optional.of(mockInvoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Invoice updated = invoiceService.updateInvoiceStatus(invoiceId, "SENT", tenantId);

        assertNotNull(updated);
        assertEquals("SENT", updated.getStatus());
        verify(invoiceRepository, times(1)).save(mockInvoice);
    }

    @Test
    void testUpdateInvoiceStatus_InvalidStatusThrowsException() {
        UUID invoiceId = mockInvoice.getId();
        when(invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)).thenReturn(Optional.of(mockInvoice));

        assertThrows(IllegalArgumentException.class, () -> invoiceService.updateInvoiceStatus(invoiceId, "INVALID_STATE", tenantId));
        verify(invoiceRepository, never()).save(any(Invoice.class));
    }

    @Test
    void testSendPaymentReminder_AppendsNoteAndSaves() {
        UUID invoiceId = mockInvoice.getId();
        when(invoiceRepository.findByIdAndTenantId(invoiceId, tenantId)).thenReturn(Optional.of(mockInvoice));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        invoiceService.sendPaymentReminder(invoiceId, tenantId);

        assertNotNull(mockInvoice.getNotes());
        assertTrue(mockInvoice.getNotes().contains("Reminder Sent"));
        verify(invoiceRepository, times(1)).save(mockInvoice);
    }
}
