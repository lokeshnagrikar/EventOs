package com.eventos.crm.event;

import org.springframework.context.ApplicationEvent;
import java.util.UUID;

public class QuotePdfGenerationEvent extends ApplicationEvent {
    private final UUID quoteId;
    private final UUID tenantId;

    public QuotePdfGenerationEvent(Object source, UUID quoteId, UUID tenantId) {
        super(source);
        this.quoteId = quoteId;
        this.tenantId = tenantId;
    }

    public UUID getQuoteId() {
        return quoteId;
    }

    public UUID getTenantId() {
        return tenantId;
    }
}
