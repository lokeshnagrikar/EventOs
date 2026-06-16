package com.eventos.event.controller;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.CreateBudgetEstimateDto;
import com.eventos.event.entity.BudgetEstimate;
import com.eventos.event.entity.PricingRule;
import com.eventos.event.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/calculator")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
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

    // ─── Budget Calculator ─────────────────────────────────────────────────────

    @PostMapping("/calculate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> calculateEstimate(@Valid @RequestBody CreateBudgetEstimateDto dto) {
        // Budget calculator is accessible to any authenticated user (public-facing wizard)
        UUID tenantId;
        try {
            tenantId = getTenantId();
        } catch (Exception e) {
            tenantId = UUID.fromString("00000000-0000-0000-0000-000000000000");
        }
        BudgetEstimate estimate = budgetService.calculateEstimate(dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", estimate);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> getSavedEstimates() {
        UUID tenantId = getTenantId();
        List<BudgetEstimate> estimates = budgetService.getAllEstimates(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", estimates);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> saveEstimate(@Valid @RequestBody CreateBudgetEstimateDto dto) {
        UUID tenantId;
        try {
            tenantId = getTenantId();
        } catch (Exception e) {
            tenantId = UUID.fromString("00000000-0000-0000-0000-000000000000");
        }
        BudgetEstimate saved = budgetService.saveEstimate(dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> deleteEstimate(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        budgetService.deleteEstimate(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Estimate deleted successfully");

        return ResponseEntity.ok(response);
    }

    // ─── CRM Lead & Quote Conversion ───────────────────────────────────────────

    @PostMapping("/{id}/convert-to-lead")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> convertToLead(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        String authHeader = getAuthorizationHeader();
        Map<?, ?> lead = budgetService.convertToLead(id, tenantId, authHeader);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", lead);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/generate-quote")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> generateQuote(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        String authHeader = getAuthorizationHeader();
        Map<?, ?> quote = budgetService.generateQuoteFromEstimate(id, tenantId, authHeader);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", quote);

        return ResponseEntity.ok(response);
    }

    // ─── Pricing Rules ─────────────────────────────────────────────────────────

    @GetMapping("/pricing-rules")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> getPricingRules() {
        UUID tenantId = getTenantId();
        List<PricingRule> rules = budgetService.getPricingRules(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", rules);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/pricing-rules")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<?> savePricingRule(@RequestBody PricingRule rule) {
        UUID tenantId = getTenantId();
        PricingRule saved = budgetService.savePricingRule(rule, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/pricing-rules/{ruleId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<?> deletePricingRule(@PathVariable UUID ruleId) {
        UUID tenantId = getTenantId();
        budgetService.deletePricingRule(ruleId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Pricing rule deleted successfully");

        return ResponseEntity.ok(response);
    }
}
