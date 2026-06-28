package com.eventos.crm.entity;

import com.eventos.crm.config.AuditLogListener;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "leads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EntityListeners(AuditLogListener.class)
public class Lead extends AbstractTenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "assigned_user_id")
    private UUID assignedUserId;

    @Column(name = "lead_source")
    private String leadSource;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "contact_id", nullable = false)
    private Contact contact;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "event_date")
    private LocalDate eventDate;

    private BigDecimal budget;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeadStatus status;

    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = LeadStatus.NEW;
        }
        if (budget == null) {
            budget = BigDecimal.ZERO;
        }
        isDeleted = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
