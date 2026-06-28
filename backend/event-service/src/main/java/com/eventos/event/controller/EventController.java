package com.eventos.event.controller;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.AssignTeamMemberDto;
import com.eventos.event.dto.CreateEventDto;
import com.eventos.event.dto.PatchEventDto;
import com.eventos.event.dto.CreateTimelineItemDto;
import com.eventos.event.dto.CreateTimelineTaskDto;
import com.eventos.event.entity.*;
import com.eventos.event.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@Tag(name = "Events", description = "Manage events: create, update status, run-of-show timeline, team assignments, and checklist tasks")
@RestController
@RequestMapping({"/events", ""})
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
            if (tenantId != null)
                return tenantId;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context is missing");
    }

    private UUID getUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            UUID userId = principal.getUserId();
            if (userId != null)
                return userId;
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

    @Operation(summary = "List events", description = "Returns paginated events. Filter by status (PLANNING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED), type (WEDDING, BIRTHDAY, CORPORATE, ANNIVERSARY, GRADUATION, SOCIAL, OTHER), or date range.")
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
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        Sort sortObj = Sort.by(direction, sortParts[0]);
        PageRequest pageable = PageRequest.of(page, size, sortObj);

        Page<Event> eventsPage = eventService.searchEvents(tenantId, userId, eventStatus, eventType, startDate, endDate,
                pageable);

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

    @Operation(summary = "Event statistics", description = "Returns aggregate stats: total events, events by status, upcoming events count, and revenue overview.")
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

    @Operation(summary = "Get event by ID", description = "Returns full event details including all timeline items, assignments, and tasks.")
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

    @Operation(summary = "Create event", description = "Creates a new event. eventType: WEDDING, BIRTHDAY, CORPORATE, ANNIVERSARY, GRADUATION, SOCIAL, OTHER. Dates must be in ISO-8601 format: 2026-12-20T18:00:00")
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

    @Operation(summary = "Update event", description = "Replaces all editable event fields. Use the same body structure as Create Event.")
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

    @Operation(summary = "Update event status", description = "Moves the event through its lifecycle. Valid values: PLANNING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(mediaType = "application/json", schema = @Schema(type = "object"), examples = {
            @ExampleObject(name = "Confirm event", value = "{\"status\": \"CONFIRMED\"}"),
            @ExampleObject(name = "Mark In Progress", value = "{\"status\": \"IN_PROGRESS\"}"),
            @ExampleObject(name = "Mark Completed", value = "{\"status\": \"COMPLETED\"}"),
            @ExampleObject(name = "Cancel event", value = "{\"status\": \"CANCELLED\"}")
    }))
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> patchEvent(@PathVariable UUID id, @RequestBody PatchEventDto dto) {
        UUID tenantId = getTenantId();
        Event event = eventService.patchEvent(id, dto, tenantId);

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

    @Operation(summary = "Get event run-of-show timeline", description = "Returns all scheduled timeline items for the event day (setup, ceremony, reception, etc.) in chronological order.")
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

    @Operation(summary = "Add timeline item", description = "Adds a run-of-show entry (e.g. Venue Setup, Ceremony, Reception). scheduledTime is ISO-8601 datetime, durationMinutes is how long it lasts.")
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

    @Operation(summary = "Toggle timeline item completion", description = "Marks a timeline item as done or undone. No body required — just pass the event ID and item ID in the path.")
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

    @Operation(summary = "Get team assignments", description = "Returns all staff members assigned to this event with their roles.")
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

    @Operation(summary = "Assign team member", description = "Assigns a staff/manager user to this event with a specific role. userId must be a valid UUID from the auth-service team.")
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

    @Operation(summary = "Remove team assignment", description = "Unassigns a team member from the event. No body needed.")
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

    @GetMapping("/tasks")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getEventTasksGlobal(@RequestParam(required = false) UUID eventId) {
        UUID tenantId = getTenantId();
        List<TimelineTask> tasks;
        if (eventId != null) {
            tasks = eventService.getEventTasks(eventId, tenantId);
        } else {
            tasks = eventService.getAllTasksForTenant(tenantId);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", tasks);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/tasks")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> addEventTaskGlobal(
            @RequestParam(required = false) UUID eventId,
            @Valid @RequestBody CreateTimelineTaskDto dto) {
        UUID finalEventId = eventId != null ? eventId : dto.getEventId();
        if (finalEventId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Event ID is required either as query parameter or inside the request body");
        }
        UUID tenantId = getTenantId();
        String authHeader = getAuthorizationHeader();
        TimelineTask task = eventService.addEventTask(finalEventId, dto, tenantId, authHeader);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", task);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Get event checklist tasks", description = "Returns all pre-event checklist tasks (to-dos) assigned to this event.")
    @GetMapping("/{id}/tasks")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> getEventTasks(@PathVariable UUID id) {
        UUID tenantId = getTenantId();
        List<TimelineTask> tasks = eventService.getEventTasks(id, tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", tasks);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Add checklist task", description = "Adds a pre-event to-do item. assignedUserId is optional — leave null to leave unassigned. dueDate format: 2026-12-01T18:00:00")
    @PostMapping("/{id}/tasks")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> addEventTask(@PathVariable UUID id, @Valid @RequestBody CreateTimelineTaskDto dto) {
        UUID tenantId = getTenantId();
        String authHeader = getAuthorizationHeader();
        TimelineTask task = eventService.addEventTask(id, dto, tenantId, authHeader);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", task);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Toggle task completion", description = "Marks a checklist task as completed or reopens it. No body required.")
    @PatchMapping("/{id}/tasks/{taskId}/toggle")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> toggleEventTask(@PathVariable UUID id, @PathVariable UUID taskId) {
        UUID tenantId = getTenantId();
        UUID userId = getUserId();
        TimelineTask task = eventService.toggleEventTask(id, taskId, tenantId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", task);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Update checklist task", description = "Updates task details (title, description, priority, status, assignee, dueDate).")
    @PutMapping("/{id}/tasks/{taskId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")
    public ResponseEntity<?> updateEventTask(@PathVariable UUID id, @PathVariable UUID taskId,
            @Valid @RequestBody CreateTimelineTaskDto dto) {
        UUID tenantId = getTenantId();
        String authHeader = getAuthorizationHeader();
        TimelineTask task = eventService.updateEventTask(id, taskId, dto, tenantId, authHeader);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", task);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Check and track overdue tasks", description = "Finds all overdue tasks and publishes notifications for them.")
    @PostMapping("/tasks/check-overdue")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public ResponseEntity<?> checkOverdueTasks() {
        UUID tenantId = getTenantId();
        List<TimelineTask> overdue = eventService.checkOverdueTasks(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", overdue);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Delete task", description = "Permanently removes a checklist task from the event.")
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

    @Operation(summary = "Client — My events", description = "Returns all events linked to the currently authenticated client's email. CLIENT role only.")
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

    @Operation(summary = "Client — Event day timeline", description = "Returns the run-of-show timeline for the client's event(s). CLIENT role only.")
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
            org.springframework.web.context.request.ServletRequestAttributes attr = (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder
                    .getRequestAttributes();
            if (attr != null) {
                return attr.getRequest().getHeader("Authorization");
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
