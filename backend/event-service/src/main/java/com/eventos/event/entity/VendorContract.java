package com.eventos.event.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "vendor_contracts",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {
                "tenant_id",
                "contract_number"
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
public class VendorContract extends AbstractTenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "vendor_id", nullable = false)
    private UUID vendorId;

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(name = "contract_number", nullable = false)
    private String contractNumber;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "total_cost", nullable = false)
    private BigDecimal totalCost;

    @Column(name = "actual_cost", nullable = false)
    private BigDecimal actualCost;

    @Column(name = "paid_amount", nullable = false)
    @lombok.Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    @lombok.Builder.Default
    private VendorPaymentStatus paymentStatus = VendorPaymentStatus.UNPAID;

    @Column(name = "contract_url")
    private String contractUrl;

    @Column(nullable = false)
    private String status; // PENDING, SIGNED, ACTIVE, COMPLETED, CANCELLED

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
