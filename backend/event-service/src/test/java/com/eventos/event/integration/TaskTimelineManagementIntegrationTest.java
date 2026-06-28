package com.eventos.event.integration;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.CreateTimelineItemDto;
import com.eventos.event.dto.CreateTimelineTaskDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.TenantSequenceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@SuppressWarnings("null")
public class TaskTimelineManagementIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @Autowired
        private EventRepository eventRepository;

        @Autowired
        private TenantSequenceRepository tenantSequenceRepository;

        @MockBean
        private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

        private UUID tenantId;
        private Authentication auth;
        private Event eventEntity;

        @BeforeEach
        void setUp() {
                tenantId = UUID.randomUUID();

                // Setup User Principal & Auth context for OWNER role
                UserPrincipal principal = new UserPrincipal(UUID.randomUUID(), tenantId, "owner@eventos.com", "OWNER");
                auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                principal, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER")));
                org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

                // Pre-initialize sequence values to prevent constraints/null failures
                tenantSequenceRepository.save(TenantSequence.builder()
                                .tenantId(tenantId)
                                .sequenceType("BOOKING")
                                .currentValue(0)
                                .build());

                tenantSequenceRepository.save(TenantSequence.builder()
                                .tenantId(tenantId)
                                .sequenceType("INVOICE")
                                .currentValue(0)
                                .build());

                // Create a persistent event for tasks and timeline tests
                eventEntity = Event.builder()
                                .name("General Event Planning")
                                .type(EventType.WEDDING)
                                .status(EventStatus.PLANNING)
                                .startDate(LocalDateTime.now().plusDays(2))
                                .endDate(LocalDateTime.now().plusDays(4))
                                .build();
                eventEntity.setTenantId(tenantId);
                eventEntity = eventRepository.save(eventEntity);
        }

        @Test
        void testCreateTimelineItemWithMilestone() throws Exception {
                CreateTimelineItemDto dto = CreateTimelineItemDto.builder()
                                .title("Initial Stage Planning")
                                .description("Initial discussion and agenda planning")
                                .scheduledTime(LocalDateTime.now().plusDays(2).plusHours(2))
                                .milestone(MilestoneType.PLANNING)
                                .build();

                mockMvc.perform(post("/events/" + eventEntity.getId() + "/timeline")
                                .with(authentication(auth))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(dto)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.milestone", is("PLANNING")))
                                .andExpect(jsonPath("$.data.title", is("Initial Stage Planning")));
        }

        @Test
        void testTaskLifecycleWithPriorityAndStatus() throws Exception {
                // 1. Create a task with status TODO
                CreateTimelineTaskDto dto = CreateTimelineTaskDto.builder()
                                .title("Confirm Caterer Contract")
                                .description("Check pricing and menu details")
                                .dueDate(LocalDateTime.now().plusDays(3))
                                .priority(TaskPriority.HIGH)
                                .status(TaskStatus.TODO)
                                .assignedUserId(UUID.randomUUID())
                                .assignedUserName("John Doe")
                                .build();

                MvcResult createResult = mockMvc.perform(post("/events/" + eventEntity.getId() + "/tasks")
                                .with(authentication(auth))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(dto)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.status", is("TODO")))
                                .andExpect(jsonPath("$.data.priority", is("HIGH")))
                                .andExpect(jsonPath("$.data.completed", is(false)))
                                .andReturn();

                // Verify RabbitMQ TASK_ASSIGNED notification was sent
                verify(rabbitTemplate, atLeastOnce()).convertAndSend(
                                eq("eventos.exchange"),
                                eq("task.notification"),
                                any(com.eventos.event.event.TaskNotificationEvent.class));

                Map<?, ?> responseMap = objectMapper.readValue(createResult.getResponse().getContentAsString(),
                                Map.class);
                Map<?, ?> dataMap = (Map<?, ?>) responseMap.get("data");
                UUID taskId = UUID.fromString((String) dataMap.get("id"));

                // Reset rabbitTemplate mock for checking update notifications
                reset(rabbitTemplate);

                // 2. Update the task to IN_PROGRESS and priority to HIGH
                CreateTimelineTaskDto updateDto = CreateTimelineTaskDto.builder()
                                .title("Confirm Caterer Contract")
                                .description("Negotiations in progress")
                                .dueDate(LocalDateTime.now().plusDays(3))
                                .priority(TaskPriority.HIGH)
                                .status(TaskStatus.IN_PROGRESS)
                                .assignedUserId(dto.getAssignedUserId())
                                .assignedUserName("John Doe")
                                .build();

                mockMvc.perform(put("/events/" + eventEntity.getId() + "/tasks/" + taskId)
                                .with(authentication(auth))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateDto)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")))
                                .andExpect(jsonPath("$.data.completed", is(false)));

                // Verify TASK_STATUS_CHANGED notification
                verify(rabbitTemplate, times(1)).convertAndSend(
                                eq("eventos.exchange"),
                                eq("task.notification"),
                                (Object) argThat(event -> "TASK_STATUS_CHANGED"
                                                .equals(((com.eventos.event.event.TaskNotificationEvent) event)
                                                                .getEventType())));

                reset(rabbitTemplate);

                // 3. Complete the task and check completion percentage recalculation
                CreateTimelineTaskDto completeDto = CreateTimelineTaskDto.builder()
                                .title("Confirm Caterer Contract")
                                .description("Menu selected and contract signed")
                                .dueDate(LocalDateTime.now().plusDays(3))
                                .priority(TaskPriority.HIGH)
                                .status(TaskStatus.COMPLETED)
                                .build();

                mockMvc.perform(put("/events/" + eventEntity.getId() + "/tasks/" + taskId)
                                .with(authentication(auth))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(completeDto)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                                .andExpect(jsonPath("$.data.completed", is(true)));

                // Fetch the event to verify completion progress is now 100.0%
                mockMvc.perform(get("/events/" + eventEntity.getId())
                                .with(authentication(auth)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.progressPercentage", is(100.0)));
        }

        @Test
        void testTrackOverdueTasksAndPublishOverdueNotifications() throws Exception {
                // 1. Create a task with a past due date and status TODO
                CreateTimelineTaskDto dto = CreateTimelineTaskDto.builder()
                                .title("Past Due Task")
                                .description("Must have been done yesterday")
                                .dueDate(LocalDateTime.now().minusDays(1))
                                .priority(TaskPriority.HIGH)
                                .status(TaskStatus.TODO)
                                .build();

                mockMvc.perform(post("/events/" + eventEntity.getId() + "/tasks")
                                .with(authentication(auth))
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(dto)))
                                .andExpect(status().isCreated());

                reset(rabbitTemplate);

                // 2. Trigger check-overdue endpoint
                mockMvc.perform(post("/events/tasks/check-overdue")
                                .with(authentication(auth))
                                .with(csrf()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)))
                                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

                // 3. Verify that RabbitMQ TASK_OVERDUE notification was published
                verify(rabbitTemplate, atLeastOnce()).convertAndSend(
                                eq("eventos.exchange"),
                                eq("task.notification"),
                                (Object) argThat(event -> "TASK_OVERDUE"
                                                .equals(((com.eventos.event.event.TaskNotificationEvent) event)
                                                                .getEventType())));
        }
}
