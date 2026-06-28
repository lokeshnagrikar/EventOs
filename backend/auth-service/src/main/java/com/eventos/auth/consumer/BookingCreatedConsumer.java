package com.eventos.auth.consumer;

import com.eventos.auth.config.MessagingConfig;
import com.eventos.auth.event.BookingCreatedEvent;
import com.eventos.auth.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class BookingCreatedConsumer {

    private static final Logger log = LoggerFactory.getLogger(BookingCreatedConsumer.class);
    private final AuthService authService;

    public BookingCreatedConsumer(AuthService authService) {
        this.authService = authService;
    }

    @RabbitListener(queues = MessagingConfig.BOOKING_CREATED_QUEUE)
    public void consumeBookingCreatedEvent(BookingCreatedEvent event) {
        log.info("Received BookingCreatedEvent: bookingId={}, tenantId={}, clientEmail={}",
                event.getBookingId(), event.getTenantId(), event.getClientEmail());

        if (event.getClientEmail() == null || event.getClientEmail().trim().isEmpty()) {
            log.warn("Client email is missing in BookingCreatedEvent, skipping invitation generation");
            return;
        }

        String clientName = event.getClientName();
        String firstName = "Client";
        String lastName = "";
        if (clientName != null && !clientName.trim().isEmpty()) {
            String[] parts = clientName.trim().split("\\s+", 2);
            firstName = parts[0];
            if (parts.length > 1) {
                lastName = parts[1];
            }
        }

        try {
            Map<String, Object> result = authService.inviteTeamMember(
                    event.getTenantId(),
                    event.getClientEmail().trim(),
                    firstName,
                    lastName,
                    "CLIENT",
                    null,
                    null);

            if (result != null && result.containsKey("inviteToken")) {
                String token = (String) result.get("inviteToken");
                log.info("Successfully generated client invitation. Token: {}", token);
            } else {
                log.warn("Invitation generated but no token returned for email: {}", event.getClientEmail());
            }
        } catch (IllegalArgumentException e) {
            log.info("User already invited or member of tenant: {} - {}", event.getClientEmail(), e.getMessage());
        } catch (Exception e) {
            log.error("Failed to automatically invite client for email: {}", event.getClientEmail(), e);
            // Re-throw to trigger standard retry/DLQ if it is a transient DB/connection
            // issue
            throw e;
        }
    }
}
