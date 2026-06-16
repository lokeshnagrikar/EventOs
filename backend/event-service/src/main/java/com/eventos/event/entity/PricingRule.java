package com.eventos.event.entity;

import jakarta.persistence.*;
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

    @Column(name = "category", nullable = false)
    private String category; // EVENT_TYPE, VENUE_TYPE, DECOR_STYLE, ADD_ON

    @Column(name = "rule_key", nullable = false)
    private String ruleKey;

    @Column(name = "base_price", nullable = false)
    private BigDecimal basePrice;

    @Column(name = "price_type", nullable = false)
    private String priceType; // FLAT_RATE, PER_GUEST

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
