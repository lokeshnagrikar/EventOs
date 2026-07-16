package com.eventos.auth.repository;

import com.eventos.auth.entity.TenantUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantUsageRepository extends JpaRepository<TenantUsage, UUID> {
    Optional<TenantUsage> findByTenantId(UUID tenantId);
}
