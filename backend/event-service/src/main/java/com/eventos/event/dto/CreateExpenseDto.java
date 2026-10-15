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
@Builder
public class CreateExpenseDto {

    public CreateExpenseDto() {
    }

    public CreateExpenseDto(BudgetCategory category, String description, BigDecimal amount,
                            LocalDateTime expenseDate, UUID vendorContractId, String paymentMethod, String status) {
        this.category = category;
        this.description = description;
        this.amount = amount;
        this.expenseDate = expenseDate;
        this.vendorContractId = vendorContractId;
        this.paymentMethod = paymentMethod;
        this.status = status != null ? status : "PAID";
    }

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

    @Builder.Default
    private String status = "PAID";
}
