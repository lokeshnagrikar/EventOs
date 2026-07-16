package com.eventos.auth.repository;

import com.eventos.auth.entity.WorkspaceSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceSettingsRepository extends JpaRepository<WorkspaceSettings, UUID> {
    Optional<WorkspaceSettings> findByTenantId(UUID tenantId);
}
