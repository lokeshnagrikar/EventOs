package com.eventos.crm.event;

import com.eventos.crm.service.QuoteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class QuotePdfListener {
    private static final Logger log = LoggerFactory.getLogger(QuotePdfListener.class);
    private final QuoteService quoteService;

    public QuotePdfListener(QuoteService quoteService) {
        this.quoteService = quoteService;
    }

    @Async("pdfTaskExecutor")
    @EventListener
    public void handlePdfGeneration(QuotePdfGenerationEvent event) {
        log.info("Received background PDF generation request for quote: {}", event.getQuoteId());
        
        int maxAttempts = 3;
        int delayMs = 2000;
        
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                quoteService.generateAndUploadPdfInBackground(event.getQuoteId(), event.getTenantId());
                log.info("Successfully completed background PDF generation for quote {} on attempt {}", event.getQuoteId(), attempt);
                return;
            } catch (Exception e) {
                log.error("Failed PDF generation attempt {} of {} for quote {}: {}", 
                        attempt, maxAttempts, event.getQuoteId(), e.getMessage());
                if (attempt == maxAttempts) {
                    log.error("Max retries reached. PDF generation failed for quote: {}", event.getQuoteId());
                } else {
                    try {
                        Thread.sleep(delayMs * attempt); // Exponential backoff: 2s, 4s...
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        log.error("Thread interrupted during retry backoff for quote: {}", event.getQuoteId());
                        return;
                    }
                }
            }
        }
    }
}
