package com.eventos.auth.repository;

import com.eventos.auth.entity.DatabaseBackupRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DatabaseBackupRepository extends JpaRepository<DatabaseBackupRecord, UUID> {
    List<DatabaseBackupRecord> findAllByOrderByCreatedAtDesc();
}
