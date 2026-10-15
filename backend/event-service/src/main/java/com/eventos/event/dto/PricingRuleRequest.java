package com.eventos.event.dto;

import com.eventos.event.entity.PricingCategory;
import com.eventos.event.entity.PricingType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
public class PricingRuleRequest {

    public PricingRuleRequest() {
    }

    public PricingRuleRequest(PricingCategory category, String ruleKey, BigDecimal basePrice, PricingType priceType) {
        this.category = category;
        this.ruleKey = ruleKey;
        this.basePrice = basePrice;
        this.priceType = priceType;
    }

    @NotNull(message = "Category is required")
    private PricingCategory category;

    @NotBlank(message = "Rule key is required")
    private String ruleKey;

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.0", message = "Base price must be non-negative")
    private BigDecimal basePrice;

    @NotNull(message = "Price type is required")
    private PricingType priceType;
}
