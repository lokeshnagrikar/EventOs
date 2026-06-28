package com.eventos.auth.service;

import com.eventos.auth.config.MessagingConfig;
import com.eventos.auth.dto.AuditEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);
    private final RabbitTemplate rabbitTemplate;

    public AuditLogService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void logEvent(UUID tenantId, UUID userId, String action, String ipAddress, String userAgent, String details) {
        AuditEvent auditEvent = AuditEvent.builder()
                .tenantId(tenantId)
                .userId(userId)
                .action(action)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .details(details)
                .build();
        
        String routingKey = "auth.audit." + action.toLowerCase().replace("_", ".");
        
        try {
            rabbitTemplate.convertAndSend(MessagingConfig.EXCHANGE, routingKey, auditEvent);
            log.info("Successfully published audit event to RabbitMQ: exchange={}, routingKey={}, action={}", 
                    MessagingConfig.EXCHANGE, routingKey, action);
        } catch (Exception e) {
            log.error("Failed to publish audit event to RabbitMQ for action: {}", action, e);
        }
    }
}
