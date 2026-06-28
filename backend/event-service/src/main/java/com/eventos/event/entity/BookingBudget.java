package com.eventos.event.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "booking_budgets",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {
                "tenant_id",
                "booking_id"
            }
        )
    }
)
@Data
@lombok.EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EntityListeners(com.eventos.event.config.AuditLogListener.class)
public class BookingBudget extends AbstractTenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "booking_id", nullable = false, unique = true)
    private UUID bookingId;

    @Column(name = "total_budget_limit", nullable = false)
    @lombok.Builder.Default
    private BigDecimal totalBudgetLimit = BigDecimal.ZERO;

    @Column(name = "alert_threshold_percentage", nullable = false)
    @lombok.Builder.Default
    private BigDecimal alertThresholdPercentage = BigDecimal.valueOf(90.00);

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
