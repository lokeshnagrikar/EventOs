package com.eventos.event.dto;

import com.eventos.event.entity.BudgetCategory;
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
public class CreateExpenseDto {

    @NotNull(message = "Category is required")
    private BudgetCategory category;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Expense amount must be positive")
    private BigDecimal amount;

    private LocalDateTime expenseDate;

    private UUID vendorContractId;

    private String paymentMethod;

    @lombok.Builder.Default
    private String status = "PAID";
}
