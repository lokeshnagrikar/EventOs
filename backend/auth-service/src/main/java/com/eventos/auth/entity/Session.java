package com.eventos.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refresh_token_id", nullable = false)
    private RefreshToken refreshToken;

    @Column(name = "device_model")
    private String deviceModel;

    @Column(name = "os_name")
    private String osName;

    @Column(name = "browser")
    private String browser;

    @Column(name = "ip_address", nullable = false)
    private String ipAddress;

    @Column(name = "last_active_at", nullable = false)
    private LocalDateTime lastActiveAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastActiveAt = LocalDateTime.now();
    }
}
