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
@Table(name = "invoices", uniqueConstraints = {
    @UniqueConstraint(name = "uq_invoices_tenant_number", columnNames = {"tenant_id", "invoice_number"})
})
@Data
@lombok.EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EntityListeners(com.eventos.event.config.AuditLogListener.class)
public class Invoice extends AbstractTenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal tax;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal discount;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @Column(name = "paid_amount", precision = 19, scale = 4)
    private BigDecimal paidAmount;

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    @Column(nullable = false)
    private String status; // DRAFT, SENT, PAID, OVERDUE, CANCELLED

    @Column(name = "client_name", nullable = false)
    private String clientName;

    @Column(name = "client_email")
    private String clientEmail;

    @Column(name = "billing_address", length = 500)
    private String billingAddress;

    @Column(length = 1000)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "voided_by")
    private UUID voidedBy;

    @Column(name = "voided_at")
    private LocalDateTime voidedAt;

    @Column(name = "void_reason", length = 500)
    private String voidReason;

    @Transient
    public BigDecimal getOutstandingBalance() {
        if (totalAmount == null) return BigDecimal.ZERO;
        BigDecimal paid = paidAmount != null ? paidAmount : BigDecimal.ZERO;
        return totalAmount.subtract(paid);
    }
}
