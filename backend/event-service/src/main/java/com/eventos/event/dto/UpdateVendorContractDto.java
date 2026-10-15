package com.eventos.event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
public class UpdateVendorContractDto {

    public UpdateVendorContractDto() {
    }

    public UpdateVendorContractDto(String details, BigDecimal totalCost, BigDecimal actualCost, String contractUrl,
                                   String status, BigDecimal paidAmount, com.eventos.event.entity.VendorPaymentStatus paymentStatus) {
        this.details = details;
        this.totalCost = totalCost;
        this.actualCost = actualCost;
        this.contractUrl = contractUrl;
        this.status = status;
        this.paidAmount = paidAmount;
        this.paymentStatus = paymentStatus;
    }

    private String details;
    private BigDecimal totalCost;
    private BigDecimal actualCost;
    private String contractUrl;
    private String status;
    private BigDecimal paidAmount;
    private com.eventos.event.entity.VendorPaymentStatus paymentStatus;
}
