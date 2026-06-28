package com.eventos.event.service;

import com.eventos.event.dto.CreateTimelineTaskDto;
import com.eventos.event.entity.Event;
import com.eventos.event.entity.EventStatus;
import com.eventos.event.entity.TimelineTask;
import com.eventos.event.entity.EventType;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.TimelineTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TimelineTaskTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private TimelineTaskRepository timelineTaskRepository;

    @Mock
    private com.eventos.event.repository.EventTimelineItemRepository eventTimelineItemRepository;

    @Mock
    private com.eventos.event.repository.EventAssignmentRepository eventAssignmentRepository;

    @Mock
    private com.eventos.event.repository.BookingRepository bookingRepository;

    @Mock
    private com.eventos.event.repository.InvoiceRepository invoiceRepository;

    @Mock
    private org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    @Mock
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Mock
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    private EventService eventService;

    private UUID tenantId;
    private UUID eventId;
    private Event mockEvent;
    private TimelineTask mockTask;

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @BeforeEach
    void setUp() {
        eventService = new EventService(
                eventRepository,
                eventAssignmentRepository,
                eventTimelineItemRepository,
                timelineTaskRepository,
                bookingRepository,
                invoiceRepository,
                redisTemplate,
                objectMapper,
                rabbitTemplate
        );

        tenantId = UUID.randomUUID();
        eventId = UUID.randomUUID();

        // Use real UsernamePasswordAuthenticationToken so Mockito strict stubbing doesn't complain about unused stubbings
        com.eventos.event.config.UserPrincipal principal = new com.eventos.event.config.UserPrincipal(
                UUID.randomUUID(), tenantId, "admin@test.com", "OWNER");
        List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER"));
        Authentication auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(principal, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);

        mockEvent = Event.builder()
                .id(eventId)
                .name("Roy Anniversary Party")
                .type(EventType.BIRTHDAY)
                .status(EventStatus.PLANNING)
                .startDate(LocalDateTime.now().plusDays(5))
                .endDate(LocalDateTime.now().plusDays(5).plusHours(4))
                .build();
        mockEvent.setTenantId(tenantId);

        mockTask = TimelineTask.builder()
                .id(UUID.randomUUID())
                .eventId(eventId)
                .title("Catering Setup")
                .description("Coordinate with caterer for buffet stations")
                .dueDate(LocalDateTime.now().plusDays(4))
                .completed(false)
                .assignedUserId(UUID.randomUUID())
                .assignedUserName("John Doe")
                .build();
    }

    @Test
    void testGetEventTasks() {
        when(eventRepository.findByIdAndTenantId(eventId, tenantId))
                .thenReturn(Optional.of(mockEvent));
        when(timelineTaskRepository.findAllByEventIdOrderByDueDateAsc(eventId))
                .thenReturn(Collections.singletonList(mockTask));

        List<TimelineTask> tasks = eventService.getEventTasks(eventId, tenantId);

        assertNotNull(tasks);
        assertEquals(1, tasks.size());
        assertEquals("Catering Setup", tasks.get(0).getTitle());
        verify(timelineTaskRepository, times(1)).findAllByEventIdOrderByDueDateAsc(eventId);
    }

    @Test
    void testAddEventTask() {
        CreateTimelineTaskDto dto = CreateTimelineTaskDto.builder()
                .title("Stage Decoration check")
                .description("Verify flower backdrop layout")
                .dueDate(LocalDateTime.now().plusDays(3))
                .assignedUserId(UUID.randomUUID())
                .assignedUserName("Jane Doe")
                .build();

        when(eventRepository.findByIdAndTenantId(eventId, tenantId))
                .thenReturn(Optional.of(mockEvent));
        when(timelineTaskRepository.save(any(TimelineTask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Pass null authHeader — validation skipped in test context
        TimelineTask result = eventService.addEventTask(eventId, dto, tenantId, null);

        assertNotNull(result);
        assertEquals("Stage Decoration check", result.getTitle());
        assertFalse(result.isCompleted());
        assertEquals("Jane Doe", result.getAssignedUserName());
        verify(timelineTaskRepository, times(1)).save(any(TimelineTask.class));
    }

    @Test
    void testToggleEventTask() {
        UUID taskId = mockTask.getId();
        when(eventRepository.findByIdAndTenantId(eventId, tenantId))
                .thenReturn(Optional.of(mockEvent));
        when(timelineTaskRepository.findById(taskId))
                .thenReturn(Optional.of(mockTask));
        when(timelineTaskRepository.save(any(TimelineTask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UUID requestingUserId = UUID.randomUUID();
        TimelineTask result = eventService.toggleEventTask(eventId, taskId, tenantId, requestingUserId);

        assertNotNull(result);
        assertTrue(result.isCompleted());
        verify(timelineTaskRepository, times(1)).save(any(TimelineTask.class));
    }

    @Test
    void testDeleteEventTask() {
        UUID taskId = mockTask.getId();
        when(eventRepository.findByIdAndTenantId(eventId, tenantId))
                .thenReturn(Optional.of(mockEvent));
        when(timelineTaskRepository.findById(taskId))
                .thenReturn(Optional.of(mockTask));

        eventService.deleteEventTask(eventId, taskId, tenantId);

        verify(timelineTaskRepository, times(1)).delete(mockTask);
    }
}
