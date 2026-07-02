package com.eventos.event.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "integrations", uniqueConstraints = {
    @UniqueConstraint(name = "uq_integrations_tenant_provider", columnNames = {"tenant_id", "provider_name"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Integration extends AbstractTenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "provider_name", nullable = false)
    private String providerName;

    @Column(name = "credentials_json", columnDefinition = "TEXT")
    private String credentialsJson;

    @Column(nullable = false)
    private String status; // CONNECTED, DISCONNECTED

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "DISCONNECTED";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
