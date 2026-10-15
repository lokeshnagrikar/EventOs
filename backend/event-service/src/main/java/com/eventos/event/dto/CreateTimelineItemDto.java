package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
public class CreateTimelineItemDto {

    public CreateTimelineItemDto() {
    }

    public CreateTimelineItemDto(String title, String description, LocalDateTime scheduledTime, com.eventos.event.entity.MilestoneType milestone) {
        this.title = title;
        this.description = description;
        this.scheduledTime = scheduledTime;
        this.milestone = milestone;
    }

    @NotBlank(message = "Milestone title is required")
    private String title;

    private String description;

    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledTime;

    @NotNull(message = "Milestone type is required")
    private com.eventos.event.entity.MilestoneType milestone;
}
