package com.eventos.auth.event;

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
public class BookingCreatedEvent {
    private UUID bookingId;
    private UUID tenantId;
    private UUID leadId;
    private UUID eventId;
    private String bookingNumber;
    private BigDecimal totalAmount;
    private String clientName;
    private String clientEmail;
    private String eventType;
}
