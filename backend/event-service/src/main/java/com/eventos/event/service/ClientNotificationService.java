package com.eventos.event.service;

import com.eventos.event.entity.Booking;
import com.eventos.event.entity.Invoice;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.InvoiceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ClientNotificationService {

    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;

    public ClientNotificationService(BookingRepository bookingRepository, InvoiceRepository invoiceRepository) {
        this.bookingRepository = bookingRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public List<Map<String, Object>> getNotifications(String clientEmail, UUID tenantId) {
        List<Map<String, Object>> notifications = new ArrayList<>();

        if (clientEmail == null || clientEmail.trim().isEmpty() || tenantId == null) {
            return notifications;
        }

        List<Booking> bookings = bookingRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
        for (Booking booking : bookings) {
            Map<String, Object> n = new HashMap<>();
            n.put("id", UUID.randomUUID());
            n.put("title", "Booking Confirmed");
            n.put("message", "Booking " + booking.getBookingNumber() + " is confirmed in your event schedule.");
            n.put("createdAt", booking.getCreatedAt() != null ? booking.getCreatedAt() : LocalDateTime.now());
            n.put("read", false);
            n.put("category", "TODAY");
            notifications.add(n);
        }

        List<Invoice> invoices = invoiceRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
        for (Invoice inv : invoices) {
            Map<String, Object> n = new HashMap<>();
            n.put("id", UUID.randomUUID());
            n.put("title", "Invoice " + inv.getStatus());
            n.put("message", "Tax invoice " + inv.getInvoiceNumber() + " total amount " + inv.getTotalAmount() + " is logged.");
            n.put("createdAt", inv.getCreatedAt() != null ? inv.getCreatedAt() : LocalDateTime.now());
            n.put("read", "PAID".equalsIgnoreCase(inv.getStatus()));
            n.put("category", "YESTERDAY");
            notifications.add(n);
        }

        return notifications;
    }
}
