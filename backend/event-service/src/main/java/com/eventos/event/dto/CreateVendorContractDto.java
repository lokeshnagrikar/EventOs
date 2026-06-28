package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVendorContractDto {

    @NotNull(message = "Vendor ID is required")
    private UUID vendorId;

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    @NotBlank(message = "Contract number is required")
    private String contractNumber;

    private String details;

    @NotNull(message = "Total cost is required")
    private BigDecimal totalCost;

    private BigDecimal actualCost;
    private String contractUrl;
    private String status; // PENDING, SIGNED, ACTIVE, COMPLETED, CANCELLED
    private BigDecimal paidAmount;
    private com.eventos.event.entity.VendorPaymentStatus paymentStatus;
}
