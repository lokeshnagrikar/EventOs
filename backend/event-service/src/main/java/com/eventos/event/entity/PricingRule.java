package com.eventos.event.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "pricing_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PricingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    @NotNull(message = "Category is required")
    private PricingCategory category;

    @Column(name = "rule_key", nullable = false)
    @NotBlank(message = "Rule key is required")
    private String ruleKey;

    @Column(name = "base_price", nullable = false)
    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.0", message = "Base price must be non-negative")
    private BigDecimal basePrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_type", nullable = false)
    @NotNull(message = "Price type is required")
    private PricingType priceType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
