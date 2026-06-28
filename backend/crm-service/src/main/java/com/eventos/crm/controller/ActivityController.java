package com.eventos.crm.controller;

import com.eventos.crm.config.UserPrincipal;
import com.eventos.crm.entity.Activity;
import com.eventos.crm.service.LeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Tag(name = "CRM — Activities", description = "Create and view contact/lead touchpoint activities")
@RestController
@RequestMapping("/activities")
public class ActivityController {

    private final LeadService leadService;

    public ActivityController(LeadService leadService) {
        this.leadService = leadService;
    }

    @Operation(summary = "Log an activity globally", description = "Records a follow-up action on a lead. Needs leadId in the body.")
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> logActivity(@RequestBody Map<String, String> request) {
        String leadIdStr = request.get("leadId");
        String type = request.get("type");
        String desc = request.get("description");

        if (leadIdStr == null || leadIdStr.isEmpty() || type == null || type.isEmpty() || desc == null || desc.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "leadId, type, and description are required"));
        }

        try {
            UUID leadId = UUID.fromString(leadIdStr);
            UUID tenantId = getTenantId();
            UUID userId = getUserId();

            Activity activity = leadService.addActivity(leadId, type, desc, tenantId, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", activity);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("ACCESS_DENIED", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("LOG_FAILED", e.getMessage()));
        }
    }

    private UUID getTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            UUID tenantId = principal.getTenantId();
            if (tenantId != null) return tenantId;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context is missing");
    }

    private UUID getUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            UUID userId = principal.getUserId();
            if (userId != null) return userId;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User context is missing");
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
