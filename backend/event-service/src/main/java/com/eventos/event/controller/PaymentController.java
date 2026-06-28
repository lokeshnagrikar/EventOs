package com.eventos.event.controller;

import com.eventos.event.dto.CreatePaymentDto;
import com.eventos.event.entity.Payment;
import com.eventos.event.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> recordPayment(@Valid @RequestBody CreatePaymentDto dto) {
        try {
            UUID tenantId = getTenantId();
            Payment saved = paymentService.savePayment(dto, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", saved);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            // Rethrow security/status exceptions so Spring MVC returns the correct HTTP status (e.g. 403 Forbidden)
            throw e;
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("RECORD_FAILED", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getPayments(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        UUID tenantId = getTenantId();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);

        if (page != null && size != null) {
            org.springframework.data.domain.Page<Payment> paymentsPage = paymentService.getAllPayments(tenantId,
                    org.springframework.data.domain.PageRequest.of(page, size));
            response.put("data", paymentsPage.getContent());

            Map<String, Object> pagination = new HashMap<>();
            pagination.put("page", paymentsPage.getNumber());
            pagination.put("size", paymentsPage.getSize());
            pagination.put("totalElements", paymentsPage.getTotalElements());
            pagination.put("totalPages", paymentsPage.getTotalPages());
            response.put("pagination", pagination);
        } else {
            List<Payment> payments = paymentService.getAllPayments(tenantId);
            response.put("data", payments);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getPaymentStats() {
        UUID tenantId = getTenantId();
        Map<String, Object> stats = paymentService.getPaymentStats(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getPaymentsByBooking(@PathVariable UUID bookingId) {
        try {
            UUID tenantId = getTenantId();
            List<Payment> payments = paymentService.getPaymentsByBooking(bookingId, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", payments);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("FETCH_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getPaymentDetails(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            Payment payment = paymentService.getPaymentById(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", payment);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> deletePayment(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            paymentService.deletePayment(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment record deleted successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @GetMapping("/client")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getClientPayments() {
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        String email = principal.getEmail();
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", "Email is missing from authentication context"));
        }
        UUID tenantId = principal.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", "Tenant ID is missing from authentication context"));
        }
        List<Payment> payments = paymentService.getPaymentsByClientEmail(email, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", payments);

        return ResponseEntity.ok(response);
    }

    // --- Helper Methods ---

    private com.eventos.event.config.UserPrincipal getCurrentPrincipal() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.event.config.UserPrincipal) {
            return (com.eventos.event.config.UserPrincipal) auth.getPrincipal();
        }
        throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Authentication context is missing");
    }

    private UUID getTenantId() {
        UUID tenantId = getCurrentPrincipal().getTenantId();
        if (tenantId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Tenant ID context is missing");
        }
        return tenantId;
    }

    private Map<String, Object> createErrorResponse(String code, String message) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("code", code);
        errorDetails.put("message", message);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", errorDetails);

        return errorResponse;
    }
}
