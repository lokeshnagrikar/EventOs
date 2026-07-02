package com.eventos.auth.controller;

import com.eventos.auth.entity.AuditLog;
import com.eventos.auth.entity.User2Fa;
import com.eventos.auth.repository.AuditLogRepository;
import com.eventos.auth.repository.User2FaRepository;
import com.eventos.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/settings/security")
public class SecurityController {

    private final User2FaRepository user2FaRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuthService authService;

    public SecurityController(User2FaRepository user2FaRepository,
                              AuditLogRepository auditLogRepository,
                              AuthService authService) {
        this.user2FaRepository = user2FaRepository;
        this.auditLogRepository = auditLogRepository;
        this.authService = authService;
    }

    @GetMapping("/sessions")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getActiveSessions(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        UUID userId = getCurrentUserId();
        
        List<Map<String, Object>> sessions = authService.getActiveSessions(userId, tenantId, null);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", sessions);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> revokeSession(
            @PathVariable UUID sessionId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        authService.revokeSession(sessionId, getCurrentUserId(), getTenantId(tenantIdHeader));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Session revoked successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/2fa")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> get2FAStatus() {
        UUID userId = getCurrentUserId();
        Optional<User2Fa> opt = user2FaRepository.findById(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("enabled", opt.isPresent() && opt.get().isEnabled());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/2fa/setup")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> setup2FA() {
        UUID userId = getCurrentUserId();
        String secret = Base64.getEncoder().encodeToString(UUID.randomUUID().toString().substring(0, 10).getBytes());
        
        User2Fa user2Fa = user2FaRepository.findById(userId).orElse(new User2Fa());
        user2Fa.setUserId(userId);
        user2Fa.setSecret(secret);
        user2Fa.setEnabled(false);
        user2FaRepository.save(user2Fa);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("secret", secret);
        response.put("qrCodeUrl", "otpauth://totp/EventOS?secret=" + secret + "&issuer=EventOS");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/2fa/enable")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> enable2FA(@RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        String code = request.get("code");
        
        User2Fa user2Fa = user2FaRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("2FA not set up yet"));
        
        // Simple mock validation (accept any 6-digit code for this module's scope)
        if (code == null || code.length() != 6) {
            return ResponseEntity.badRequest().body(createErrorResponse("INVALID_CODE", "Invalid verification code"));
        }

        user2Fa.setEnabled(true);
        user2Fa.setBackupCodes(String.join(",", Arrays.asList("123456", "234567", "345678", "456789", "567890")));
        user2FaRepository.save(user2Fa);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("backupCodes", user2Fa.getBackupCodes());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/2fa/disable")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> disable2FA() {
        UUID userId = getCurrentUserId();
        User2Fa user2Fa = user2FaRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("2FA not enabled"));

        user2Fa.setEnabled(false);
        user2FaRepository.save(user2Fa);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "2FA disabled successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/password/change")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Current and new password are required"));
        }

        try {
            Map<String, Object> result = authService.changePassword(userId, currentPassword, newPassword);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse("PASSWORD_CHANGE_FAILED", e.getMessage()));
        }
    }

    @DeleteMapping("/account/delete")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> deleteAccount() {
        UUID userId = getCurrentUserId();
        try {
            authService.deleteAccount(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Account deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("DELETE_ACCOUNT_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> getSecurityLogs(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        List<AuditLog> logs = auditLogRepository.findAllByTenantId(tenantId);
        
        // Filter logs related to security actions
        List<AuditLog> securityLogs = logs.stream()
                .filter(l -> l.getAction().contains("LOGIN") || l.getAction().contains("PASSWORD") || l.getAction().contains("2FA"))
                .sorted(Comparator.comparing(AuditLog::getCreatedAt).reversed())
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", securityLogs);
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

    private UUID getCurrentUserId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal) {
            return ((com.eventos.auth.config.UserPrincipal) auth.getPrincipal()).getUserId();
        }
        return null;
    }

    private Map<String, Object> createErrorResponse(String code, String message) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("code", code);
        errorDetails.put("message", message);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", errorDetails);
        return errorResponse;
    }
}
