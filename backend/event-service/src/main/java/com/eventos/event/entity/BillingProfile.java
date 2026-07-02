package com.eventos.event.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "billing_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingProfile {

    @Id
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @Column(name = "billing_cycle", nullable = false)
    private String billingCycle;

    @Column(name = "renewal_date", nullable = false)
    private LocalDateTime renewalDate;

    @Column(name = "card_last4")
    private String cardLast4;

    @Column(name = "card_brand")
    private String cardBrand;

    @Column(name = "card_expiry")
    private String cardExpiry;

    @Column(name = "billing_email")
    private String billingEmail;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (planName == null) planName = "STARTER";
        if (billingCycle == null) billingCycle = "MONTHLY";
        if (renewalDate == null) renewalDate = LocalDateTime.now().plusMonths(1);
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
