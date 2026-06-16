package com.eventos.event.service;

import com.eventos.event.dto.CreateEventTaskDto;
import com.eventos.event.entity.Event;
import com.eventos.event.entity.EventStatus;
import com.eventos.event.entity.EventTask;
import com.eventos.event.entity.EventType;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.EventTaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

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
public class EventTaskTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventTaskRepository eventTaskRepository;

    @InjectMocks
    private EventService eventService;

    private UUID tenantId;
    private UUID eventId;
    private Event mockEvent;
    private EventTask mockTask;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        eventId = UUID.randomUUID();

        // Mock SecurityContextHolder so STAFF role checks don't interfere
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(new com.eventos.event.config.UserPrincipal(
                UUID.randomUUID(), tenantId, "admin@test.com", "OWNER"));
        when(auth.getAuthorities()).thenAnswer(inv ->
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        mockEvent = Event.builder()
                .id(eventId)
                .tenantId(tenantId)
                .name("Roy Anniversary Party")
                .type(EventType.BIRTHDAY)
                .status(EventStatus.PLANNED)
                .startDate(LocalDateTime.now().plusDays(5))
                .endDate(LocalDateTime.now().plusDays(5).plusHours(4))
                .build();

        mockTask = EventTask.builder()
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
        when(eventTaskRepository.findAllByEventIdOrderByDueDateAsc(eventId))
                .thenReturn(Collections.singletonList(mockTask));

        List<EventTask> tasks = eventService.getEventTasks(eventId, tenantId);

        assertNotNull(tasks);
        assertEquals(1, tasks.size());
        assertEquals("Catering Setup", tasks.get(0).getTitle());
        verify(eventTaskRepository, times(1)).findAllByEventIdOrderByDueDateAsc(eventId);
    }

    @Test
    void testAddEventTask() {
        CreateEventTaskDto dto = CreateEventTaskDto.builder()
                .title("Stage Decoration check")
                .description("Verify flower backdrop layout")
                .dueDate(LocalDateTime.now().plusDays(3))
                .assignedUserId(UUID.randomUUID())
                .assignedUserName("Jane Doe")
                .build();

        when(eventRepository.findByIdAndTenantId(eventId, tenantId))
                .thenReturn(Optional.of(mockEvent));
        when(eventTaskRepository.save(any(EventTask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Pass null authHeader — validation skipped in test context
        EventTask result = eventService.addEventTask(eventId, dto, tenantId, null);

        assertNotNull(result);
        assertEquals("Stage Decoration check", result.getTitle());
        assertFalse(result.isCompleted());
        assertEquals("Jane Doe", result.getAssignedUserName());
        verify(eventTaskRepository, times(1)).save(any(EventTask.class));
    }

    @Test
    void testToggleEventTask() {
        UUID taskId = mockTask.getId();
        when(eventRepository.findByIdAndTenantId(eventId, tenantId))
                .thenReturn(Optional.of(mockEvent));
        when(eventTaskRepository.findById(taskId))
                .thenReturn(Optional.of(mockTask));
        when(eventTaskRepository.save(any(EventTask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UUID requestingUserId = UUID.randomUUID();
        EventTask result = eventService.toggleEventTask(eventId, taskId, tenantId, requestingUserId);

        assertNotNull(result);
        assertTrue(result.isCompleted());
        verify(eventTaskRepository, times(1)).save(any(EventTask.class));
    }

    @Test
    void testDeleteEventTask() {
        UUID taskId = mockTask.getId();
        when(eventRepository.findByIdAndTenantId(eventId, tenantId))
                .thenReturn(Optional.of(mockEvent));
        when(eventTaskRepository.findById(taskId))
                .thenReturn(Optional.of(mockTask));

        eventService.deleteEventTask(eventId, taskId, tenantId);

        verify(eventTaskRepository, times(1)).delete(mockTask);
    }
}
