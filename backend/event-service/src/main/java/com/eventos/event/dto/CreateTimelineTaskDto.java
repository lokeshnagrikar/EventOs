package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
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
public class CreateTimelineTaskDto {

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
