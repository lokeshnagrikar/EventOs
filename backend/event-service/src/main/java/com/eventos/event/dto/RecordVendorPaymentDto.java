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
public class RecordVendorPaymentDto {

    public RecordVendorPaymentDto() {
    }

    public RecordVendorPaymentDto(BigDecimal amount) {
        this.amount = amount;
    }

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero")
    private BigDecimal amount;
}
