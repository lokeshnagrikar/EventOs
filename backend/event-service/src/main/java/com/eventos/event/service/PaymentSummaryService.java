package com.eventos.event.service;

import com.eventos.event.entity.Invoice;
import com.eventos.event.entity.Payment;
import com.eventos.event.repository.InvoiceRepository;
import com.eventos.event.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PaymentSummaryService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    public PaymentSummaryService(InvoiceRepository invoiceRepository,
                                 PaymentRepository paymentRepository) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
    }

    public List<Invoice> getClientInvoices(String clientEmail, UUID tenantId) {
        return invoiceRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
    }

    public List<Payment> getClientPayments(String clientEmail, UUID tenantId) {
        return paymentRepository.findAllByClientEmailAndTenantId(clientEmail, tenantId);
    }
}
