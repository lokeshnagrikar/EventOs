package com.eventos.crm.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadCreatedEvent {
    private UUID leadId;
    private UUID tenantId;
    private String name;
    private String clientName;
    private String clientEmail;
    private String clientPhone;
    private String eventType;
    private BigDecimal budget;
    private String source;
}
