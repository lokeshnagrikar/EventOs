package com.eventos.crm.controller;

import com.eventos.crm.dto.CreateQuoteDto;
import com.eventos.crm.entity.Quote;
import com.eventos.crm.entity.QuoteStatus;
import com.eventos.crm.service.QuoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/quotes")
public class QuoteController {

    private final QuoteService quoteService;

    public QuoteController(QuoteService quoteService) {
        this.quoteService = quoteService;
    }

    @GetMapping
    public ResponseEntity<?> getQuotes(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);

        if (page != null && size != null) {
            org.springframework.data.domain.Page<Quote> quotesPage = quoteService.getAllQuotes(tenantId, org.springframework.data.domain.PageRequest.of(page, size));
            response.put("data", quotesPage.getContent());

            Map<String, Object> pagination = new HashMap<>();
            pagination.put("page", quotesPage.getNumber());
            pagination.put("size", quotesPage.getSize());
            pagination.put("totalElements", quotesPage.getTotalElements());
            pagination.put("totalPages", quotesPage.getTotalPages());
            response.put("pagination", pagination);
        } else {
            List<Quote> quotes = quoteService.getAllQuotes(tenantId);
            response.put("data", quotes);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getQuoteById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
            Quote quote = quoteService.getQuoteById(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", quote);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<?> getQuotesByLeadId(
            @PathVariable UUID leadId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
            List<Quote> quotes = quoteService.getQuotesByLeadId(leadId, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", quotes);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createQuote(
            @Valid @RequestBody CreateQuoteDto dto,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
            Quote quote = quoteService.createQuote(dto, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", quote);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("BAD_REQUEST", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("CREATE_FAILED", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        String statusStr = request.get("status");
        if (statusStr == null || statusStr.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Status parameter is required"));
        }

        try {
            QuoteStatus status = QuoteStatus.valueOf(statusStr.toUpperCase());
            UUID tenantId = getTenantId(tenantIdHeader);

            Quote quote = quoteService.updateQuoteStatus(id, status, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", quote);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("INVALID_STATUS", "Provided status value is invalid: " + statusStr));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("UPDATE_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveQuote(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-ID", required = false) String userIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
            UUID userId = getUserId(userIdHeader);

            Quote quote = quoteService.approveQuote(id, tenantId, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", quote);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("APPROVAL_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectQuote(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
            Quote quote = quoteService.rejectQuote(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", quote);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("REJECTION_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/client")
    public ResponseEntity<?> getClientQuotes(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader) {
        if (emailHeader == null || emailHeader.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Email header is required"));
        }
        UUID tenantId = getTenantId(tenantIdHeader);
        List<Quote> quotes = quoteService.getQuotesByClientEmail(emailHeader, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quotes);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<?> markAsViewed(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
            Quote quote = quoteService.markAsViewed(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", quote);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("VIEW_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/{id}/regenerate-pdf")
    public ResponseEntity<?> regeneratePdf(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
            Quote quote = quoteService.getQuoteById(id, tenantId);
            quote = quoteService.regenerateAndUploadPdf(quote);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", quote);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("REGENERATION_FAILED", e.getMessage()));
        }
    }

    // --- Helper Methods ---

    private UUID getTenantId(String header) {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.crm.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.crm.config.UserPrincipal) auth.getPrincipal()).getTenantId();
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

    private UUID getUserId(String header) {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.crm.config.UserPrincipal) {
            return ((com.eventos.crm.config.UserPrincipal) auth.getPrincipal()).getUserId();
        }
        if (header != null && !header.isEmpty()) {
            return UUID.fromString(header);
        }
        // Dev Sandbox Fallback
        return UUID.fromString("11111111-1111-1111-1111-111111111111");
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
