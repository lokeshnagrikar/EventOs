package com.eventos.event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
public class BookingBudgetDto {

    public BookingBudgetDto() {
    }

    public BookingBudgetDto(BigDecimal revenue, BigDecimal estimatedCost, BigDecimal actualCost, BigDecimal profitMargin, BigDecimal profitMarginPercentage) {
        this.revenue = revenue;
        this.estimatedCost = estimatedCost;
        this.actualCost = actualCost;
        this.profitMargin = profitMargin;
        this.profitMarginPercentage = profitMarginPercentage;
    }
    private BigDecimal revenue;
    private BigDecimal estimatedCost;
    private BigDecimal actualCost;
    private BigDecimal profitMargin;
    private BigDecimal profitMarginPercentage;
}
