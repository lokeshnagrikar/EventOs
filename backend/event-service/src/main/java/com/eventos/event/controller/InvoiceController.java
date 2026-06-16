package com.eventos.event.controller;

import com.eventos.event.dto.CreateInvoiceDto;
import com.eventos.event.dto.UpdateInvoiceStatusDto;
import com.eventos.event.entity.Invoice;
import com.eventos.event.service.InvoiceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<?> createInvoice(
            @Valid @RequestBody CreateInvoiceDto dto,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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
    public ResponseEntity<?> getInvoices(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);

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
    public ResponseEntity<?> getInvoiceStats(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Map<String, Object> stats = invoiceService.getInvoiceStats(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getInvoicesByBooking(
            @PathVariable UUID bookingId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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
    public ResponseEntity<?> getInvoiceDetails(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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
    public ResponseEntity<?> updateInvoiceStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInvoiceStatusDto dto,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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
    public ResponseEntity<?> deleteInvoice(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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
    public ResponseEntity<?> sendPaymentReminder(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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
    public ResponseEntity<?> getClientInvoices(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader) {
        if (emailHeader == null || emailHeader.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Email header is required"));
        }
        UUID tenantId = getTenantId(tenantIdHeader);
        List<Invoice> invoices = invoiceService.getInvoicesByClientEmail(emailHeader, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", invoices);

        return ResponseEntity.ok(response);
    }

    // --- Helper Methods ---

    private UUID getTenantId(String header) {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.event.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.event.config.UserPrincipal) auth.getPrincipal()).getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        if (header != null && !header.isEmpty()) {
            return UUID.fromString(header);
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.BAD_REQUEST, "Tenant ID context is missing");
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
