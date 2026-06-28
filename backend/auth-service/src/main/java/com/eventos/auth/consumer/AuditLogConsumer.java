package com.eventos.auth.consumer;

import com.eventos.auth.config.MessagingConfig;
import com.eventos.auth.dto.AuditEvent;
import com.eventos.auth.entity.AuditLog;
import com.eventos.auth.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class AuditLogConsumer {

    private static final Logger log = LoggerFactory.getLogger(AuditLogConsumer.class);
    private final AuditLogRepository auditLogRepository;

    public AuditLogConsumer(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @RabbitListener(queues = MessagingConfig.AUDIT_QUEUE)
    public void consumeAuditEvent(AuditEvent event) {
        log.info("Received audit event via RabbitMQ: action={}, user={}, tenant={}", 
                event.getAction(), event.getUserId(), event.getTenantId());
        
        try {
            AuditLog auditLog = AuditLog.builder()
                    .tenantId(event.getTenantId())
                    .userId(event.getUserId())
                    .action(event.getAction())
                    .ipAddress(event.getIpAddress())
                    .userAgent(event.getUserAgent())
                    .details(event.getDetails())
                    .build();
            
            if (auditLog != null) {
                auditLogRepository.save(auditLog);
            }
            log.debug("Successfully persisted audit log entry");
        } catch (Exception e) {
            log.error("Failed to persist received audit event: {}", event, e);
            throw e; // Triggers DLQ retry if configured
        }
    }
}
