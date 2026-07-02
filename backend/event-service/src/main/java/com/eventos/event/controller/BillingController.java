package com.eventos.event.controller;

import com.eventos.event.entity.BillingProfile;
import com.eventos.event.service.BillingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/settings/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> getBillingInfo(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        BillingProfile profile = billingService.getBillingProfile(tenantId);
        Map<String, Object> usage = billingService.getUsageStats(tenantId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("profile", profile);
        data.put("usage", usage);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updateBillingInfo(
            @RequestBody BillingProfile details,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        BillingProfile updated = billingService.updateBillingProfile(tenantId, details);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    private UUID getTenantId(String header) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
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
}
