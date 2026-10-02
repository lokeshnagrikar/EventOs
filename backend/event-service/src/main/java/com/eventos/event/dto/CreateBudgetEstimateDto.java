package com.eventos.event.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
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

    @Builder.Default
    private List<String> effectsList = new ArrayList<>(); // COLD_PYRO, DRY_ICE, LASER_SHOW, LED_WALL

    // Optional frontend preview calculations passed in payload
    private BigDecimal cateringTotal;
    private BigDecimal venueTotal;
    private BigDecimal decorTotal;
    private BigDecimal effectsTotal;
    private BigDecimal grandTotal;

    @JsonSetter(nulls = Nulls.AS_EMPTY)
    public void setEffectsList(Object effects) {
        if (effects == null) {
            this.effectsList = new ArrayList<>();
        } else if (effects instanceof List<?> list) {
            this.effectsList = list.stream()
                    .filter(Objects::nonNull)
                    .map(Object::toString)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        } else if (effects instanceof String str) {
            if (str.trim().isEmpty()) {
                this.effectsList = new ArrayList<>();
            } else {
                this.effectsList = Arrays.stream(str.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
            }
        } else {
            this.effectsList = new ArrayList<>();
        }
    }
}
