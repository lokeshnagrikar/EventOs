package com.eventos.event.controller;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.AssignTeamMemberDto;
import com.eventos.event.dto.CreateEventDto;
import com.eventos.event.dto.CreateTimelineItemDto;
import com.eventos.event.dto.CreateEventTaskDto;
import com.eventos.event.entity.*;
import com.eventos.event.service.EventService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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
@RequestMapping
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    // ─── Tenant / User helpers (JWT-only, no header fallback) ─────────────────

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

    private UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication context is missing");
    }

    // ─── Event CRUD ────────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')")
    public ResponseEntity<?> getEvents(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "startDate,asc") String sort) {

        UUID tenantId = getTenantId();
        UUID userId = getUserId();

        EventStatus eventStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                eventStatus = EventStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value: " + status);
            }
        }

        EventType eventType = null;
        if (type != null && !type.isEmpty()) {
            try {
                eventType = EventType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid type value: " + type);
            }
        }

        String[] sortParts = sort.split(",");
        Sort.Direction direction = sortParts.length > 1 && "desc".equalsIgnoreCase(sortParts[1])
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sortObj = Sort.by(direction, sortParts[0]);
        PageRequest pageable = PageRequest.of(page, size, sortObj);

        Page<Event> eventsPage = eventService.searchEvents(tenantId, userId, eventStatus, eventType, startDate, endDate, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", eventsPage.getContent());

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", eventsPage.getNumber());
        pagination.put("size", eventsPage.getSize());
        pagination.put("totalElements", eventsPage.getTotalElements());
        pagination.put("totalPages", eventsPage.getTotalPages());
        response.put("pagination", pagination);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> getEventStats() {
        UUID tenantId = getTenantId();
        Map<String, Object> stats = eventService.getEventStats(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')")
    public ResponseEntity<?> getEventById(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        Event event = eventService.getEventById(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", event);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> createEvent(@Valid @RequestBody CreateEventDto dto) {
        UUID tenantId = getTenantId();
        Event event = eventService.createEvent(dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", event);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> updateEvent(@PathVariable UUID id, @Valid @RequestBody CreateEventDto dto) {
        UUID tenantId = getTenantId();
        Event event = eventService.updateEvent(id, dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", event);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        String statusStr = request.get("status");
        if (statusStr == null || statusStr.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status parameter is required");
        }

        EventStatus status;
        try {
            status = EventStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value: " + statusStr);
        }

        UUID tenantId = getTenantId();
        Event event = eventService.updateEventStatus(id, status, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", event);

        return ResponseEntity.ok(response);
    }

    // ─── Timeline Milestones ───────────────────────────────────────────────────

    @GetMapping("/{id}/timeline")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')")
    public ResponseEntity<?> getTimelineItems(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        List<EventTimelineItem> items = eventService.getTimelineItems(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", items);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/timeline")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> addTimelineItem(@PathVariable UUID id, @Valid @RequestBody CreateTimelineItemDto dto) {
        UUID tenantId = getTenantId();
        EventTimelineItem item = eventService.addTimelineItem(id, dto, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", item);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/timeline/{itemId}/toggle")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> toggleTimelineItem(@PathVariable UUID id, @PathVariable UUID itemId) {
        UUID tenantId = getTenantId();
        EventTimelineItem item = eventService.toggleTimelineItemCompletion(id, itemId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", item);

        return ResponseEntity.ok(response);
    }

    // ─── Team Assignments ──────────────────────────────────────────────────────

    @GetMapping("/{id}/assignments")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getAssignments(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        List<EventAssignment> assignments = eventService.getAssignments(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", assignments);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/assignments")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<?> assignTeamMember(@PathVariable UUID id, @Valid @RequestBody AssignTeamMemberDto dto) {
        UUID tenantId = getTenantId();
        String authHeader = getAuthorizationHeader();
        EventAssignment assignment = eventService.assignTeamMember(id, dto, tenantId, authHeader);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", assignment);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/assignments/{assignmentId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<?> removeAssignment(@PathVariable UUID id, @PathVariable UUID assignmentId) {
        UUID tenantId = getTenantId();
        eventService.removeAssignment(id, assignmentId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Team member unassigned successfully");

        return ResponseEntity.ok(response);
    }

    // ─── Tasks ─────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/tasks")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getEventTasks(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        List<EventTask> tasks = eventService.getEventTasks(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", tasks);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/tasks")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> addEventTask(@PathVariable UUID id, @Valid @RequestBody CreateEventTaskDto dto) {
        UUID tenantId = getTenantId();
        String authHeader = getAuthorizationHeader();
        EventTask task = eventService.addEventTask(id, dto, tenantId, authHeader);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", task);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/tasks/{taskId}/toggle")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> toggleEventTask(@PathVariable UUID id, @PathVariable UUID taskId) {
        UUID tenantId = getTenantId();
        UUID userId = getUserId();
        EventTask task = eventService.toggleEventTask(id, taskId, tenantId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", task);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<?> deleteEventTask(@PathVariable UUID id, @PathVariable UUID taskId) {
        UUID tenantId = getTenantId();
        eventService.deleteEventTask(id, taskId, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Task deleted successfully");

        return ResponseEntity.ok(response);
    }

    // ─── Client-facing endpoints ───────────────────────────────────────────────

    @GetMapping("/client")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> getClientEvents() {
        UUID tenantId = getTenantId();
        String email = getCurrentUser().getEmail();
        List<Event> events = eventService.getEventsByClientEmail(email, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", events);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/client/timeline")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> getClientTimeline() {
        UUID tenantId = getTenantId();
        String email = getCurrentUser().getEmail();
        List<EventTimelineItem> items = eventService.getTimelineItemsByClientEmail(email, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", items);

        return ResponseEntity.ok(response);
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private String getAuthorizationHeader() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attr =
                (org.springframework.web.context.request.ServletRequestAttributes)
                    org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attr != null) {
                return attr.getRequest().getHeader("Authorization");
            }
        } catch (Exception ignored) {}
        return null;
    }
}
