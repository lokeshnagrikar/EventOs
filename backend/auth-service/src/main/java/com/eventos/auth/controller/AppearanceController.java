package com.eventos.auth.controller;

import com.eventos.auth.entity.Company;
import com.eventos.auth.service.BrandingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/settings/appearance")
public class AppearanceController {

    private final BrandingService brandingService;

    public AppearanceController(BrandingService brandingService) {
        this.brandingService = brandingService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getAppearance(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Company company = brandingService.getBrandingSettings(tenantId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("theme", "dark"); // Default
        data.put("primaryColor", company.getPrimaryColor());
        data.put("secondaryColor", company.getSecondaryColor());
        data.put("accentColor", company.getAccentColor());
        data.put("gradientPresets", company.getGradientPresets());
        data.put("fontSelection", company.getFontSelection());
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> updateAppearance(
            @RequestBody Company appearanceDetails,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Company company = brandingService.updateBrandingSettings(tenantId, appearanceDetails);
        
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
