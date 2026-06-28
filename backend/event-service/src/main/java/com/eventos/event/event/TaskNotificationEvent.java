package com.eventos.event.event;

import com.eventos.event.entity.TaskPriority;
import com.eventos.event.entity.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskNotificationEvent {
    private UUID taskId;
    private UUID eventId;
    private UUID tenantId;
    private String title;
    private String eventType; // e.g. "TASK_OVERDUE", "TASK_ASSIGNED", "TASK_STATUS_CHANGED"
    private String description;
    private UUID assignedUserId;
    private LocalDateTime dueDate;
    private TaskPriority priority;
    private TaskStatus status;
    private LocalDateTime timestamp;
}
