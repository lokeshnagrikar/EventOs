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
@Builder
public class BudgetSummaryReportDto {

    public BudgetSummaryReportDto() {
    }

    public BudgetSummaryReportDto(BigDecimal revenue, BigDecimal totalBudgetLimit, BigDecimal alertThresholdPercentage,
                                  BigDecimal totalEstimatedCost, BigDecimal totalActualCost, BigDecimal totalRemainingBudget,
                                  BigDecimal profitMargin, BigDecimal profitMarginPercentage,
                                  List<CategoryBreakdown> categoryBreakdowns, List<BudgetAlert> activeAlerts) {
        this.revenue = revenue;
        this.totalBudgetLimit = totalBudgetLimit;
        this.alertThresholdPercentage = alertThresholdPercentage;
        this.totalEstimatedCost = totalEstimatedCost;
        this.totalActualCost = totalActualCost;
        this.totalRemainingBudget = totalRemainingBudget;
        this.profitMargin = profitMargin;
        this.profitMarginPercentage = profitMarginPercentage;
        this.categoryBreakdowns = categoryBreakdowns;
        this.activeAlerts = activeAlerts;
    }

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
    @Builder
    public static class CategoryBreakdown {

        public CategoryBreakdown() {
        }

        public CategoryBreakdown(BudgetCategory category, BigDecimal allocationLimit, BigDecimal contractEstimatedCost,
                                 BigDecimal contractActualCost, BigDecimal directExpensesCost, BigDecimal totalEstimatedCost,
                                 BigDecimal totalActualCost, BigDecimal remainingBudget, BigDecimal vendorPayouts) {
            this.category = category;
            this.allocationLimit = allocationLimit;
            this.contractEstimatedCost = contractEstimatedCost;
            this.contractActualCost = contractActualCost;
            this.directExpensesCost = directExpensesCost;
            this.totalEstimatedCost = totalEstimatedCost;
            this.totalActualCost = totalActualCost;
            this.remainingBudget = remainingBudget;
            this.vendorPayouts = vendorPayouts;
        }

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
