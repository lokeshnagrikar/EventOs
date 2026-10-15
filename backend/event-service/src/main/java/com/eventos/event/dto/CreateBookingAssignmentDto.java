package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
public class CreateBookingAssignmentDto {

    public CreateBookingAssignmentDto() {
    }

    public CreateBookingAssignmentDto(String resourceName, String resourceType) {
        this.resourceName = resourceName;
        this.resourceType = resourceType;
    }

    @NotBlank(message = "Resource name is required")
    private String resourceName;

    @NotBlank(message = "Resource type is required")
    private String resourceType; // e.g. "STAFF", "VENUE", "CATERING", "EQUIPMENT", "DECOR"
}
