package com.eventos.crm.controller;

import com.eventos.crm.dto.DashboardMetricsDto;
import com.eventos.crm.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<?> getMetrics() {
        UUID tenantId = getTenantId();
        String roles = getRoles();

        DashboardMetricsDto metrics = dashboardService.getMetricsForTenant(tenantId, roles);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", metrics);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/metrics/cache")
    public ResponseEntity<?> invalidateMetrics() {
        UUID tenantId = getTenantId();

        dashboardService.invalidateCache(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Dashboard metrics cache invalidated successfully");

        return ResponseEntity.ok(response);
    }

    private UUID getTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.crm.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.crm.config.UserPrincipal) auth.getPrincipal()).getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.UNAUTHORIZED, "Tenant context is missing or invalid");
    }

    private String getRoles() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.crm.config.UserPrincipal) {
            String roles = ((com.eventos.crm.config.UserPrincipal) auth.getPrincipal()).getRoles();
            if (roles != null && !roles.isEmpty()) {
                return roles;
            }
        }
        return "STAFF";
    }
}
