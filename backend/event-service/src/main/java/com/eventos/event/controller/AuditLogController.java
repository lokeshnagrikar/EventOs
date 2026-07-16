package com.eventos.event.controller;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.entity.AuditLog;
import com.eventos.event.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    private UUID getTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            UUID tenantId = principal.getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context is missing");
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID performedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false, defaultValue = "ALL") String module,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID tenantId = getTenantId();
        Page<AuditLog> result = auditLogService.getFilteredAuditLogs(tenantId, search, performedBy, startDate, endDate, module, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", result.getContent());
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("currentPage", result.getNumber());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/retention")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<?> enforceRetention(@RequestBody Map<String, Integer> payload) {
        UUID tenantId = getTenantId();
        Integer days = payload.get("retentionDays");
        if (days == null || days <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Valid retentionDays parameter is required"));
        }

        auditLogService.deleteAuditLogsOlderThan(days, tenantId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Retention policy applied. Purged logs older than " + days + " days."));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<?> exportAuditLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID performedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false, defaultValue = "ALL") String module,
            @RequestParam(defaultValue = "csv") String format) {

        UUID tenantId = getTenantId();
        List<AuditLog> logs = auditLogService.getAllFilteredAuditLogsList(tenantId, search, performedBy, startDate, endDate, module);

        if ("json".equalsIgnoreCase(format)) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit-logs.json\"")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(logs);
        } else {
            String csv = auditLogService.exportToCsv(logs);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit-logs.csv\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csv);
        }
    }
}
