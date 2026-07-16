package com.eventos.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_usages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    @Column(name = "users_count", nullable = false)
    private int usersCount;

    @Column(name = "storage_bytes", nullable = false)
    private long storageBytes;

    @Column(name = "gallery_uploads", nullable = false)
    private int galleryUploads;

    @Column(name = "events_count", nullable = false)
    private int eventsCount;

    @Column(name = "leads_count", nullable = false)
    private int leadsCount;

    @Column(name = "ai_credits_used", nullable = false)
    private int aiCreditsUsed;

    @Column(name = "automation_runs", nullable = false)
    private int automationRuns;

    @Column(name = "api_calls", nullable = false)
    private int apiCalls;

    @Column(name = "emails_sent", nullable = false)
    private int emailsSent;

    @Column(name = "sms_sent", nullable = false)
    private int smsSent;

    @Column(name = "billing_period_start", nullable = false)
    private LocalDateTime billingPeriodStart;

    @Column(name = "billing_period_end", nullable = false)
    private LocalDateTime billingPeriodEnd;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
        if (billingPeriodStart == null) billingPeriodStart = LocalDateTime.now();
        if (billingPeriodEnd == null) billingPeriodEnd = LocalDateTime.now().plusMonths(1);
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
