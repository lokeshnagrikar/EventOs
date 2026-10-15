package com.eventos.event.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
public class UpdateBookingBudgetLimitDto {

    public UpdateBookingBudgetLimitDto() {
    }

    public UpdateBookingBudgetLimitDto(BigDecimal totalBudgetLimit, BigDecimal alertThresholdPercentage) {
        this.totalBudgetLimit = totalBudgetLimit;
        this.alertThresholdPercentage = alertThresholdPercentage;
    }

    @NotNull(message = "Total budget limit is required")
    @DecimalMin(value = "0.00", message = "Total budget limit must be non-negative")
    private BigDecimal totalBudgetLimit;

    @NotNull(message = "Alert threshold percentage is required")
    @DecimalMin(value = "0.00", message = "Alert threshold must be non-negative")
    private BigDecimal alertThresholdPercentage;
}
