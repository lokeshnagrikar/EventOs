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
public class CreateBookingTimelineEventDto {

    @NotBlank(message = "Milestone title is required")
    private String title;

    private String description;

    @NotNull(message = "Event date is required")
    private LocalDateTime eventDate;

    @NotBlank(message = "Status is required")
    private String status;

    public void setEventDate(LocalDateTime eventDate) {
        this.eventDate = eventDate;
    }

    public void setEventDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return;
        try {
            if (dateStr.endsWith("Z")) {
                this.eventDate = java.time.Instant.parse(dateStr)
                        .atZone(java.time.ZoneId.systemDefault())
                        .toLocalDateTime();
            } else if (dateStr.length() == 16) {
                this.eventDate = LocalDateTime.parse(dateStr, java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
            } else {
                this.eventDate = LocalDateTime.parse(dateStr, java.time.format.DateTimeFormatter.ISO_DATE_TIME);
            }
        } catch (Exception e) {
            this.eventDate = LocalDateTime.now();
        }
    }
}
