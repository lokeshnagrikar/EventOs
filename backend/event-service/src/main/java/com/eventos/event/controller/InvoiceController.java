package com.eventos.event.controller;

import com.eventos.event.dto.CreateInvoiceDto;
import com.eventos.event.dto.UpdateInvoiceStatusDto;
import com.eventos.event.entity.Invoice;
import com.eventos.event.entity.InvoiceHistory;
import com.eventos.event.service.InvoiceService;
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
@RequestMapping("/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> createInvoice(@Valid @RequestBody CreateInvoiceDto dto) {
        try {
            UUID tenantId = getTenantId();
            Invoice saved = invoiceService.createInvoice(dto, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", saved);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("CREATE_FAILED", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getInvoices(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        UUID tenantId = getTenantId();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);

        if (page != null && size != null) {
            org.springframework.data.domain.Page<Invoice> invoicesPage = invoiceService.getAllInvoices(tenantId, org.springframework.data.domain.PageRequest.of(page, size));
            response.put("data", invoicesPage.getContent());

            Map<String, Object> pagination = new HashMap<>();
            pagination.put("page", invoicesPage.getNumber());
            pagination.put("size", invoicesPage.getSize());
            pagination.put("totalElements", invoicesPage.getTotalElements());
            pagination.put("totalPages", invoicesPage.getTotalPages());
            response.put("pagination", pagination);
        } else {
            List<Invoice> invoices = invoiceService.getAllInvoices(tenantId);
            response.put("data", invoices);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getInvoiceStats() {
        UUID tenantId = getTenantId();
        Map<String, Object> stats = invoiceService.getInvoiceStats(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getInvoicesByBooking(@PathVariable UUID bookingId) {
        try {
            UUID tenantId = getTenantId();
            List<Invoice> invoices = invoiceService.getInvoicesByBooking(bookingId, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", invoices);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("FETCH_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getInvoiceDetails(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            Invoice invoice = invoiceService.getInvoiceById(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", invoice);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> updateInvoiceStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInvoiceStatusDto dto) {
        try {
            UUID tenantId = getTenantId();
            Invoice updated = invoiceService.updateInvoiceStatus(id, dto.getStatus(), tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", updated);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("UPDATE_FAILED", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> deleteInvoice(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            invoiceService.deleteInvoice(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Invoice deleted successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @PostMapping("/{id}/remind")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> sendPaymentReminder(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            invoiceService.sendPaymentReminder(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment reminder sent successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("REMIND_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/client")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getClientInvoices() {
        com.eventos.event.config.UserPrincipal principal = getCurrentPrincipal();
        String email = principal.getEmail();
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Email is missing from authentication context"));
        }
        UUID tenantId = principal.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Tenant ID is missing from authentication context"));
        }
        List<Invoice> invoices = invoiceService.getInvoicesByClientEmail(email, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", invoices);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getInvoicePdf(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            byte[] pdfBytes = invoiceService.generateInvoicePdf(id, tenantId);
            Invoice invoice = invoiceService.getInvoiceById(id, tenantId);
            String filename = "invoice-" + invoice.getInvoiceNumber() + ".pdf";

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("PDF_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getInvoiceHistory(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            List<InvoiceHistory> history = invoiceService.getInvoiceHistory(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", history);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("FETCH_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reconcile")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> reconcileInvoice(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            Invoice reconciled = invoiceService.reconcileInvoice(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", reconciled);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("RECONCILE_FAILED", e.getMessage()));
        }
    }

    // --- Helper Methods ---

    private com.eventos.event.config.UserPrincipal getCurrentPrincipal() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
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
