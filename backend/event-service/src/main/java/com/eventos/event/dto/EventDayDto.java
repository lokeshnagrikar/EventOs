package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventDayDto {

    @NotNull(message = "Event day date is required")
    private LocalDate dayDate;

    @NotBlank(message = "Event day title is required")
    private String title;

    private String description;
}
