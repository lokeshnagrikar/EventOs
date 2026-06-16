package com.eventos.event.controller;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.CreateBookingDto;
import com.eventos.event.dto.CreateBookingTimelineEventDto;
import com.eventos.event.dto.CreateBookingAssignmentDto;
import com.eventos.event.entity.Booking;
import com.eventos.event.entity.BookingStatus;
import com.eventos.event.entity.BookingTimelineEvent;
import com.eventos.event.entity.BookingAssignment;
import com.eventos.event.entity.BookingAuditLog;
import com.eventos.event.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // ─── Tenant helper (JWT-only, no header fallback) ──────────────────────────

    private UUID getTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            UUID tenantId = principal.getTenantId();
            if (tenantId != null) return tenantId;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context is missing");
    }

    private String getAuthorizationHeader() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attr =
                (org.springframework.web.context.request.ServletRequestAttributes)
                    org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attr != null) return attr.getRequest().getHeader("Authorization");
        } catch (Exception ignored) {}
        return null;
    }

    // ─── Booking CRUD ──────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getBookings() {
        UUID tenantId = getTenantId();
        List<Booking> bookings = bookingService.getAllBookings(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", bookings);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getBookingById(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        Booking booking = bookingService.getBookingById(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", booking);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> createBooking(@Valid @RequestBody CreateBookingDto dto) {
        UUID tenantId = getTenantId();
        String authHeader = getAuthorizationHeader();
        Booking booking = bookingService.createBooking(dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", booking);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/from-quote/{quoteId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> createFromQuote(@PathVariable UUID quoteId) {
        UUID tenantId = getTenantId();
        String authHeader = getAuthorizationHeader();
        Booking booking = bookingService.createBookingFromQuote(quoteId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", booking);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/by-quote/{quoteId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getBookingByQuoteId(@PathVariable UUID quoteId) {
        UUID tenantId = getTenantId();
        Booking booking = bookingService.getBookingByQuoteId(quoteId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", booking);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        String statusStr = request.get("status");
        if (statusStr == null || statusStr.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status parameter is required");
        }

        BookingStatus status;
        try {
            status = BookingStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value: " + statusStr);
        }

        UUID tenantId = getTenantId();
        Booking booking = bookingService.updateBookingStatus(id, status, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", booking);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/payment")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> updatePayment(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        String amountStr = request.get("amount");
        if (amountStr == null || amountStr.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount parameter is required");
        }

        BigDecimal amount;
        try {
            amount = new BigDecimal(amountStr);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid amount value: " + amountStr);
        }

        UUID tenantId = getTenantId();
        Booking booking = bookingService.updatePaidAmount(id, amount, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", booking);

        return ResponseEntity.ok(response);
    }

    // ─── Booking Timeline Milestones ───────────────────────────────────────────

    @PostMapping("/{id}/timeline")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> addMilestone(@PathVariable UUID id, @Valid @RequestBody CreateBookingTimelineEventDto dto) {
        UUID tenantId = getTenantId();
        BookingTimelineEvent milestone = bookingService.addTimelineEvent(id, dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", milestone);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/timeline/{milestoneId}/toggle")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> toggleMilestone(@PathVariable UUID id, @PathVariable UUID milestoneId) {
        UUID tenantId = getTenantId();
        BookingTimelineEvent milestone = bookingService.toggleTimelineEventStatus(id, milestoneId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", milestone);

        return ResponseEntity.ok(response);
    }

    // ─── Booking Resource Assignments ─────────────────────────────────────────

    @GetMapping("/{id}/resources")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getResources(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        List<BookingAssignment> resources = bookingService.getResources(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", resources);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/resources")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> assignResource(@PathVariable UUID id, @Valid @RequestBody CreateBookingAssignmentDto dto) {
        UUID tenantId = getTenantId();
        BookingAssignment resource = bookingService.assignResource(id, dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", resource);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/resources/{resourceId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<?> removeResource(@PathVariable UUID id, @PathVariable UUID resourceId) {
        UUID tenantId = getTenantId();
        bookingService.removeResource(id, resourceId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);

        return ResponseEntity.ok(response);
    }

    // ─── Booking Audit Logs ────────────────────────────────────────────────────

    @GetMapping("/{id}/audit")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> getAuditLogs(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        List<BookingAuditLog> auditLogs = bookingService.getAuditLogs(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", auditLogs);

        return ResponseEntity.ok(response);
    }
}
