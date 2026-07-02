package com.eventos.event.service;

import com.eventos.event.entity.Booking;
import com.eventos.event.entity.Event;
import com.eventos.event.entity.Invoice;
import com.eventos.event.entity.Payment;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.InvoiceRepository;
import com.eventos.event.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClientDashboardService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    public ClientDashboardService(BookingRepository bookingRepository,
                                  EventRepository eventRepository,
                                  InvoiceRepository invoiceRepository,
                                  PaymentRepository paymentRepository) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
    }

    public Map<String, Object> getDashboardData(String clientEmail, UUID tenantId) {
        Map<String, Object> data = new HashMap<>();

        List<Booking> bookings = bookingRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
        List<UUID> bookingIds = bookings.stream().map(Booking::getId).collect(Collectors.toList());

        List<Event> events = bookingIds.isEmpty() ? Collections.emptyList() : eventRepository.findAllByBookingIdInAndTenantId(bookingIds, tenantId);
        List<Invoice> invoices = invoiceRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
        List<Payment> payments = paymentRepository.findAllByClientEmailAndTenantId(clientEmail, tenantId);

        BigDecimal outstandingBalance = BigDecimal.ZERO;
        BigDecimal paidAmount = BigDecimal.ZERO;

        for (Invoice inv : invoices) {
            if (!"CANCELLED".equalsIgnoreCase(inv.getStatus()) && !"VOIDED".equalsIgnoreCase(inv.getStatus())) {
                outstandingBalance = outstandingBalance.add(inv.getTotalAmount().subtract(inv.getPaidAmount()));
                paidAmount = paidAmount.add(inv.getPaidAmount());
            }
        }

        Event upcomingEvent = events.stream()
                .filter(e -> e.getStartDate().isAfter(LocalDateTime.now()))
                .min(Comparator.comparing(Event::getStartDate))
                .orElse(events.isEmpty() ? null : events.get(0));

        long daysRemaining = 0;
        if (upcomingEvent != null) {
            daysRemaining = ChronoUnit.DAYS.between(LocalDateTime.now(), upcomingEvent.getStartDate());
            daysRemaining = Math.max(0, daysRemaining);
        }

        data.put("clientEmail", clientEmail);
        data.put("bookingsCount", bookings.size());
        data.put("eventsCount", events.size());
        data.put("upcomingEvent", upcomingEvent);
        data.put("daysRemaining", daysRemaining);
        data.put("outstandingBalance", outstandingBalance);
        data.put("paidAmount", paidAmount);
        data.put("recentInvoices", invoices.stream().limit(5).collect(Collectors.toList()));
        data.put("recentPayments", payments.stream().limit(5).collect(Collectors.toList()));

        return data;
    }
}
