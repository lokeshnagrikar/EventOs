package com.eventos.event.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuoteAcceptedEvent {
    private UUID quoteId;
    private UUID tenantId;
    private UUID leadId;
    private UUID customerId;
    private UUID clientId;
    private String quoteNumber;
    private BigDecimal totalAmount;
    private String contractUrl;
    private String clientName;
    private String clientEmail;
    private String clientPhone;
    private String eventName;
    private String eventType;
    private String eventDate;
    private List<QuoteItemDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuoteItemDto {
        private String itemName;
        private String description;
        private BigDecimal unitPrice;
        private Integer quantity;
    }
}
