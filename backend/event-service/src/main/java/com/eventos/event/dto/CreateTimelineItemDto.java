package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTimelineItemDto {

    @NotBlank(message = "Milestone title is required")
    private String title;

    private String description;

    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledTime;

    @NotNull(message = "Milestone type is required")
    private com.eventos.event.entity.MilestoneType milestone;
}
