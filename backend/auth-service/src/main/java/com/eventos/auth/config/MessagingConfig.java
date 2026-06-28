package com.eventos.auth.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MessagingConfig {

    public static final String EXCHANGE = "eventos.exchange";
    public static final String AUDIT_QUEUE = "auth.audit.queue";
    public static final String AUDIT_DLQ = "auth.audit.dlq";
    public static final String AUDIT_ROUTING_KEY = "auth.audit.#";
    public static final String AUDIT_DLQ_ROUTING_KEY = "auth.audit.dlq";
    
    public static final String BOOKING_CREATED_QUEUE = "auth.booking.created.queue";
    public static final String BOOKING_CREATED_ROUTING_KEY = "booking.created";

    @Bean
    public TopicExchange eventosExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue auditQueue() {
        return QueueBuilder.durable(AUDIT_QUEUE)
                .withArgument("x-dead-letter-exchange", EXCHANGE)
                .withArgument("x-dead-letter-routing-key", AUDIT_DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public Queue auditDlq() {
        return new Queue(AUDIT_DLQ);
    }

    @Bean
    public Queue bookingCreatedQueue() {
        return QueueBuilder.durable(BOOKING_CREATED_QUEUE).build();
    }

    @Bean
    public Binding auditBinding(Queue auditQueue, TopicExchange eventosExchange) {
        return BindingBuilder.bind(auditQueue).to(eventosExchange).with(AUDIT_ROUTING_KEY);
    }

    @Bean
    public Binding auditDlqBinding(Queue auditDlq, TopicExchange eventosExchange) {
        return BindingBuilder.bind(auditDlq).to(eventosExchange).with(AUDIT_DLQ_ROUTING_KEY);
    }

    @Bean
    public Binding bookingCreatedBinding(Queue bookingCreatedQueue, TopicExchange eventosExchange) {
        return BindingBuilder.bind(bookingCreatedQueue).to(eventosExchange).with(BOOKING_CREATED_ROUTING_KEY);
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
