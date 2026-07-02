package com.eventos.event.consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class DeadLetterQueueConsumer {

    private static final Logger log = LoggerFactory.getLogger(DeadLetterQueueConsumer.class);

    @RabbitListener(queues = {
        "event.booking.dlq",
        "event.booking.created.dlq",
        "event.booking.cancelled.dlq",
        "event.payment.recorded.dlq",
        "event.task.notification.dlq",
        "event.invoice.reminder.dlq"
    })
    public void processFailedMessages(Message failedMessage) {
        try {
            String body = new String(failedMessage.getBody());
            String routingKey = failedMessage.getMessageProperties().getReceivedRoutingKey();
            log.error("CRITICAL: Message failed processing and moved to DLQ. Routing Key: {}, Body: {}", routingKey, body);
        } catch (Exception e) {
            log.error("Failed to parse DLQ message: {}", e.getMessage());
        }
    }
}
