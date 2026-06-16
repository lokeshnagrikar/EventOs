package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBudgetEstimateDto {

    @NotBlank(message = "Event name is required")
    private String eventName;

    @NotBlank(message = "Event type is required")
    private String eventType; // WEDDING, CORPORATE, etc.

    @NotNull(message = "Guest count is required")
    @Positive(message = "Guest count must be greater than zero")
    private Integer guestCount;

    @NotBlank(message = "Decor style is required")
    private String decorStyle; // STANDARD, PREMIUM, ROYAL

    private String venueType; // HOTEL, HALL, GARDEN, RESORT, BEACH

    private String clientName;
    private String clientEmail;
    private String clientPhone;

    private List<String> effectsList; // COLD_PYRO, DRY_ICE, LASER_SHOW, LED_WALL
}
