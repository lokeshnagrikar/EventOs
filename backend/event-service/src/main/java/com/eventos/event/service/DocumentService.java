package com.eventos.event.service;

import com.eventos.event.entity.Booking;
import com.eventos.event.entity.Invoice;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.InvoiceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class DocumentService {

    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;

    public DocumentService(BookingRepository bookingRepository, InvoiceRepository invoiceRepository) {
        this.bookingRepository = bookingRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public List<Map<String, Object>> getDocuments(String clientEmail, UUID tenantId) {
        List<Map<String, Object>> documents = new ArrayList<>();

        if (clientEmail == null || clientEmail.trim().isEmpty() || tenantId == null) {
            return documents;
        }

        // 1. Contracts from real confirmed Bookings
        List<Booking> bookings = bookingRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
        for (Booking booking : bookings) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("id", booking.getId().toString());
            doc.put("name", "Event_Contract_" + booking.getBookingNumber() + ".pdf");
            doc.put("type", "CONTRACT");
            doc.put("size", "1.8 MB");
            doc.put("createdAt", booking.getCreatedAt() != null ? booking.getCreatedAt() : LocalDateTime.now());
            doc.put("downloadUrl", "/api/v1/client/documents/download/" + booking.getId());
            documents.add(doc);
        }

        // 2. Official Statements from real Invoices
        List<Invoice> invoices = invoiceRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
        for (Invoice invoice : invoices) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("id", invoice.getId().toString());
            doc.put("name", "Tax_Invoice_" + invoice.getInvoiceNumber() + ".pdf");
            doc.put("type", "INVOICE");
            doc.put("size", "450 KB");
            doc.put("createdAt", invoice.getCreatedAt() != null ? invoice.getCreatedAt() : LocalDateTime.now());
            doc.put("downloadUrl", "/api/v1/client/documents/download/" + invoice.getId());
            documents.add(doc);
        }

        return documents;
    }
}
