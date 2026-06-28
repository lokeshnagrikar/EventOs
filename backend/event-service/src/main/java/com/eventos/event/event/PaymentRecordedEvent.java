package com.eventos.event.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRecordedEvent {
    private UUID paymentId;
    private UUID tenantId;
    private UUID bookingId;
    private UUID invoiceId;
    private BigDecimal amount;
    private String paymentMethod;
    private String transactionReference;
    private LocalDateTime paymentDate;
}
