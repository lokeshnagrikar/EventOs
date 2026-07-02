package com.eventos.event.controller;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.entity.Booking;
import com.eventos.event.entity.Event;
import com.eventos.event.entity.EventTimelineItem;
import com.eventos.event.entity.Invoice;
import com.eventos.event.entity.Payment;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.service.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/client")
@PreAuthorize("hasRole('CLIENT')")
public class ClientPortalController {

    private final ClientDashboardService clientDashboardService;
    private final ClientNotificationService clientNotificationService;
    private final DocumentService documentService;
    private final TimelineService timelineService;
    private final PaymentSummaryService paymentSummaryService;
    private final GalleryAccessService galleryAccessService;
    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;

    public ClientPortalController(ClientDashboardService clientDashboardService,
                                  ClientNotificationService clientNotificationService,
                                  DocumentService documentService,
                                  TimelineService timelineService,
                                  PaymentSummaryService paymentSummaryService,
                                  GalleryAccessService galleryAccessService,
                                  BookingRepository bookingRepository,
                                  EventRepository eventRepository) {
        this.clientDashboardService = clientDashboardService;
        this.clientNotificationService = clientNotificationService;
        this.documentService = documentService;
        this.timelineService = timelineService;
        this.paymentSummaryService = paymentSummaryService;
        this.galleryAccessService = galleryAccessService;
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
    }

    private UserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Client session expired or invalid");
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        UserPrincipal principal = getCurrentPrincipal();
        Map<String, Object> data = clientDashboardService.getDashboardData(principal.getEmail(), principal.getTenantId());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getBookings() {
        UserPrincipal principal = getCurrentPrincipal();
        List<Booking> bookings = bookingRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(principal.getEmail(), principal.getTenantId());
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/events")
    public ResponseEntity<List<Event>> getEvents() {
        UserPrincipal principal = getCurrentPrincipal();
        List<Booking> bookings = bookingRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(principal.getEmail(), principal.getTenantId());
        List<UUID> bookingIds = bookings.stream().map(Booking::getId).collect(Collectors.toList());

        if (bookingIds.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Event> events = eventRepository.findAllByBookingIdInAndTenantId(bookingIds, principal.getTenantId());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/invoices")
    public ResponseEntity<List<Invoice>> getInvoices() {
        UserPrincipal principal = getCurrentPrincipal();
        List<Invoice> invoices = paymentSummaryService.getClientInvoices(principal.getEmail(), principal.getTenantId());
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/payments")
    public ResponseEntity<List<Payment>> getPayments() {
        UserPrincipal principal = getCurrentPrincipal();
        List<Payment> payments = paymentSummaryService.getClientPayments(principal.getEmail(), principal.getTenantId());
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/gallery")
    public ResponseEntity<List<Map<String, Object>>> getGallery() {
        UserPrincipal principal = getCurrentPrincipal();
        List<Map<String, Object>> galleries = galleryAccessService.getClientGalleries(principal.getEmail(), principal.getTenantId());
        return ResponseEntity.ok(galleries);
    }

    @GetMapping("/documents")
    public ResponseEntity<List<Map<String, Object>>> getDocuments() {
        UserPrincipal principal = getCurrentPrincipal();
        List<Map<String, Object>> documents = documentService.getDocuments(principal.getEmail(), principal.getTenantId());
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Map<String, Object>>> getNotifications() {
        UserPrincipal principal = getCurrentPrincipal();
        List<Map<String, Object>> notifications = clientNotificationService.getNotifications(principal.getEmail(), principal.getTenantId());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/timeline")
    public ResponseEntity<List<EventTimelineItem>> getTimeline() {
        UserPrincipal principal = getCurrentPrincipal();
        List<EventTimelineItem> items = timelineService.getTimelineItems(principal.getEmail(), principal.getTenantId());
        return ResponseEntity.ok(items);
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody Map<String, Object> payload) {
        UserPrincipal principal = getCurrentPrincipal();
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("updatedAt", new Date());
        response.put("message", "Profile updated for client " + principal.getEmail());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/preferences")
    public ResponseEntity<Map<String, Object>> updatePreferences(@RequestBody Map<String, Object> payload) {
        UserPrincipal principal = getCurrentPrincipal();
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("updatedAt", new Date());
        response.put("message", "Preferences patched for client " + principal.getEmail());
        return ResponseEntity.ok(response);
    }
}
