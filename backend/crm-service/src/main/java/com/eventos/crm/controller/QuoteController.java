package com.eventos.crm.controller;

import com.eventos.crm.config.UserPrincipal;
import com.eventos.crm.dto.CreateQuoteDto;
import com.eventos.crm.entity.Quote;
import com.eventos.crm.entity.QuoteStatus;
import com.eventos.crm.service.QuoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "CRM — Quotes", description = "Create and manage price proposals. Send to clients, track approvals, and convert to bookings.")
@RestController
@RequestMapping("/quotes")
public class QuoteController {

    private final QuoteService quoteService;

    public QuoteController(QuoteService quoteService) {
        this.quoteService = quoteService;
    }

    // ─── Security context extraction (JWT only, no headers) ───────────────────

    private UUID getTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            UUID tenantId = principal.getTenantId();
            if (tenantId != null)
                return tenantId;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context is missing");
    }

    private UUID getUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            UUID userId = principal.getUserId();
            if (userId != null)
                return userId;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User context is missing");
    }

    private UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication context is missing");
    }

    // ─── Quote Controller Endpoints ───────────────────────────────────────────

    @Operation(summary = "List all quotes", description = "Returns quotes for this workspace. Pass ?page=0&size=20 for pagination, or omit for all quotes.")
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getQuotes(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        UUID tenantId = getTenantId();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);

        if (page != null && size != null) {
            org.springframework.data.domain.Page<Quote> quotesPage = quoteService.getAllQuotes(
                    tenantId, org.springframework.data.domain.PageRequest.of(page, size));
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

    @Operation(summary = "Get quote by ID", description = "Returns a single quote with all line items, totals, and current status.")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')")
    public ResponseEntity<?> getQuoteById(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        Quote quote = quoteService.getQuoteById(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quote);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get quotes for a lead", description = "Returns all versions/revisions of quotes linked to a specific lead UUID.")
    @GetMapping("/lead/{leadId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getQuotesByLeadId(@PathVariable UUID leadId) {
        UUID tenantId = getTenantId();
        List<Quote> quotes = quoteService.getQuotesByLeadId(leadId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quotes);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Create a quote", description = "Creates a pricing proposal for a lead. Line items can include any services. Tax and discounts are applied to the subtotal. See CreateQuoteDto schema for all fields.")
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> createQuote(@Valid @RequestBody CreateQuoteDto dto) {
        UUID tenantId = getTenantId();
        Quote quote = quoteService.createQuote(dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quote);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Update quote", description = "Replaces the quote contents. Can only update quotes in DRAFT status. Use the same body as Create Quote.")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> updateQuote(
            @PathVariable UUID id,
            @Valid @RequestBody CreateQuoteDto dto) {
        UUID tenantId = getTenantId();
        Quote quote = quoteService.updateQuote(id, dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quote);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Create a revision", description = "Duplicates the current quote as a new revision with incremented version number. The original remains unchanged.")
    @PostMapping("/{id}/revision")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> createRevision(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        Quote revision = quoteService.createRevision(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", revision);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Update quote status", description = "Moves the quote through its lifecycle. Valid status values: DRAFT → SENT → VIEWED → ACCEPTED / REJECTED. Only OWNER/ADMIN/MANAGER can change status.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(mediaType = "application/json", schema = @Schema(type = "object"), examples = {
            @ExampleObject(name = "Send to client", value = "{\"status\": \"SENT\"}"),
            @ExampleObject(name = "Mark as Viewed", value = "{\"status\": \"VIEWED\"}"),
            @ExampleObject(name = "Mark as Accepted", value = "{\"status\": \"ACCEPTED\"}"),
            @ExampleObject(name = "Mark as Rejected", value = "{\"status\": \"REJECTED\"}")
    }))
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        String statusStr = request.get("status");
        if (statusStr == null || statusStr.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status parameter is required");
        }

        QuoteStatus status;
        try {
            status = QuoteStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value: " + statusStr);
        }

        UUID tenantId = getTenantId();
        Quote quote = quoteService.updateQuoteStatus(id, status, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quote);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Approve quote (client action)", description = "Client approves the quote. Sets status to ACCEPTED and triggers booking-ready notification. Accessible by CLIENT role.")
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('CLIENT', 'OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> approveQuote(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        UUID userId = getUserId();

        Quote quote = quoteService.approveQuote(id, tenantId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quote);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Reject quote (client action)", description = "Client rejects the quote. Sets status to REJECTED. A new revision can be created if negotiations continue.")
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('CLIENT', 'OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> rejectQuote(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        Quote quote = quoteService.rejectQuote(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quote);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Send quote to client (explicit PUT)", description = "Marks the quote status as SENT.")
    @PutMapping("/{id}/send")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> sendQuoteExplicit(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        Quote quote = quoteService.updateQuoteStatus(id, QuoteStatus.SENT, tenantId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quote);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Accept quote (explicit PUT)", description = "Marks status as ACCEPTED, publishes QuoteAcceptedEvent, and promotes lead status to WON.")
    @PutMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('CLIENT', 'OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> acceptQuoteExplicit(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        UUID userId = getUserId();
        Quote quote = quoteService.approveQuote(id, tenantId, userId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quote);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Reject quote (explicit PUT)", description = "Marks status as REJECTED.")
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('CLIENT', 'OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> rejectQuoteExplicit(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        Quote quote = quoteService.rejectQuote(id, tenantId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quote);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Client — My quotes", description = "Returns all quotes addressed to the currently authenticated client (matched by email).")
    @GetMapping("/client")
    @PreAuthorize("hasAnyRole('CLIENT', 'OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> getClientQuotes() {
        UUID tenantId = getTenantId();
        UserPrincipal user = getCurrentUser();
        List<Quote> quotes = new ArrayList<>();
        if (user != null && user.getEmail() != null) {
            quotes = quoteService.getQuotesByClientEmail(user.getEmail(), tenantId);
            if (quotes.isEmpty() && (user.getRoles() == null || !user.getRoles().contains("CLIENT"))) {
                quotes = quoteService.getAllQuotes(tenantId);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quotes);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Record quote view", description = "Marks the quote as viewed. Call this when a client opens the quote link. Sets status to VIEWED if currently SENT.")
    @PostMapping("/{id}/view")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','CLIENT')")
    public ResponseEntity<?> markAsViewed(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        Quote quote = quoteService.markAsViewed(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quote);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Regenerate quote PDF", description = "Re-generates the PDF for this quote (e.g. after a status change or content update). The PDF URL is updated once generation completes.")
    @PostMapping("/{id}/regenerate-pdf")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> regeneratePdf(@PathVariable UUID id) throws Exception {
        UUID tenantId = getTenantId();
        Quote quote = quoteService.getQuoteById(id, tenantId);
        quote.setPdfUrl(null); // Clear URL to trigger new write
        quoteService.generateAndUploadPdfInBackground(quote.getId(), tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quote);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Download quote PDF directly", description = "Generates and streams the quote proposal PDF directly.")
    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')")
    public ResponseEntity<byte[]> getQuotePdf(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        Quote quote = quoteService.getQuoteById(id, tenantId);
        byte[] pdfBytes = quoteService.generatePdfBytes(id, tenantId);
        String filename = "quote-" + quote.getQuoteNumber() + ".pdf";

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    // ─── Public Endpoints (Client Proposal Portal — Whitelisted in API Gateway) ───

    @Operation(summary = "Public — Get quote details", description = "Allows clients to view a proposal via public share token or ID without logging in.")
    @GetMapping("/public/{token}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> getPublicQuote(@PathVariable String token) {
        try {
            com.eventos.crm.dto.PublicQuoteResponseDto dto = quoteService.getPublicQuote(token);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", dto);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", Map.of("code", "NOT_FOUND", "message", e.getMessage())));
        }
    }

    @Operation(summary = "Public — Approve quote", description = "Allows clients to digitally approve and sign a proposal without logging in. Promotes lead to WON and triggers booking creation.")
    @PostMapping("/public/{token}/approve")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> approvePublicQuote(
            @PathVariable String token,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String signerName = body != null && body.containsKey("signerName") ? body.get("signerName") : "Client";
            String signerTitle = body != null && body.containsKey("signerTitle") ? body.get("signerTitle") : "Sponsor";
            com.eventos.crm.dto.PublicQuoteResponseDto dto = quoteService.approvePublicQuote(token, signerName, signerTitle);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", dto);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", Map.of("code", "NOT_FOUND", "message", e.getMessage())));
        }
    }

    @Operation(summary = "Public — Reject quote", description = "Allows clients to reject a proposal with feedback notes without logging in.")
    @PostMapping("/public/{token}/reject")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> rejectPublicQuote(
            @PathVariable String token,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String rejectionNotes = body != null && body.containsKey("rejectionNotes") ? body.get("rejectionNotes") : "";
            com.eventos.crm.dto.PublicQuoteResponseDto dto = quoteService.rejectPublicQuote(token, rejectionNotes);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", dto);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "error", Map.of("code", "NOT_FOUND", "message", e.getMessage())));
        }
    }
}
