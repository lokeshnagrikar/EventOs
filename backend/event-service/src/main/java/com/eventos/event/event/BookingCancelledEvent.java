package com.eventos.event.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingCancelledEvent {
    private UUID bookingId;
    private UUID tenantId;
    private UUID eventId;
    private String bookingNumber;
    private LocalDateTime cancelledAt;
    private String reason;
}
