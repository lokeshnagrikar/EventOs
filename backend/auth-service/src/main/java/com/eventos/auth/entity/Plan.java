package com.eventos.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private String currency;

    @Column(name = "billing_interval", nullable = false)
    private String billingInterval;

    @Column(name = "max_users", nullable = false)
    private int maxUsers;

    @Column(name = "max_storage", nullable = false)
    private long maxStorage;

    @Column(name = "max_gallery_uploads", nullable = false)
    private int maxGalleryUploads;

    @Column(name = "max_events", nullable = false)
    private int maxEvents;

    @Column(name = "max_leads", nullable = false)
    private int maxLeads;

    @Column(name = "max_ai_credits", nullable = false)
    private int maxAiCredits;

    @Column(name = "max_automation_runs", nullable = false)
    private int maxAutomationRuns;

    @Column(name = "max_api_calls", nullable = false)
    private int maxApiCalls;

    @Column(name = "custom_domain_supported", nullable = false)
    private boolean customDomainSupported;

    @Column(name = "white_label_supported", nullable = false)
    private boolean whiteLabelSupported;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (currency == null) currency = "USD";
        if (billingInterval == null) billingInterval = "MONTHLY";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
