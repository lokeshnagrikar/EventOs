package com.eventos.auth.controller;

import com.eventos.auth.entity.Company;
import com.eventos.auth.service.WorkspaceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/settings/workspace")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getWorkspaceSettings() {
        UUID tenantId = getTenantId();
        Company company = workspaceService.getWorkspaceSettings(tenantId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", company);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> updateWorkspaceSettings(
            @RequestBody Company updatedCompany) {
        UUID tenantId = getTenantId();
        Company company = workspaceService.updateWorkspaceSettings(tenantId, updatedCompany);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", company);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/whatsapp")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> getWhatsAppSettings() {
        UUID tenantId = getTenantId();
        Company company = workspaceService.getWorkspaceSettings(tenantId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", company.getWhatsappConfig());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/whatsapp")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> updateWhatsAppSettings(
            @RequestBody Map<String, Object> payload) {
        UUID tenantId = getTenantId();
        Company company = workspaceService.getWorkspaceSettings(tenantId);
        
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String configJson = mapper.writeValueAsString(payload);
            company.setWhatsappConfig(configJson);
            workspaceService.updateWorkspaceSettings(tenantId, company);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize WhatsApp configuration", e);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "WhatsApp configuration saved successfully");
        return ResponseEntity.ok(response);
    }

    private UUID getTenantId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.auth.config.UserPrincipal) auth.getPrincipal()).getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Tenant ID context is missing");
    }
}
