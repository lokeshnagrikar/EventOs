package com.eventos.crm.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MessagingConfig {

    public static final String EXCHANGE = "eventos.exchange";
    public static final String LEAD_QUEUE = "crm.lead.queue";
    public static final String LEAD_DLQ = "crm.lead.dlq";
    public static final String LEAD_ROUTING_KEY = "budget.converted.lead";

    public static final String LEAD_CREATED_QUEUE = "crm.lead.created.queue";
    public static final String LEAD_CREATED_DLQ = "crm.lead.created.dlq";
    public static final String LEAD_CREATED_ROUTING_KEY = "crm.lead.created";

    public static final String LEAD_STATUS_UPDATED_QUEUE = "crm.lead.status.updated.queue";
    public static final String LEAD_STATUS_UPDATED_DLQ = "crm.lead.status.updated.dlq";
    public static final String LEAD_STATUS_UPDATED_ROUTING_KEY = "crm.lead.status.updated";

    @Bean
    public TopicExchange crmExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue leadQueue() {
        return QueueBuilder.durable(LEAD_QUEUE)
                .withArgument("x-dead-letter-exchange", EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "budget.converted.lead.dlq")
                .build();
    }

    @Bean
    public Queue leadDlq() {
        return new Queue(LEAD_DLQ);
    }

    @Bean
    public Binding leadBinding(Queue leadQueue, TopicExchange crmExchange) {
        return BindingBuilder.bind(leadQueue).to(crmExchange).with(LEAD_ROUTING_KEY);
    }

    @Bean
    public Binding leadDlqBinding(Queue leadDlq, TopicExchange crmExchange) {
        return BindingBuilder.bind(leadDlq).to(crmExchange).with("budget.converted.lead.dlq");
    }

    @Bean
    public Queue leadCreatedQueue() {
        return QueueBuilder.durable(LEAD_CREATED_QUEUE)
                .withArgument("x-dead-letter-exchange", EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "crm.lead.created.dlq")
                .build();
    }

    @Bean
    public Queue leadCreatedDlq() {
        return new Queue(LEAD_CREATED_DLQ);
    }

    @Bean
    public Binding leadCreatedBinding(Queue leadCreatedQueue, TopicExchange crmExchange) {
        return BindingBuilder.bind(leadCreatedQueue).to(crmExchange).with(LEAD_CREATED_ROUTING_KEY);
    }

    @Bean
    public Binding leadCreatedDlqBinding(Queue leadCreatedDlq, TopicExchange crmExchange) {
        return BindingBuilder.bind(leadCreatedDlq).to(crmExchange).with("crm.lead.created.dlq");
    }

    @Bean
    public Queue leadStatusUpdatedQueue() {
        return QueueBuilder.durable(LEAD_STATUS_UPDATED_QUEUE)
                .withArgument("x-dead-letter-exchange", EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "crm.lead.status.updated.dlq")
                .build();
    }

    @Bean
    public Queue leadStatusUpdatedDlq() {
        return new Queue(LEAD_STATUS_UPDATED_DLQ);
    }

    @Bean
    public Binding leadStatusUpdatedBinding(Queue leadStatusUpdatedQueue, TopicExchange crmExchange) {
        return BindingBuilder.bind(leadStatusUpdatedQueue).to(crmExchange).with(LEAD_STATUS_UPDATED_ROUTING_KEY);
    }

    @Bean
    public Binding leadStatusUpdatedDlqBinding(Queue leadStatusUpdatedDlq, TopicExchange crmExchange) {
        return BindingBuilder.bind(leadStatusUpdatedDlq).to(crmExchange).with("crm.lead.status.updated.dlq");
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
