package com.eventos.event.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePaymentDto {

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    private UUID invoiceId;

    private String status;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // UPI, CASH, CARD, BANK_TRANSFER

    private String transactionReference;

    private String notes;

    @NotNull(message = "Payment date is required")
    private LocalDateTime paymentDate;
}
