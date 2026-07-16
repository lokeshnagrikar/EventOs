package com.eventos.auth.consumer;

import com.eventos.auth.config.MessagingConfig;
import com.eventos.auth.dto.AuditEvent;
import com.eventos.auth.entity.AuditLog;
import com.eventos.auth.repository.AuditLogRepository;
import com.eventos.auth.repository.TenantRepository;
import com.eventos.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public class AuditLogConsumer {

    private static final Logger log = LoggerFactory.getLogger(AuditLogConsumer.class);
    private final AuditLogRepository auditLogRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    public AuditLogConsumer(AuditLogRepository auditLogRepository, 
                            TenantRepository tenantRepository, 
                            UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
    }

    @RabbitListener(queues = MessagingConfig.AUDIT_QUEUE)
    public void consumeAuditEvent(AuditEvent event) {
        log.info("Received audit event via RabbitMQ: action={}, user={}, tenant={}", 
                event.getAction(), event.getUserId(), event.getTenantId());
        
        try {
            UUID tenantId = event.getTenantId();
            if (tenantId != null && !tenantRepository.existsById(tenantId)) {
                log.warn("Setting tenantId to null in audit log because it does not exist: {}", tenantId);
                tenantId = null;
            }

            UUID userId = event.getUserId();
            if (userId != null && !userRepository.existsById(userId)) {
                log.warn("Setting userId to null in audit log because it does not exist: {}", userId);
                userId = null;
            }

            AuditLog auditLog = AuditLog.builder()
                    .tenantId(tenantId)
                    .userId(userId)
                    .action(event.getAction())
                    .ipAddress(event.getIpAddress())
                    .userAgent(event.getUserAgent())
                    .details(event.getDetails())
                    .build();
            
            auditLogRepository.save(auditLog);
            log.debug("Successfully persisted audit log entry");
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation while persisting audit event (discarding): {}", event, e);
            // Do not rethrow to avoid infinite RabbitMQ requeue loop
        } catch (Exception e) {
            log.error("Transient error while persisting received audit event (requeuing): {}", event, e);
            throw e; // Retries for other types of errors (e.g. database down)
        }
    }
}
