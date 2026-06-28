package com.eventos.crm.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadStatusUpdatedEvent {
    private UUID leadId;
    private UUID tenantId;
    private String name;
    private String oldStatus;
    private String newStatus;
}
