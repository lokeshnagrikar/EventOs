package com.eventos.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "security_blacklist")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlacklistedIp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ip_address", nullable = false, unique = true)
    private String ipAddress;

    @Column(nullable = false)
    private String reason;

    @Column(name = "threat_level")
    private String threatLevel;

    @Column(name = "blocked_by")
    private String blockedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (threatLevel == null) threatLevel = "High";
        if (blockedBy == null) blockedBy = "Super Admin";
    }
}
