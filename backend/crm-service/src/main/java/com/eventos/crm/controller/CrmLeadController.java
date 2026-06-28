package com.eventos.crm.controller;

import com.eventos.crm.dto.CreateLeadDto;
import com.eventos.crm.entity.Lead;
import com.eventos.crm.entity.Activity;
import com.eventos.crm.entity.LeadStatus;
import com.eventos.crm.service.LeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@Tag(name = "CRM — Leads", description = "Manage sales leads: create, track status, log activities, and convert to bookings")
@RestController
@RequestMapping("/leads")
public class CrmLeadController {

    private final LeadService leadService;

    public CrmLeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @Operation(summary = "List leads", description = "Returns paginated leads for the workspace. Filter by status (NEW, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST), source (REFERRAL, WEBSITE, SOCIAL_MEDIA, WALK_IN, OTHER), budget range, or search by client name/email.")
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

    @Operation(summary = "Lead pipeline stats", description = "Returns counts and values grouped by status (total, WON, LOST, PROPOSAL, etc.) for the KPI dashboard.")
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

    @Operation(summary = "Get lead by ID", description = "Returns full details of a single lead including all fields. Pass the lead UUID in the path.")
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

    @Operation(summary = "Get lead activity log", description = "Returns the chronological history of all activities (calls, emails, meetings, notes) logged against this lead.")
    @GetMapping("/{id}/activities")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getLeadActivities(@PathVariable UUID id) {
        try {
            UUID tenantId = getTenantId();
            List<Activity> activities = leadService.getLeadActivities(id, tenantId);
            
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

    @Operation(summary = "Create lead", description = "Creates a new sales lead. All required fields are documented in the CreateLeadDto schema below. eventType values: WEDDING, BIRTHDAY, CORPORATE, ANNIVERSARY, GRADUATION, SOCIAL, OTHER. source values: REFERRAL, WEBSITE, SOCIAL_MEDIA, WALK_IN, OTHER.")
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

    @Operation(summary = "Update lead status", description = "Moves the lead through the sales pipeline. Valid status values: NEW, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
        required = true,
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(type = "object"),
            examples = {
                @ExampleObject(name = "Move to Qualified",  value = "{\"status\": \"QUALIFIED\"}"),
                @ExampleObject(name = "Move to Proposal Sent", value = "{\"status\": \"PROPOSAL_SENT\"}"),
                @ExampleObject(name = "Mark as Won",        value = "{\"status\": \"WON\"}"),
                @ExampleObject(name = "Mark as Lost",       value = "{\"status\": \"LOST\"}")
            }
        )
    )
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

    @Operation(summary = "Log an activity on a lead", description = "Records a follow-up action. type values: CALL, EMAIL, MEETING, NOTE, WHATSAPP. description is a free-text note about what happened.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
        required = true,
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(type = "object"),
            examples = {
                @ExampleObject(name = "Log a call",    value = "{\"type\": \"CALL\",    \"description\": \"Spoke with client, confirmed budget ₹5L and venue preference for Dec 2026.\"}"),
                @ExampleObject(name = "Log an email",  value = "{\"type\": \"EMAIL\",   \"description\": \"Sent proposal PDF to priya.sharma@gmail.com\"}"),
                @ExampleObject(name = "Log a meeting", value = "{\"type\": \"MEETING\", \"description\": \"Site visit to Leela Palace. Client loved the banquet hall.\"}"),
                @ExampleObject(name = "Add a note",    value = "{\"type\": \"NOTE\",    \"description\": \"Client wants DJ setup and live ghazal singer for reception.\"}")  
            }
        )
    )
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
            
            Activity activity = leadService.addActivity(id, type, desc, tenantId, userId);
            
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

    @Operation(summary = "Update lead details", description = "Replaces all editable fields of the lead. Use the same body structure as Create Lead.")
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

    @Operation(summary = "Partially update lead details", description = "Updates selected fields of a lead. status values: NEW, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST")
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> patchLead(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> updates) {
        
        UUID tenantId = getTenantId();
        UUID userId = getUserId();

        try {
            // First, load the lead to verify existence and access control
            Lead lead = leadService.getLeadById(id, tenantId);

            // Construct a CreateLeadDto from the existing lead and apply patches
            CreateLeadDto dto = CreateLeadDto.builder()
                    .name(updates.containsKey("name") ? (String) updates.get("name") : lead.getName())
                    .contactId(lead.getContact() != null ? lead.getContact().getId() : null)
                    .eventType(updates.containsKey("eventType") ? (String) updates.get("eventType") : lead.getEventType())
                    .eventDate(updates.containsKey("eventDate") ? 
                            (updates.get("eventDate") != null ? java.time.LocalDate.parse((String) updates.get("eventDate")) : null) 
                            : lead.getEventDate())
                    .budget(updates.containsKey("budget") ? 
                            (updates.get("budget") != null ? new java.math.BigDecimal(updates.get("budget").toString()) : null) 
                            : lead.getBudget())
                    .leadSource(updates.containsKey("leadSource") ? (String) updates.get("leadSource") : lead.getLeadSource())
                    .notes(updates.containsKey("notes") ? (String) updates.get("notes") : lead.getNotes())
                    .assignedUserId(updates.containsKey("assignedUserId") ? 
                            (updates.get("assignedUserId") != null ? UUID.fromString((String) updates.get("assignedUserId")) : null) 
                            : lead.getAssignedUserId())
                    .build();

            // Perform standard field updates via leadService
            Lead updated = leadService.updateLead(id, dto, tenantId, userId);

            // Handle status change explicitly if requested so it goes through lifecycle events
            if (updates.containsKey("status") && updates.get("status") != null) {
                String statusStr = (String) updates.get("status");
                LeadStatus newStatus = LeadStatus.valueOf(statusStr.toUpperCase());
                updated = leadService.updateLeadStatus(id, newStatus, tenantId, userId);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", updated);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("BAD_REQUEST", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("ACCESS_DENIED", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("UPDATE_FAILED", e.getMessage()));
        }
    }

    @Operation(summary = "Delete lead", description = "Soft-deletes the lead. The record is not removed from the database but is hidden from all list views. Only OWNER and ADMIN roles can delete.")
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

    @Operation(summary = "Convert lead", description = "Converts the lead by promoting its status to WON. This represents a successful sales conversion.")
    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> convertLead(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        UUID userId = getUserId();
        try {
            Lead lead = leadService.convertLead(id, tenantId, userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", lead);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("BAD_REQUEST", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("ACCESS_DENIED", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("CONVERSION_FAILED", e.getMessage()));
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
