package com.eventos.event.service;

import com.eventos.event.dto.CreateBookingDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.BookingTimelineEventRepository;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.TenantSequenceRepository;
import com.eventos.event.repository.BookingAuditLogRepository;
import com.eventos.event.repository.BookingAssignmentRepository;
import com.eventos.event.repository.VendorContractRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingTimelineEventRepository bookingTimelineEventRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private TenantSequenceRepository tenantSequenceRepository;

    @Mock
    private BookingAuditLogRepository bookingAuditLogRepository;

    @Mock
    private BookingAssignmentRepository bookingAssignmentRepository;

    @Mock
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @Mock
    private InvoiceService invoiceService;

    @Mock
    private VendorContractRepository vendorContractRepository;

    @InjectMocks
    private BookingService bookingService;

    private UUID tenantId;
    private UUID eventId;
    private Event mockEvent;
    private Booking mockBooking;

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

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        eventId = UUID.randomUUID();

        mockEvent = Event.builder()
                .id(eventId)
                .name("Roy Anniversary Party")
                .type(EventType.BIRTHDAY)
                .status(EventStatus.PLANNING)
                .startDate(LocalDateTime.now().plusDays(5))
                .endDate(LocalDateTime.now().plusDays(5).plusHours(4))
                .build();
        mockEvent.setTenantId(tenantId);

        mockBooking = Booking.builder()
                .id(UUID.randomUUID())
                .eventId(eventId)
                .bookingNumber("BK-0001")
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(200000))
                .paidAmount(BigDecimal.valueOf(50000))
                .build();
        mockBooking.setTenantId(tenantId);

        setupSecurityContext("OWNER");
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    void testGetAllBookings() {
        when(bookingRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId))
                .thenReturn(Collections.singletonList(mockBooking));

        List<Booking> bookings = bookingService.getAllBookings(tenantId);

        assertNotNull(bookings);
        assertEquals(1, bookings.size());
        assertEquals("BK-0001", bookings.get(0).getBookingNumber());
        verify(bookingRepository, times(1)).findAllByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Test
    void testCreateBooking_SuccessAndMilestones() {
        CreateBookingDto dto = CreateBookingDto.builder()
                .eventId(eventId)
                .totalAmount(BigDecimal.valueOf(200000))
                .paidAmount(BigDecimal.valueOf(100000)) // 50% paid
                .contractUrl("http://s3.aws/contracts/bk0001.pdf")
                .build();

        when(eventRepository.findByIdAndTenantId(eventId, tenantId))
                .thenReturn(Optional.of(mockEvent));
        TenantSequence mockSeq = TenantSequence.builder()
                .tenantId(tenantId)
                .sequenceType("BOOKING")
                .currentValue(0L)
                .build();
        when(tenantSequenceRepository.findByTenantIdAndSequenceTypeForUpdate(tenantId, "BOOKING"))
                .thenReturn(Optional.of(mockSeq));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking result = bookingService.createBooking(dto, tenantId);

        assertNotNull(result);
        int currentYear = java.time.LocalDate.now().getYear();
        assertEquals("EVT-" + currentYear + "-000001", result.getBookingNumber());
        assertEquals(BookingStatus.CONFIRMED, result.getStatus());
        assertEquals(3, result.getTimelineEvents().size());
        
        // Assert milestone 1 is COMPLETED since 50% paid
        assertEquals("50% Advance Booking Payment", result.getTimelineEvents().get(0).getTitle());
        assertEquals("COMPLETED", result.getTimelineEvents().get(0).getStatus());

        // Assert milestone 2 is COMPLETED since contractUrl is present
        assertEquals("Contract Agreement Signature", result.getTimelineEvents().get(1).getTitle());
        assertEquals("COMPLETED", result.getTimelineEvents().get(1).getStatus());

        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    void testUpdateBookingStatus() {
        UUID bookingId = mockBooking.getId();
        mockBooking.setStatus(BookingStatus.IN_PROGRESS);
        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId))
                .thenReturn(Optional.of(mockBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking result = bookingService.updateBookingStatus(bookingId, BookingStatus.COMPLETED, tenantId);

        assertNotNull(result);
        assertEquals(BookingStatus.COMPLETED, result.getStatus());
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    void testToggleTimelineEventStatus() {
        UUID bookingId = mockBooking.getId();
        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId))
                .thenReturn(Optional.of(mockBooking));

        UUID milestoneId = UUID.randomUUID();
        BookingTimelineEvent milestone = BookingTimelineEvent.builder()
                .id(milestoneId)
                .bookingId(bookingId)
                .title("50% Advance Payment")
                .status("PENDING")
                .eventDate(LocalDateTime.now())
                .build();

        when(bookingTimelineEventRepository.findById(milestoneId)).thenReturn(Optional.of(milestone));
        when(bookingTimelineEventRepository.save(any(BookingTimelineEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookingTimelineEvent result = bookingService.toggleTimelineEventStatus(bookingId, milestoneId, tenantId);

        assertNotNull(result);
        assertEquals("COMPLETED", result.getStatus());
        verify(bookingTimelineEventRepository, times(1)).save(any(BookingTimelineEvent.class));
    }

    @Test
    void testGetBookingById_TenantIsolationSecure() {
        UUID unauthorizedTenantId = UUID.randomUUID();
        when(bookingRepository.findByIdAndTenantId(mockBooking.getId(), unauthorizedTenantId))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            bookingService.getBookingById(mockBooking.getId(), unauthorizedTenantId);
        });

        verify(bookingRepository, times(1)).findByIdAndTenantId(mockBooking.getId(), unauthorizedTenantId);
    }

    @Test
    void testUpdateBookingStatus_CancelledPublishesEvent() {
        UUID bookingId = mockBooking.getId();
        when(bookingRepository.findByIdAndTenantId(bookingId, tenantId))
                .thenReturn(Optional.of(mockBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking result = bookingService.updateBookingStatus(bookingId, BookingStatus.CANCELLED, tenantId);

        assertNotNull(result);
        assertEquals(BookingStatus.CANCELLED, result.getStatus());
        verify(bookingRepository, times(1)).save(any(Booking.class));
        verify(rabbitTemplate, times(1)).convertAndSend(
                eq("eventos.exchange"),
                eq("booking.cancelled"),
                any(com.eventos.event.event.BookingCancelledEvent.class)
        );
    }
}
