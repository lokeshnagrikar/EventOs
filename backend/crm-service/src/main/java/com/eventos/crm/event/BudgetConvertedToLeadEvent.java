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
public class BudgetConvertedToLeadEvent {
    private UUID estimateId;
    private UUID tenantId;
    private UUID leadId;
    private UUID quoteId;
    private String clientName;
    private String clientEmail;
    private String clientPhone;
    private String eventName;
    private String eventType;
    private Integer guestCount;
    private String decorStyle;
    private String venueType;
    private String effectsList;
    private BigDecimal cateringTotal;
    private BigDecimal venueTotal;
    private BigDecimal decorTotal;
    private BigDecimal effectsTotal;
    private BigDecimal subTotal;
    private BigDecimal taxRate;
    private BigDecimal taxTotal;
    private BigDecimal grandTotal;
    private boolean generateQuote;
}
