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
@Table(name = "expenses")
@Data
@lombok.EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EntityListeners(com.eventos.event.config.AuditLogListener.class)
public class Expense extends AbstractTenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BudgetCategory category;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    @lombok.Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "expense_date", nullable = false)
    private LocalDateTime expenseDate;

    @Column(name = "vendor_contract_id")
    private UUID vendorContractId;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(nullable = false)
    private String status; // PAID, PENDING

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
