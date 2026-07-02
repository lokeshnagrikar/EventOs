package com.eventos.event.repository;

import com.eventos.event.entity.Integration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IntegrationRepository extends JpaRepository<Integration, UUID> {
    List<Integration> findAllByTenantId(UUID tenantId);
    Optional<Integration> findByTenantIdAndProviderName(UUID tenantId, String providerName);
}
