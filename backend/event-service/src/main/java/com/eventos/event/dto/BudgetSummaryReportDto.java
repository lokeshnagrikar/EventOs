package com.eventos.event.dto;

import com.eventos.event.entity.BudgetAlert;
import com.eventos.event.entity.BudgetCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetSummaryReportDto {
    private BigDecimal revenue;
    private BigDecimal totalBudgetLimit;
    private BigDecimal alertThresholdPercentage;
    private BigDecimal totalEstimatedCost;
    private BigDecimal totalActualCost;
    private BigDecimal totalRemainingBudget;
    private BigDecimal profitMargin;
    private BigDecimal profitMarginPercentage;
    private List<CategoryBreakdown> categoryBreakdowns;
    private List<BudgetAlert> activeAlerts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryBreakdown {
        private BudgetCategory category;
        private BigDecimal allocationLimit; // Manually allocated estimate
        private BigDecimal contractEstimatedCost; // Sum of contract total costs
        private BigDecimal contractActualCost; // Sum of contract actual costs
        private BigDecimal directExpensesCost; // Sum of non-contract expenses
        private BigDecimal totalEstimatedCost; // derived estimated cost
        private BigDecimal totalActualCost; // contractActualCost + directExpensesCost
        private BigDecimal remainingBudget; // totalEstimatedCost - totalActualCost
        private BigDecimal vendorPayouts; // Sum of contract paidAmount + direct paid expenses
    }
}
