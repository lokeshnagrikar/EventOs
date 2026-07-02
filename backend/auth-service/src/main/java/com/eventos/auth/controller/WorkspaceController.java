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
    public ResponseEntity<?> getWorkspaceSettings(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Company company = workspaceService.getWorkspaceSettings(tenantId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", company);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> updateWorkspaceSettings(
            @RequestBody Company updatedCompany,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Company company = workspaceService.updateWorkspaceSettings(tenantId, updatedCompany);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", company);
        return ResponseEntity.ok(response);
    }

    private UUID getTenantId(String header) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.auth.config.UserPrincipal) auth.getPrincipal()).getTenantId();
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
