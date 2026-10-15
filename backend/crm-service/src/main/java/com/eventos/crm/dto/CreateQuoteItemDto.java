package com.eventos.crm.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateQuoteItemDto {

    public CreateQuoteItemDto() {
    }

    public CreateQuoteItemDto(String itemName, String description, BigDecimal unitPrice, Integer quantity) {
        this.itemName = itemName;
        this.description = description;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
    }

    @NotBlank(message = "Item name is required")
    private String itemName;

    private String description;

    @NotNull(message = "Unit price is required")
    @PositiveOrZero(message = "Unit price must be positive or zero")
    private BigDecimal unitPrice;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than zero")
    private Integer quantity;
}
