package com.eventos.event.controller;

import com.eventos.event.entity.Integration;
import com.eventos.event.service.IntegrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/settings/integrations")
public class IntegrationController {

    private final IntegrationService integrationService;

    public IntegrationController(IntegrationService integrationService) {
        this.integrationService = integrationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> getIntegrations(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        List<Integration> integrations = integrationService.getIntegrations(tenantId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", integrations);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{provider}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> connectIntegration(
            @PathVariable String provider,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        String credentialsJson = request.getOrDefault("credentialsJson", "{}");
        Integration integration = integrationService.connectIntegration(tenantId, provider, credentialsJson);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", integration);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{provider}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> disconnectIntegration(
            @PathVariable String provider,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Integration integration = integrationService.disconnectIntegration(tenantId, provider);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", integration);
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
