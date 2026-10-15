package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CreateTimelineTaskDto {

    public CreateTimelineTaskDto() {
    }

    public CreateTimelineTaskDto(String title, String description, LocalDateTime dueDate, UUID assignedUserId,
                                 String assignedUserName, com.eventos.event.entity.TaskPriority priority,
                                 com.eventos.event.entity.TaskStatus status, UUID eventId) {
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.assignedUserId = assignedUserId;
        this.assignedUserName = assignedUserName;
        this.priority = priority;
        this.status = status;
        this.eventId = eventId;
    }

    @NotBlank(message = "Task title is required")
    private String title;

    private String description;

    private LocalDateTime dueDate;

    private UUID assignedUserId;

    private String assignedUserName;

    private com.eventos.event.entity.TaskPriority priority;

    private com.eventos.event.entity.TaskStatus status;

    private UUID eventId;
}
