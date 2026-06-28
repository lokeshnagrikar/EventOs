package com.eventos.gallery.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MessagingConfig {

    public static final String EXCHANGE = "eventos.exchange";
    
    public static final String CLEANUP_QUEUE = "gallery.cleanup.queue";
    public static final String CLEANUP_DLQ = "gallery.cleanup.dlq";
    public static final String CLEANUP_ROUTING_KEY = "gallery.media.deleted";
    public static final String CLEANUP_DLQ_ROUTING_KEY = "gallery.media.deleted.dlq";

    @Bean
    public TopicExchange eventosExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue cleanupQueue() {
        return QueueBuilder.durable(CLEANUP_QUEUE)
                .withArgument("x-dead-letter-exchange", EXCHANGE)
                .withArgument("x-dead-letter-routing-key", CLEANUP_DLQ_ROUTING_KEY)
                .build();
    }

    @Bean
    public Queue cleanupDlq() {
        return new Queue(CLEANUP_DLQ);
    }

    @Bean
    public Binding cleanupBinding(Queue cleanupQueue, TopicExchange eventosExchange) {
        return BindingBuilder.bind(cleanupQueue).to(eventosExchange).with(CLEANUP_ROUTING_KEY);
    }

    @Bean
    public Binding cleanupDlqBinding(Queue cleanupDlq, TopicExchange eventosExchange) {
        return BindingBuilder.bind(cleanupDlq).to(eventosExchange).with(CLEANUP_DLQ_ROUTING_KEY);
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
