package com.eventos.event.controller;

import com.eventos.event.entity.Integration;
import com.eventos.event.repository.IntegrationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/settings/notifications")
public class NotificationPreferenceController {

    private final IntegrationRepository integrationRepository;

    public NotificationPreferenceController(IntegrationRepository integrationRepository) {
        this.integrationRepository = integrationRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getPreferences(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        
        Integration integration = integrationRepository.findByTenantIdAndProviderName(tenantId, "NOTIFICATION_PREFERENCES")
                .orElseGet(() -> {
                    Integration defaultPrefs = Integration.builder()
                            .tenantId(tenantId)
                            .providerName("NOTIFICATION_PREFERENCES")
                            .credentialsJson("{\"email\":true,\"sms\":false,\"whatsapp\":false,\"push\":true,\"desktop\":true,\"alerts\":true,\"marketing\":false,\"quietHours\":\"22:00-08:00\"}")
                            .status("CONNECTED")
                            .build();
                    return integrationRepository.save(defaultPrefs);
                });

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", integration.getCredentialsJson());
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    @Transactional
    public ResponseEntity<?> updatePreferences(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        
        Integration integration = integrationRepository.findByTenantIdAndProviderName(tenantId, "NOTIFICATION_PREFERENCES")
                .orElseGet(() -> Integration.builder()
                        .tenantId(tenantId)
                        .providerName("NOTIFICATION_PREFERENCES")
                        .status("CONNECTED")
                        .build());

        String json = request.getOrDefault("preferencesJson", "{}").toString();
        integration.setCredentialsJson(json);
        Integration saved = integrationRepository.save(integration);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved.getCredentialsJson());
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
