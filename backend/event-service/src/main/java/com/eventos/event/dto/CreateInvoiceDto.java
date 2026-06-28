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
public class CreateInvoiceDto {

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    @NotNull(message = "Subtotal is required")
    @DecimalMin(value = "0.00", message = "Subtotal cannot be negative")
    private BigDecimal subtotal;

    @NotNull(message = "Tax amount is required")
    @DecimalMin(value = "0.00", message = "Tax cannot be negative")
    private BigDecimal tax;

    @NotNull(message = "Discount amount is required")
    @DecimalMin(value = "0.00", message = "Discount cannot be negative")
    private BigDecimal discount;

    @NotNull(message = "Due date is required")
    private LocalDateTime dueDate;

    @NotBlank(message = "Client name is required")
    private String clientName;

    private String clientEmail;

    private String billingAddress;

    private String notes;

    @jakarta.validation.constraints.DecimalMin(value = "0.00", message = "Tax rate cannot be negative")
    private BigDecimal taxRate;

    @jakarta.validation.constraints.AssertTrue(message = "Discount cannot exceed subtotal plus tax")
    public boolean isDiscountValid() {
        if (subtotal == null || tax == null || discount == null) {
            return true;
        }
        return discount.compareTo(subtotal.add(tax)) <= 0;
    }
}
