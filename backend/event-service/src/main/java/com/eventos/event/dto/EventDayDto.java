package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
public class EventDayDto {

    public EventDayDto() {
    }

    public EventDayDto(LocalDate dayDate, String title, String description) {
        this.dayDate = dayDate;
        this.title = title;
        this.description = description;
    }

    @NotNull(message = "Event day date is required")
    private LocalDate dayDate;

    @NotBlank(message = "Event day title is required")
    private String title;

    private String description;
}
