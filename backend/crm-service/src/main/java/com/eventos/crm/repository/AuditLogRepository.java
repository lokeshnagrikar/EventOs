package com.eventos.crm.repository;

import com.eventos.crm.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    
    List<AuditLog> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    
    List<AuditLog> findAllByTenantIdAndEntityNameAndEntityIdOrderByCreatedAtDesc(UUID tenantId, String entityName, UUID entityId);
}
