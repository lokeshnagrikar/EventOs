package com.eventos.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "database_backups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatabaseBackupRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "archive_name", nullable = false)
    private String archiveName;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_size_bytes", nullable = false)
    private long fileSizeBytes;

    @Column(nullable = false)
    private String status; // PENDING, IN_PROGRESS, SUCCESS, FAILED

    @Column(name = "databases_included")
    private String databasesIncluded;

    @Column(name = "sha256_checksum", length = 100)
    private String sha256Checksum;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "SUCCESS";
        if (databasesIncluded == null) databasesIncluded = "auth_db,crm_db,event_db,gallery_db";
    }
}
