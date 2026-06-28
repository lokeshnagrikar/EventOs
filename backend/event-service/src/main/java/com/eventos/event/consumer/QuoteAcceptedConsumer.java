package com.eventos.event.consumer;

import com.eventos.event.event.QuoteAcceptedEvent;
import com.eventos.event.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class QuoteAcceptedConsumer {

    private static final Logger log = LoggerFactory.getLogger(QuoteAcceptedConsumer.class);
    private final BookingService bookingService;

    public QuoteAcceptedConsumer(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @RabbitListener(queues = "event.booking.queue")
    public void consume(QuoteAcceptedEvent event) {
        log.info("Received QuoteAcceptedEvent for Quote ID: {}", event.getQuoteId());
        try {
            com.eventos.event.config.TenantContext.setTenantId(event.getTenantId());
            bookingService.createBookingFromQuoteEvent(event);
        } catch (Exception e) {
            log.error("Failed to process QuoteAcceptedEvent for Quote ID: {}", event.getQuoteId(), e);
            throw e;
        } finally {
            com.eventos.event.config.TenantContext.clear();
        }
    }
}
