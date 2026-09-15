package com.eventos.auth.controller;

import com.eventos.auth.entity.ApiKey;
import com.eventos.auth.repository.ApiKeyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/settings/apikeys")
public class ApiKeyController {

    private final ApiKeyRepository apiKeyRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public ApiKeyController(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> getApiKeys() {
        UUID tenantId = getTenantId();
        List<ApiKey> keys = apiKeyRepository.findAllByTenantId(tenantId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", keys);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> generateApiKey(
            @RequestBody Map<String, String> request) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal principal && principal.isImpersonated()) {
            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("code", "FORBIDDEN");
            errorDetails.put("message", "API key generation is prohibited during impersonated sessions");
            Map<String, Object> errResponse = new HashMap<>();
            errResponse.put("success", false);
            errResponse.put("error", errorDetails);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errResponse);
        }

        UUID tenantId = getTenantId();
        String name = request.getOrDefault("name", "Default API Key");
        String scopes = request.getOrDefault("scopes", "crm:read,events:read");

        String prefix = "ev_" + generateRandomString(8);
        String secret = generateRandomString(32);
        String fullKey = prefix + "." + secret;
        
        // Simulating hash encoding using Base64
        String hash = Base64.getEncoder().encodeToString(fullKey.getBytes());

        ApiKey apiKey = ApiKey.builder()
                .tenantId(tenantId)
                .name(name)
                .prefix(prefix)
                .keyHash(hash)
                .scopes(scopes)
                .expiresAt(LocalDateTime.now().plusYears(1))
                .isRevoked(false)
                .build();
        
        ApiKey saved = apiKeyRepository.save(apiKey);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        response.put("rawKey", fullKey); // Return raw key once
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> revokeApiKey(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        ApiKey key = apiKeyRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "API Key not found"));
        
        key.setRevoked(true);
        apiKeyRepository.save(key);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "API Key revoked successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/rotate")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> rotateApiKey(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        ApiKey key = apiKeyRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.NOT_FOUND, "API Key not found"));

        String secret = generateRandomString(32);
        String fullKey = key.getPrefix() + "." + secret;
        String hash = Base64.getEncoder().encodeToString(fullKey.getBytes());

        key.setKeyHash(hash);
        key.setExpiresAt(LocalDateTime.now().plusYears(1));
        key.setRevoked(false);
        ApiKey saved = apiKeyRepository.save(key);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        response.put("rawKey", fullKey);
        return ResponseEntity.ok(response);
    }

    private String generateRandomString(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(secureRandom.nextInt(chars.length())));
        }
        return sb.toString();
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
