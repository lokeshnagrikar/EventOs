package com.eventos.event.config;
import com.eventos.event.entity.AuditLog;
import com.eventos.event.entity.AbstractTenantAwareEntity;
import com.eventos.event.repository.AuditLogRepository;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class AuditLogListener {

    private static AuditLogRepository auditLogRepository;
    private static JdbcTemplate jdbcTemplate;

    @Autowired
    public void setAuditLogRepository(@Lazy AuditLogRepository repo) {
        AuditLogListener.auditLogRepository = repo;
    }

    @Autowired
    public void setJdbcTemplate(JdbcTemplate jdbcTemplate) {
        AuditLogListener.jdbcTemplate = jdbcTemplate;
    }

    @PostPersist
    public void postPersist(Object entity) {
        logAction(entity, "CREATE");
    }

    @PostUpdate
    public void postUpdate(Object entity) {
        logAction(entity, "UPDATE");
    }

    @PostRemove
    public void postRemove(Object entity) {
        logAction(entity, "DELETE");
    }

    private void logAction(Object entity, String action) {
        // Prevent auditing the AuditLog entity itself to avoid infinite recursion
        if (entity instanceof AuditLog) {
            return;
        }

        if (entity instanceof AbstractTenantAwareEntity tenantEntity) {
            UUID tenantId = tenantEntity.getTenantId();
            if (tenantId == null) {
                tenantId = TenantContext.getTenantId();
            }

            if (tenantId != null) {
                UUID performedBy = null;
                org.springframework.security.core.Authentication auth = 
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
                    performedBy = principal.getUserId();
                }

                UUID entityId = null;
                try {
                    java.lang.reflect.Method getId = entity.getClass().getMethod("getId");
                    entityId = (UUID) getId.invoke(entity);
                } catch (Exception ignored) {}

                if (jdbcTemplate != null) {
                    try {
                        String sql = "INSERT INTO audit_logs (id, tenant_id, entity_name, entity_id, action, performed_by, payload_diff, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                        jdbcTemplate.update(sql,
                                UUID.randomUUID(),
                                tenantId,
                                entity.getClass().getSimpleName(),
                                entityId != null ? entityId : UUID.randomUUID(),
                                action,
                                performedBy,
                                entity.toString(),
                                LocalDateTime.now()
                        );
                    } catch (Exception e) {
                        System.err.println("AuditLog direct insert via JdbcTemplate failed: " + e.getMessage());
                        // Fallback to repository save if direct JDBC fails
                        if (auditLogRepository != null) {
                            try {
                                AuditLog log = AuditLog.builder()
                                        .entityName(entity.getClass().getSimpleName())
                                        .entityId(entityId != null ? entityId : UUID.randomUUID())
                                        .action(action)
                                        .performedBy(performedBy)
                                        .payloadDiff(entity.toString())
                                        .build();
                                log.setTenantId(tenantId);
                                auditLogRepository.save(log);
                            } catch (Exception ignored) {}
                        }
                    }
                } else if (auditLogRepository != null) {
                    AuditLog log = AuditLog.builder()
                            .entityName(entity.getClass().getSimpleName())
                            .entityId(entityId != null ? entityId : UUID.randomUUID())
                            .action(action)
                            .performedBy(performedBy)
                            .payloadDiff(entity.toString())
                            .build();
                    log.setTenantId(tenantId);
                    auditLogRepository.save(log);
                }
            }
        }
    }
}
