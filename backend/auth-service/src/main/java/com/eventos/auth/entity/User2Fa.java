package com.eventos.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_2fa")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User2Fa {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    private String secret;

    @Column(name = "is_enabled", nullable = false)
    private boolean isEnabled;

    @Column(name = "backup_codes", columnDefinition = "text")
    private String backupCodes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        isEnabled = false;
    }
}
