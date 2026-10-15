package com.eventos.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "api_keys")
@Getter
@Setter
@Builder
public class ApiKey {

    public ApiKey() {
    }

    public ApiKey(UUID id, UUID tenantId, String name, String prefix, String keyHash, String scopes,
                  LocalDateTime lastUsedAt, LocalDateTime createdAt, LocalDateTime expiresAt, boolean isRevoked) {
        this.id = id;
        this.tenantId = tenantId;
        this.name = name;
        this.prefix = prefix;
        this.keyHash = keyHash;
        this.scopes = scopes;
        this.lastUsedAt = lastUsedAt;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.isRevoked = isRevoked;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String prefix;

    @Column(name = "key_hash", nullable = false)
    private String keyHash;

    private String scopes;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "is_revoked", nullable = false)
    private boolean isRevoked;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        isRevoked = false;
    }
}
