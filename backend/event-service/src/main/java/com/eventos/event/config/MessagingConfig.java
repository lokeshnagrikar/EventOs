package com.eventos.event.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MessagingConfig {

    public static final String EXCHANGE = "eventos.exchange";
    public static final String BOOKING_QUEUE = "event.booking.queue";
    public static final String BOOKING_DLQ = "event.booking.dlq";
    public static final String BOOKING_ROUTING_KEY = "quote.accepted";

    public static final String BOOKING_CREATED_QUEUE = "event.booking.created.queue";
    public static final String BOOKING_CREATED_DLQ = "event.booking.created.dlq";
    public static final String BOOKING_CREATED_ROUTING_KEY = "booking.created";

    public static final String BOOKING_CANCELLED_QUEUE = "event.booking.cancelled.queue";
    public static final String BOOKING_CANCELLED_DLQ = "event.booking.cancelled.dlq";
    public static final String BOOKING_CANCELLED_ROUTING_KEY = "booking.cancelled";

    public static final String PAYMENT_RECORDED_QUEUE = "event.payment.recorded.queue";
    public static final String PAYMENT_RECORDED_DLQ = "event.payment.recorded.dlq";
    public static final String PAYMENT_RECORDED_ROUTING_KEY = "event.payment.recorded";

    public static final String TASK_NOTIFICATION_QUEUE = "event.task.notification.queue";
    public static final String TASK_NOTIFICATION_DLQ = "event.task.notification.dlq";
    public static final String TASK_NOTIFICATION_ROUTING_KEY = "task.notification";

    @Bean
    public TopicExchange eventosExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue bookingQueue() {
        return QueueBuilder.durable(BOOKING_QUEUE)
                .withArgument("x-dead-letter-exchange", EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "quote.accepted.dlq")
                .build();
    }

    @Bean
    public Queue bookingDlq() {
        return new Queue(BOOKING_DLQ);
    }

    @Bean
    public Binding bookingBinding(Queue bookingQueue, TopicExchange eventosExchange) {
        return BindingBuilder.bind(bookingQueue).to(eventosExchange).with(BOOKING_ROUTING_KEY);
    }

    @Bean
    public Binding bookingDlqBinding(Queue bookingDlq, TopicExchange eventosExchange) {
        return BindingBuilder.bind(bookingDlq).to(eventosExchange).with("quote.accepted.dlq");
    }

    @Bean
    public Queue bookingCreatedQueue() {
        return QueueBuilder.durable(BOOKING_CREATED_QUEUE)
                .withArgument("x-dead-letter-exchange", EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "booking.created.dlq")
                .build();
    }

    @Bean
    public Queue bookingCreatedDlq() {
        return new Queue(BOOKING_CREATED_DLQ);
    }

    @Bean
    public Binding bookingCreatedBinding(Queue bookingCreatedQueue, TopicExchange eventosExchange) {
        return BindingBuilder.bind(bookingCreatedQueue).to(eventosExchange).with(BOOKING_CREATED_ROUTING_KEY);
    }

    @Bean
    public Binding bookingCreatedDlqBinding(Queue bookingCreatedDlq, TopicExchange eventosExchange) {
        return BindingBuilder.bind(bookingCreatedDlq).to(eventosExchange).with("booking.created.dlq");
    }

    @Bean
    public Queue bookingCancelledQueue() {
        return QueueBuilder.durable(BOOKING_CANCELLED_QUEUE)
                .withArgument("x-dead-letter-exchange", EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "booking.cancelled.dlq")
                .build();
    }

    @Bean
    public Queue bookingCancelledDlq() {
        return new Queue(BOOKING_CANCELLED_DLQ);
    }

    @Bean
    public Binding bookingCancelledBinding(Queue bookingCancelledQueue, TopicExchange eventosExchange) {
        return BindingBuilder.bind(bookingCancelledQueue).to(eventosExchange).with(BOOKING_CANCELLED_ROUTING_KEY);
    }

    @Bean
    public Binding bookingCancelledDlqBinding(Queue bookingCancelledDlq, TopicExchange eventosExchange) {
        return BindingBuilder.bind(bookingCancelledDlq).to(eventosExchange).with("booking.cancelled.dlq");
    }

    @Bean
    public Queue paymentRecordedQueue() {
        return QueueBuilder.durable(PAYMENT_RECORDED_QUEUE)
                .withArgument("x-dead-letter-exchange", EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "payment.recorded.dlq")
                .build();
    }

    @Bean
    public Queue paymentRecordedDlq() {
        return new Queue(PAYMENT_RECORDED_DLQ);
    }

    @Bean
    public Binding paymentRecordedBinding(Queue paymentRecordedQueue, TopicExchange eventosExchange) {
        return BindingBuilder.bind(paymentRecordedQueue).to(eventosExchange).with(PAYMENT_RECORDED_ROUTING_KEY);
    }

    @Bean
    public Binding paymentRecordedDlqBinding(Queue paymentRecordedDlq, TopicExchange eventosExchange) {
        return BindingBuilder.bind(paymentRecordedDlq).to(eventosExchange).with("payment.recorded.dlq");
    }

    @Bean
    public Queue taskNotificationQueue() {
        return QueueBuilder.durable(TASK_NOTIFICATION_QUEUE)
                .withArgument("x-dead-letter-exchange", EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "task.notification.dlq")
                .build();
    }

    @Bean
    public Queue taskNotificationDlq() {
        return new Queue(TASK_NOTIFICATION_DLQ);
    }

    @Bean
    public Binding taskNotificationBinding(Queue taskNotificationQueue, TopicExchange eventosExchange) {
        return BindingBuilder.bind(taskNotificationQueue).to(eventosExchange).with(TASK_NOTIFICATION_ROUTING_KEY);
    }

    @Bean
    public Binding taskNotificationDlqBinding(Queue taskNotificationDlq, TopicExchange eventosExchange) {
        return BindingBuilder.bind(taskNotificationDlq).to(eventosExchange).with("task.notification.dlq");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper typeMapper = 
            new org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper();
        typeMapper.setTrustedPackages("*");
        typeMapper.setTypePrecedence(org.springframework.amqp.support.converter.Jackson2JavaTypeMapper.TypePrecedence.INFERRED);
        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }
}
