package com.eventos.event.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class CreateBookingDto {

    public CreateBookingDto() {
    }

    public CreateBookingDto(UUID eventId, UUID leadId, BigDecimal totalAmount, BigDecimal paidAmount, String contractUrl) {
        this.eventId = eventId;
        this.leadId = leadId;
        this.totalAmount = totalAmount;
        this.paidAmount = paidAmount;
        this.contractUrl = contractUrl;
    }

    @NotNull(message = "Event ID is required")
    private UUID eventId;

    private UUID leadId;

    @NotNull(message = "Total amount is required")
    @PositiveOrZero(message = "Total amount must be positive or zero")
    private BigDecimal totalAmount;

    @NotNull(message = "Paid amount is required")
    @PositiveOrZero(message = "Paid amount must be positive or zero")
    private BigDecimal paidAmount;

    private String contractUrl;
}
