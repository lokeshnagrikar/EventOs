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
@Builder
public class CreatePaymentDto {

    public CreatePaymentDto() {
    }

    public CreatePaymentDto(UUID bookingId, UUID invoiceId, String status, BigDecimal amount,
                            String paymentMethod, String transactionReference, String notes, LocalDateTime paymentDate) {
        this.bookingId = bookingId;
        this.invoiceId = invoiceId;
        this.status = status;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.transactionReference = transactionReference;
        this.notes = notes;
        this.paymentDate = paymentDate;
    }

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
