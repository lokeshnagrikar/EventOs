package com.eventos.crm.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLeadDto {

    @NotBlank(message = "Lead name is required")
    @Size(max = 255, message = "Lead name must be less than 255 characters")
    private String name;

    @Size(max = 50, message = "Phone number must be less than 50 characters")
    private String phone;

    @Email(message = "Please provide a valid email address")
    @Size(max = 255, message = "Email must be less than 255 characters")
    private String email;

    @Size(max = 100, message = "Event type must be less than 100 characters")
    private String eventType;

    private LocalDate eventDate;

    @PositiveOrZero(message = "Budget cannot be negative")
    private BigDecimal budget;

    @Size(max = 100, message = "Lead source must be less than 100 characters")
    private String leadSource;

    private String notes;

    private UUID assignedUserId;

    private UUID contactId;
}
