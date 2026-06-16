package com.eventos.event.service;

import com.eventos.event.dto.AssignTeamMemberDto;
import com.eventos.event.dto.CreateEventDto;
import com.eventos.event.dto.CreateTimelineItemDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.EventAssignmentRepository;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.EventTimelineItemRepository;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.InvoiceRepository;
import com.eventos.event.repository.EventTaskRepository;
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
public class EventServiceTest {

        @Mock
        private EventRepository eventRepository;

        @Mock
        private EventAssignmentRepository eventAssignmentRepository;

        @Mock
        private EventTimelineItemRepository eventTimelineItemRepository;

        @Mock
        private BookingRepository bookingRepository;

        @Mock
        private InvoiceRepository invoiceRepository;

        @Mock
        private EventTaskRepository eventTaskRepository;

        @Mock
        private StringRedisTemplate redisTemplate;

        @Mock
        private ObjectMapper objectMapper;

        @InjectMocks
        private EventService eventService;

        private UUID tenantId;
        private Event mockEvent;

        @BeforeEach
        void setUp() {
                tenantId = UUID.randomUUID();

                mockEvent = Event.builder()
                                .id(UUID.randomUUID())
                                .tenantId(tenantId)
                                .name("Shyam's Wedding Ceremony")
                                .type(EventType.WEDDING)
                                .status(EventStatus.DRAFT)
                                .startDate(LocalDateTime.now().plusDays(2))
                                .endDate(LocalDateTime.now().plusDays(2).plusHours(6))
                                .location("Radisson Blu Hall")
                                .budget(BigDecimal.valueOf(1200000))
                                .notes("Decoration setup needs pink theme flowers.")
                                .build();
        }

        @Test
        void testGetAllEvents() {
                when(eventRepository.findAllByTenantIdOrderByStartDateAsc(tenantId))
                                .thenReturn(Collections.singletonList(mockEvent));

                List<Event> events = eventService.getAllEvents(tenantId, null, null);

                assertNotNull(events);
                assertEquals(1, events.size());
                assertEquals("Shyam's Wedding Ceremony", events.get(0).getName());
                verify(eventRepository, times(1)).findAllByTenantIdOrderByStartDateAsc(tenantId);
        }

        @Test
        void testCreateEvent_Success() {
                CreateEventDto dto = CreateEventDto.builder()
                                .name("Annual Tech Corporate Summit")
                                .type(EventType.CORPORATE)
                                .startDate(LocalDateTime.now().plusDays(10))
                                .endDate(LocalDateTime.now().plusDays(10).plusHours(8))
                                .location("Tech Park Auditorium")
                                .budget(BigDecimal.valueOf(500000))
                                .build();

                Event savedEvent = Event.builder()
                                .id(UUID.randomUUID())
                                .tenantId(tenantId)
                                .name(dto.getName())
                                .type(dto.getType())
                                .status(EventStatus.DRAFT)
                                .startDate(dto.getStartDate())
                                .endDate(dto.getEndDate())
                                .location(dto.getLocation())
                                .budget(dto.getBudget())
                                .build();

                when(eventRepository.save(any(Event.class))).thenReturn(savedEvent);

                Event result = eventService.createEvent(dto, tenantId);

                assertNotNull(result);
                assertEquals(EventStatus.DRAFT, result.getStatus());
                assertEquals("Annual Tech Corporate Summit", result.getName());
                verify(eventRepository, times(1)).save(any(Event.class));
        }

        @Test
        void testCreateEvent_DateMismatchThrowsException() {
                CreateEventDto dto = CreateEventDto.builder()
                                .name("Engagement Party")
                                .type(EventType.ENGAGEMENT)
                                .startDate(LocalDateTime.now().plusDays(5))
                                .endDate(LocalDateTime.now().plusDays(4)) // End date is before start date
                                .build();

                assertThrows(IllegalArgumentException.class, () -> {
                        eventService.createEvent(dto, tenantId);
                });

                verify(eventRepository, never()).save(any(Event.class));
        }

        @Test
        void testGetEventById_TenantIsolationSecure() {
                UUID otherTenantId = UUID.randomUUID();
                when(eventRepository.findByIdAndTenantId(mockEvent.getId(), otherTenantId))
                                .thenReturn(Optional.empty());

                assertThrows(IllegalArgumentException.class, () -> {
                        eventService.getEventById(mockEvent.getId(), otherTenantId);
                });

                verify(eventRepository, times(1)).findByIdAndTenantId(mockEvent.getId(), otherTenantId);
        }

        @Test
        void testAddTimelineItem() {
                UUID eventId = mockEvent.getId();
                when(eventRepository.findByIdAndTenantId(eventId, tenantId))
                                .thenReturn(Optional.of(mockEvent));

                CreateTimelineItemDto dto = CreateTimelineItemDto.builder()
                                .title("Stage Decor Check")
                                .description("Verify flowers and audio placement")
                                .scheduledTime(LocalDateTime.now().plusDays(2).plusHours(1))
                                .build();

                EventTimelineItem savedItem = EventTimelineItem.builder()
                                .id(UUID.randomUUID())
                                .eventId(eventId)
                                .title(dto.getTitle())
                                .description(dto.getDescription())
                                .scheduledTime(dto.getScheduledTime())
                                .completed(false)
                                .build();

                when(eventTimelineItemRepository.save(any(EventTimelineItem.class))).thenReturn(savedItem);

                EventTimelineItem result = eventService.addTimelineItem(eventId, dto, tenantId);

                assertNotNull(result);
                assertFalse(result.isCompleted());
                assertEquals("Stage Decor Check", result.getTitle());
                verify(eventTimelineItemRepository, times(1)).save(any(EventTimelineItem.class));
        }

        @Test
        void testToggleTimelineItemCompletion() {
                UUID eventId = mockEvent.getId();
                when(eventRepository.findByIdAndTenantId(eventId, tenantId))
                                .thenReturn(Optional.of(mockEvent));

                UUID itemId = UUID.randomUUID();
                EventTimelineItem mockItem = EventTimelineItem.builder()
                                .id(itemId)
                                .eventId(eventId)
                                .title("Vendor check-in")
                                .completed(false)
                                .build();

                when(eventTimelineItemRepository.findById(itemId)).thenReturn(Optional.of(mockItem));
                when(eventTimelineItemRepository.save(any(EventTimelineItem.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                EventTimelineItem result = eventService.toggleTimelineItemCompletion(eventId, itemId, tenantId);

                assertNotNull(result);
                assertTrue(result.isCompleted());
                verify(eventTimelineItemRepository, times(1)).save(any(EventTimelineItem.class));
        }

        @Test
        void testAssignTeamMember() {
                UUID eventId = mockEvent.getId();
                when(eventRepository.findByIdAndTenantId(eventId, tenantId))
                                .thenReturn(Optional.of(mockEvent));

                AssignTeamMemberDto dto = AssignTeamMemberDto.builder()
                                .userId(UUID.randomUUID())
                                .userName("Aditya Sen")
                                .role("Lead Photographer")
                                .build();

                EventAssignment savedAssignment = EventAssignment.builder()
                                .id(UUID.randomUUID())
                                .eventId(eventId)
                                .userId(dto.getUserId())
                                .userName(dto.getUserName())
                                .role(dto.getRole())
                                .build();

                when(eventAssignmentRepository.save(any(EventAssignment.class))).thenReturn(savedAssignment);

                EventAssignment result = eventService.assignTeamMember(eventId, dto, tenantId, null);

                assertNotNull(result);
                assertEquals("Aditya Sen", result.getUserName());
                assertEquals("Lead Photographer", result.getRole());
                verify(eventAssignmentRepository, times(1)).save(any(EventAssignment.class));
        }

        @Test
        void testGetEventsByClientEmail_Success() {
                String clientEmail = "client@example.com";
                UUID bookingId = UUID.randomUUID();
                Invoice mockInvoice = Invoice.builder()
                                .id(UUID.randomUUID())
                                .tenantId(tenantId)
                                .bookingId(bookingId)
                                .clientEmail(clientEmail)
                                .build();
                Booking mockBooking = Booking.builder()
                                .id(bookingId)
                                .tenantId(tenantId)
                                .eventId(mockEvent.getId())
                                .build();

                when(invoiceRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail,
                                tenantId))
                                .thenReturn(Collections.singletonList(mockInvoice));
                when(bookingRepository.findByIdAndTenantId(bookingId, tenantId))
                                .thenReturn(Optional.of(mockBooking));
                when(eventRepository.findByIdAndTenantId(mockEvent.getId(), tenantId))
                                .thenReturn(Optional.of(mockEvent));

                List<Event> results = eventService.getEventsByClientEmail(clientEmail, tenantId);

                assertNotNull(results);
                assertEquals(1, results.size());
                assertEquals("Shyam's Wedding Ceremony", results.get(0).getName());
                verify(invoiceRepository, times(1))
                                .findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
                verify(bookingRepository, times(1)).findByIdAndTenantId(bookingId, tenantId);
                verify(eventRepository, times(1)).findByIdAndTenantId(mockEvent.getId(), tenantId);
        }

        @Test
        void testGetTimelineItemsByClientEmail_Success() {
                String clientEmail = "client@example.com";
                UUID bookingId = UUID.randomUUID();
                Invoice mockInvoice = Invoice.builder()
                                .id(UUID.randomUUID())
                                .tenantId(tenantId)
                                .bookingId(bookingId)
                                .clientEmail(clientEmail)
                                .build();
                Booking mockBooking = Booking.builder()
                                .id(bookingId)
                                .tenantId(tenantId)
                                .eventId(mockEvent.getId())
                                .build();
                EventTimelineItem timelineItem = EventTimelineItem.builder()
                                .id(UUID.randomUUID())
                                .eventId(mockEvent.getId())
                                .title("Flower Check")
                                .completed(false)
                                .build();

                when(invoiceRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail,
                                tenantId))
                                .thenReturn(Collections.singletonList(mockInvoice));
                when(bookingRepository.findByIdAndTenantId(bookingId, tenantId))
                                .thenReturn(Optional.of(mockBooking));
                when(eventTimelineItemRepository.findAllByEventIdOrderByScheduledTimeAsc(mockEvent.getId()))
                                .thenReturn(Collections.singletonList(timelineItem));

                List<EventTimelineItem> results = eventService.getTimelineItemsByClientEmail(clientEmail, tenantId);

                assertNotNull(results);
                assertEquals(1, results.size());
                assertEquals("Flower Check", results.get(0).getTitle());
                verify(invoiceRepository, times(1))
                                .findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
                verify(bookingRepository, times(1)).findByIdAndTenantId(bookingId, tenantId);
                verify(eventTimelineItemRepository, times(1))
                                .findAllByEventIdOrderByScheduledTimeAsc(mockEvent.getId());
        }
}
