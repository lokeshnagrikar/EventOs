package com.eventos.event.scheduler;

import com.eventos.event.config.MessagingConfig;
import com.eventos.event.entity.Invoice;
import com.eventos.event.repository.InvoiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class InvoiceReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(InvoiceReminderScheduler.class);

    private final InvoiceRepository invoiceRepository;
    private final RabbitTemplate rabbitTemplate;

    public InvoiceReminderScheduler(InvoiceRepository invoiceRepository, RabbitTemplate rabbitTemplate) {
        this.invoiceRepository = invoiceRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    // Run every day at 8:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void sendOverdueInvoiceReminders() {
        log.info("Checking for overdue invoices to send reminders...");
        try {
            List<Invoice> overdueInvoices = invoiceRepository.findOverdueInvoices(LocalDateTime.now());
            log.info("Found {} overdue invoices.", overdueInvoices.size());

            for (Invoice invoice : overdueInvoices) {
                Map<String, Object> reminderMsg = new HashMap<>();
                reminderMsg.put("invoiceId", invoice.getId().toString());
                reminderMsg.put("invoiceNumber", invoice.getInvoiceNumber());
                reminderMsg.put("clientEmail", invoice.getClientEmail());
                reminderMsg.put("clientName", invoice.getClientName());
                reminderMsg.put("totalAmount", invoice.getTotalAmount());
                reminderMsg.put("outstandingAmount", invoice.getOutstandingBalance());
                reminderMsg.put("dueDate", invoice.getDueDate().toString());
                reminderMsg.put("tenantId", invoice.getTenantId().toString());

                log.info("Publishing invoice reminder event for invoice: {}", invoice.getInvoiceNumber());
                rabbitTemplate.convertAndSend(MessagingConfig.EXCHANGE, MessagingConfig.INVOICE_REMINDER_ROUTING_KEY, reminderMsg);
            }
        } catch (Exception e) {
            log.error("Failed to run overdue invoice reminders scheduled task: {}", e.getMessage());
        }
    }
}
