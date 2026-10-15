package com.eventos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
public class AuditEvent {

    public AuditEvent() {
    }

    public AuditEvent(UUID tenantId, UUID userId, String action, String ipAddress, String userAgent, String details) {
        this.tenantId = tenantId;
        this.userId = userId;
        this.action = action;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.details = details;
    }
    private UUID tenantId;
    private UUID userId;
    private String action;
    private String ipAddress;
    private String userAgent;
    private String details;
}
