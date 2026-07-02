package com.eventos.auth.repository;

import com.eventos.auth.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID> {
    List<ApiKey> findAllByTenantId(UUID tenantId);
    Optional<ApiKey> findByPrefixAndIsRevokedFalse(String prefix);
}
