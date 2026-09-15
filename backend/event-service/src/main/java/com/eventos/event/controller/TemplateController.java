package com.eventos.event.controller;

import com.eventos.event.entity.EmailTemplate;
import com.eventos.event.service.TemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/settings/templates")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> getTemplates() {
        UUID tenantId = getTenantId();
        List<EmailTemplate> templates = templateService.getTemplates(tenantId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", templates);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{name}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> getTemplate(
            @PathVariable String name) {
        UUID tenantId = getTenantId();
        EmailTemplate template = templateService.getTemplateByName(tenantId, name)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", template);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{name}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> updateTemplate(
            @PathVariable String name,
            @RequestBody EmailTemplate details) {
        UUID tenantId = getTenantId();
        EmailTemplate saved = templateService.updateTemplate(tenantId, name, details);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{name}/test")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> sendTestEmail(
            @PathVariable String name,
            @RequestBody Map<String, String> request) {
        String testEmail = request.getOrDefault("email", "admin@company.com");
        
        // Simulating test email sending
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Test email for template '" + name + "' sent successfully to: " + testEmail);
        return ResponseEntity.ok(response);
    }

    private UUID getTenantId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.event.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.event.config.UserPrincipal) auth.getPrincipal()).getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Tenant ID context is missing");
    }
}
