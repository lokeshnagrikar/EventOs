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
public class BookingBudgetDto {
    private BigDecimal revenue;
    private BigDecimal estimatedCost;
    private BigDecimal actualCost;
    private BigDecimal profitMargin;
    private BigDecimal profitMarginPercentage;
}
