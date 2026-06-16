package com.eventos.crm.controller;

import com.eventos.crm.dto.CreateLeadDto;
import com.eventos.crm.entity.Lead;
import com.eventos.crm.entity.LeadActivity;
import com.eventos.crm.entity.LeadStatus;
import com.eventos.crm.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/leads")
public class CrmLeadController {

    private final LeadService leadService;

    public CrmLeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getLeads(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(required = false) UUID assignedUserId,
            @RequestParam(required = false) BigDecimal minBudget,
            @RequestParam(required = false) BigDecimal maxBudget) {
        
        UUID tenantId = getTenantId();
        
        org.springframework.data.domain.Sort sortOrder = org.springframework.data.domain.Sort.unsorted();
        if (sort != null && !sort.isEmpty()) {
            String[] parts = sort.split(",");
            String property = parts[0];
            org.springframework.data.domain.Sort.Direction direction = org.springframework.data.domain.Sort.Direction.ASC;
            if (parts.length > 1 && "desc".equalsIgnoreCase(parts[1])) {
                direction = org.springframework.data.domain.Sort.Direction.DESC;
            }
            sortOrder = org.springframework.data.domain.Sort.by(direction, property);
        } else {
            sortOrder = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt");
        }
        
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sortOrder);
        
        org.springframework.data.domain.Page<Lead> leadsPage = leadService.searchLeads(
                tenantId, query, source, status, assignedUserId, minBudget, maxBudget, pageable);
                
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", leadsPage.getContent());
        
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", leadsPage.getNumber());
        pagination.put("size", leadsPage.getSize());
        pagination.put("totalElements", leadsPage.getTotalElements());
        pagination.put("totalPages", leadsPage.getTotalPages());
        response.put("pagination", pagination);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getLeadStats() {
        UUID tenantId = getTenantId();
        Map<String, Object> stats = leadService.getLeadStats(tenantId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getLeadById(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            Lead lead = leadService.getLeadById(id, tenantId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", lead);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("ACCESS_DENIED", e.getMessage()));
        }
    }

    @GetMapping("/{id}/activities")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getLeadActivities(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            List<LeadActivity> activities = leadService.getLeadActivities(id, tenantId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", activities);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("ACCESS_DENIED", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> createLead(@Valid @RequestBody CreateLeadDto dto) {
        UUID tenantId = getTenantId();
        UUID userId = getUserId();
        UUID companyId = tenantId; 

        try {
            Lead lead = leadService.createLead(dto, tenantId, companyId, userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", lead);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("BAD_REQUEST", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("ACCESS_DENIED", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("CREATE_FAILED", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        
        String statusStr = request.get("status");
        if (statusStr == null || statusStr.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Status parameter is required"));
        }

        try {
            LeadStatus status = LeadStatus.valueOf(statusStr.toUpperCase());
            UUID tenantId = getTenantId();
            UUID userId = getUserId();
            
            Lead lead = leadService.updateLeadStatus(id, status, tenantId, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", lead);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("INVALID_STATUS", "Provided status value is invalid: " + statusStr));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("ACCESS_DENIED", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("UPDATE_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/{id}/activities")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> addActivity(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        
        String type = request.get("type");
        String desc = request.get("description");

        if (type == null || type.isEmpty() || desc == null || desc.isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("BAD_REQUEST", "Activity type and description are required"));
        }

        try {
            UUID tenantId = getTenantId();
            UUID userId = getUserId();
            
            LeadActivity activity = leadService.addActivity(id, type, desc, tenantId, userId);
            
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
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> updateLead(
            @PathVariable UUID id,
            @Valid @RequestBody CreateLeadDto dto) {
        
        UUID tenantId = getTenantId();
        UUID userId = getUserId();

        try {
            Lead lead = leadService.updateLead(id, dto, tenantId, userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", lead);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("ACCESS_DENIED", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("UPDATE_FAILED", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> deleteLead(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        UUID userId = getUserId();

        try {
            leadService.deleteLead(id, tenantId, userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Lead successfully deleted");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("ACCESS_DENIED", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("DELETE_FAILED", e.getMessage()));
        }
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

    private UUID getUserId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.crm.config.UserPrincipal) {
            return ((com.eventos.crm.config.UserPrincipal) auth.getPrincipal()).getUserId();
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.UNAUTHORIZED, "User context is missing or invalid");
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
