package com.eventos.event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateVendorContractDto {

    private String details;
    private BigDecimal totalCost;
    private BigDecimal actualCost;
    private String contractUrl;
    private String status;
    private BigDecimal paidAmount;
    private com.eventos.event.entity.VendorPaymentStatus paymentStatus;
}
