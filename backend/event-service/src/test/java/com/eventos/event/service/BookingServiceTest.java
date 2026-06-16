package com.eventos.event.service;

import com.eventos.event.dto.CreateBookingDto;
import com.eventos.event.dto.CreateBookingTimelineEventDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.BookingTimelineEventRepository;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.TenantSequenceRepository;
import com.eventos.event.repository.BookingAuditLogRepository;
import com.eventos.event.repository.BookingAssignmentRepository;
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

    @InjectMocks
    private BookingService bookingService;

    private UUID tenantId;
    private UUID eventId;
    private Event mockEvent;
    private Booking mockBooking;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        eventId = UUID.randomUUID();

        mockEvent = Event.builder()
                .id(eventId)
                .tenantId(tenantId)
                .name("Roy Anniversary Party")
                .type(EventType.BIRTHDAY)
                .status(EventStatus.PLANNED)
                .startDate(LocalDateTime.now().plusDays(5))
                .endDate(LocalDateTime.now().plusDays(5).plusHours(4))
                .build();

        mockBooking = Booking.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .eventId(eventId)
                .bookingNumber("BK-0001")
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(200000))
                .paidAmount(BigDecimal.valueOf(50000))
                .build();
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
        assertEquals("BK-0001", result.getBookingNumber());
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
}
