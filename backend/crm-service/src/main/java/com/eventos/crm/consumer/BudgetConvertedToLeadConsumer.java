package com.eventos.crm.consumer;

import com.eventos.crm.event.BudgetConvertedToLeadEvent;
import com.eventos.crm.service.LeadService;
import com.eventos.crm.service.QuoteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class BudgetConvertedToLeadConsumer {

    private static final Logger log = LoggerFactory.getLogger(BudgetConvertedToLeadConsumer.class);
    private final LeadService leadService;
    private final QuoteService quoteService;

    public BudgetConvertedToLeadConsumer(LeadService leadService, QuoteService quoteService) {
        this.leadService = leadService;
        this.quoteService = quoteService;
    }

    @RabbitListener(queues = "crm.lead.queue")
    public void consume(BudgetConvertedToLeadEvent event) {
        log.info("Received BudgetConvertedToLeadEvent for Estimate ID: {}, Lead ID: {}", event.getEstimateId(), event.getLeadId());
        try {
            leadService.createLeadFromEvent(event);
            if (event.isGenerateQuote()) {
                quoteService.createQuoteFromEvent(event);
            }
        } catch (Exception e) {
            log.error("Failed to process BudgetConvertedToLeadEvent for Estimate ID: {}", event.getEstimateId(), e);
            throw e;
        }
    }
}
