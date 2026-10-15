package com.eventos.event.dto;

import com.eventos.event.entity.BudgetCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
public class BudgetCategoryAllocationDto {

    public BudgetCategoryAllocationDto() {
    }

    public BudgetCategoryAllocationDto(BudgetCategory category, BigDecimal estimatedCost) {
        this.category = category;
        this.estimatedCost = estimatedCost;
    }

    @NotNull(message = "Category is required")
    private BudgetCategory category;

    @NotNull(message = "Estimated cost is required")
    @DecimalMin(value = "0.00", message = "Estimated cost must be non-negative")
    private BigDecimal estimatedCost;
}
