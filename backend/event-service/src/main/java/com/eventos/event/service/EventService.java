package com.eventos.event.service;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.AssignTeamMemberDto;
import com.eventos.event.dto.CreateEventDto;
import com.eventos.event.dto.CreateTimelineItemDto;
import com.eventos.event.dto.CreateEventTaskDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.EventAssignmentRepository;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.EventTimelineItemRepository;
import com.eventos.event.repository.EventTaskRepository;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.InvoiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Transactional
public class EventService {

    private static final Logger log = LoggerFactory.getLogger(EventService.class);

    // ─── Valid status transitions ──────────────────────────────────────────────
    private static final Map<EventStatus, Set<EventStatus>> VALID_TRANSITIONS = new EnumMap<>(EventStatus.class);

    static {
        VALID_TRANSITIONS.put(EventStatus.DRAFT,       EnumSet.of(EventStatus.PLANNED, EventStatus.CANCELLED));
        VALID_TRANSITIONS.put(EventStatus.PLANNED,     EnumSet.of(EventStatus.CONFIRMED, EventStatus.CANCELLED));
        VALID_TRANSITIONS.put(EventStatus.CONFIRMED,   EnumSet.of(EventStatus.IN_PROGRESS, EventStatus.CANCELLED));
        VALID_TRANSITIONS.put(EventStatus.IN_PROGRESS, EnumSet.of(EventStatus.COMPLETED, EventStatus.CANCELLED));
        VALID_TRANSITIONS.put(EventStatus.COMPLETED,   Collections.emptySet());
        VALID_TRANSITIONS.put(EventStatus.CANCELLED,   Collections.emptySet());
        VALID_TRANSITIONS.put(EventStatus.ARCHIVED,    Collections.emptySet());
    }

    private final EventRepository eventRepository;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final EventTimelineItemRepository eventTimelineItemRepository;
    private final EventTaskRepository eventTaskRepository;
    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${service.auth.base-url:http://localhost:8081/api/v1}")
    private String authServiceBaseUrl;

    public EventService(EventRepository eventRepository,
                        EventAssignmentRepository eventAssignmentRepository,
                        EventTimelineItemRepository eventTimelineItemRepository,
                        EventTaskRepository eventTaskRepository,
                        BookingRepository bookingRepository,
                        InvoiceRepository invoiceRepository,
                        StringRedisTemplate redisTemplate,
                        ObjectMapper objectMapper) {
        this.eventRepository = eventRepository;
        this.eventAssignmentRepository = eventAssignmentRepository;
        this.eventTimelineItemRepository = eventTimelineItemRepository;
        this.eventTaskRepository = eventTaskRepository;
        this.bookingRepository = bookingRepository;
        this.invoiceRepository = invoiceRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    // ─── Helper: current user / roles ─────────────────────────────────────────

    private UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        throw new AccessDeniedException("Authentication context is missing");
    }

    private boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_" + role));
    }

    private boolean isAdminOrOwner() {
        return hasRole("OWNER") || hasRole("ADMIN");
    }

    // ─── Search events (date-range, status, type, STAFF scoping) ──────────────

    @Transactional(readOnly = true)
    public Page<Event> searchEvents(UUID tenantId, UUID userId,
                                    EventStatus status, EventType type,
                                    LocalDateTime startDate, LocalDateTime endDate,
                                    Pageable pageable) {
        // STAFF: restrict to events they are assigned to
        if (hasRole("STAFF") && !isAdminOrOwner()) {
            List<UUID> assignedEventIds = eventAssignmentRepository
                    .findAllByUserId(userId)
                    .stream()
                    .map(EventAssignment::getEventId)
                    .distinct()
                    .collect(Collectors.toList());

            if (assignedEventIds.isEmpty()) {
                return org.springframework.data.domain.Page.empty(pageable);
            }

            return eventRepository.searchEventsForStaff(tenantId, status, type, startDate, endDate,
                    assignedEventIds, pageable);
        }

        return eventRepository.searchEvents(tenantId, status, type, startDate, endDate, pageable);
    }

    @Transactional(readOnly = true)
    public List<Event> getAllEvents(UUID tenantId, EventStatus status, EventType type) {
        if (status != null && type != null) {
            return eventRepository.findAllByTenantIdAndStatusAndTypeOrderByStartDateAsc(tenantId, status, type);
        } else if (status != null) {
            return eventRepository.findAllByTenantIdAndStatusOrderByStartDateAsc(tenantId, status);
        } else if (type != null) {
            return eventRepository.findAllByTenantIdAndTypeOrderByStartDateAsc(tenantId, type);
        }
        return eventRepository.findAllByTenantIdOrderByStartDateAsc(tenantId);
    }

    // ─── Stats (cached) ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getEventStats(UUID tenantId) {
        String cacheKey = "events:stats:events:" + tenantId;
        if (redisTemplate != null) {
            try {
                String cached = redisTemplate.opsForValue().get(cacheKey);
                if (cached != null) {
                    return objectMapper.readValue(cached, new com.fasterxml.jackson.core.type.TypeReference<>() {});
                }
            } catch (Exception e) {
                log.warn("Redis read failed: {}", e.getMessage());
            }
        }

        List<Object[]> statusCounts = eventRepository.countByStatusAndTenantId(tenantId);
        List<Object[]> typeCounts   = eventRepository.countByTypeAndTenantId(tenantId);

        Map<String, Long> byStatus = new HashMap<>();
        for (Object[] row : statusCounts) {
            if (row[0] != null) byStatus.put(row[0].toString(), (Long) row[1]);
        }

        Map<String, Long> byType = new HashMap<>();
        for (Object[] row : typeCounts) {
            if (row[0] != null) byType.put(row[0].toString(), (Long) row[1]);
        }

        long totalEvents = byStatus.values().stream().mapToLong(Long::longValue).sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEvents", totalEvents);
        stats.put("byStatus", byStatus);
        stats.put("byType", byType);

        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(stats), 5, TimeUnit.MINUTES);
            } catch (Exception e) {
                log.warn("Redis write failed: {}", e.getMessage());
            }
        }

        return stats;
    }

    private void evictCache(UUID tenantId) {
        if (redisTemplate != null) {
            try {
                redisTemplate.delete("events:stats:events:" + tenantId);
            } catch (Exception e) {
                log.warn("Redis evict failed: {}", e.getMessage());
            }
        }
    }

    // ─── Get by ID (STAFF isolation enforced) ─────────────────────────────────

    @Transactional(readOnly = true)
    public Event getEventById(UUID id, UUID tenantId) {
        Event event = eventRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found or access denied"));

        // STAFF: verify they are assigned to this event
        if (hasRole("STAFF") && !isAdminOrOwner()) {
            UUID userId = getCurrentUser().getUserId();
            boolean assigned = eventAssignmentRepository.existsByEventIdAndUserId(id, userId);
            if (!assigned) {
                throw new AccessDeniedException("You are not assigned to this event");
            }
        }

        return event;
    }

    // ─── Create / Update ───────────────────────────────────────────────────────

    public Event createEvent(CreateEventDto dto, UUID tenantId) {
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("Event end date cannot be before start date");
        }

        Event event = Event.builder()
                .tenantId(tenantId)
                .name(dto.getName())
                .type(dto.getType())
                .status(EventStatus.DRAFT)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .location(dto.getLocation())
                .venueName(dto.getVenueName())
                .venueAddress(dto.getVenueAddress())
                .guestCount(dto.getGuestCount())
                .guestList(dto.getGuestList())
                .budget(dto.getBudget())
                .notes(dto.getNotes())
                .build();

        Event saved = eventRepository.save(event);
        evictCache(tenantId);
        return saved;
    }

    public Event updateEvent(UUID id, CreateEventDto dto, UUID tenantId) {
        Event event = getEventById(id, tenantId);

        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("Event end date cannot be before start date");
        }

        event.setName(dto.getName());
        event.setType(dto.getType());
        event.setStartDate(dto.getStartDate());
        event.setEndDate(dto.getEndDate());
        event.setLocation(dto.getLocation());
        event.setVenueName(dto.getVenueName());
        event.setVenueAddress(dto.getVenueAddress());
        event.setGuestCount(dto.getGuestCount());
        event.setGuestList(dto.getGuestList());
        event.setBudget(dto.getBudget());
        event.setNotes(dto.getNotes());

        Event saved = eventRepository.save(event);
        evictCache(tenantId);
        return saved;
    }

    // ─── Status transitions (with cascade cancellation) ────────────────────────

    public Event updateEventStatus(UUID id, EventStatus newStatus, UUID tenantId) {
        Event event = getEventById(id, tenantId);
        EventStatus current = event.getStatus();

        Set<EventStatus> allowed = VALID_TRANSITIONS.getOrDefault(current, Collections.emptySet());
        if (!allowed.contains(newStatus)) {
            throw new IllegalArgumentException(
                    String.format("Invalid status transition from %s to %s. Allowed transitions: %s",
                            current, newStatus, allowed.isEmpty() ? "none (terminal state)" : allowed));
        }

        event.setStatus(newStatus);
        Event saved = eventRepository.save(event);
        evictCache(tenantId);

        // Cascade cancellation to associated bookings
        if (newStatus == EventStatus.CANCELLED) {
            cascadeCancelBookings(id, tenantId);
        }

        return saved;
    }

    private void cascadeCancelBookings(UUID eventId, UUID tenantId) {
        List<Booking> bookings = bookingRepository.findAllByEventIdAndTenantId(eventId, tenantId);
        int cancelledCount = 0;
        for (Booking booking : bookings) {
            if (booking.getStatus() != BookingStatus.CANCELLED
                    && booking.getStatus() != BookingStatus.COMPLETED) {
                booking.setStatus(BookingStatus.CANCELLED);
                bookingRepository.save(booking);
                cancelledCount++;
            }
        }
        if (cancelledCount > 0) {
            log.info("Cascade cancelled {} booking(s) for event {}", cancelledCount, eventId);
        }
    }

    // ─── Timeline milestones (with date-bounds validation) ────────────────────

    @Transactional(readOnly = true)
    public List<EventTimelineItem> getTimelineItems(UUID eventId, UUID tenantId) {
        getEventById(eventId, tenantId);
        return eventTimelineItemRepository.findAllByEventIdOrderByScheduledTimeAsc(eventId);
    }

    public EventTimelineItem addTimelineItem(UUID eventId, CreateTimelineItemDto dto, UUID tenantId) {
        Event event = getEventById(eventId, tenantId);

        // ── Milestone date validation ──────────────────────────────────────────
        LocalDateTime scheduled = dto.getScheduledTime();
        if (scheduled.isBefore(event.getStartDate()) || scheduled.isAfter(event.getEndDate())) {
            throw new IllegalArgumentException(
                    "Milestone scheduled time must fall between the event start ("
                            + event.getStartDate() + ") and end (" + event.getEndDate() + ").");
        }

        EventTimelineItem item = EventTimelineItem.builder()
                .eventId(eventId)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .scheduledTime(scheduled)
                .completed(false)
                .build();

        return eventTimelineItemRepository.save(item);
    }

    public EventTimelineItem toggleTimelineItemCompletion(UUID eventId, UUID itemId, UUID tenantId) {
        getEventById(eventId, tenantId);

        EventTimelineItem item = eventTimelineItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Timeline milestone not found"));

        if (!item.getEventId().equals(eventId)) {
            throw new IllegalArgumentException("Timeline milestone does not belong to the specified event");
        }

        item.setCompleted(!item.isCompleted());
        return eventTimelineItemRepository.save(item);
    }

    // ─── Team assignments (with user validation) ───────────────────────────────

    @Transactional(readOnly = true)
    public List<EventAssignment> getAssignments(UUID eventId, UUID tenantId) {
        getEventById(eventId, tenantId);
        return eventAssignmentRepository.findAllByEventIdOrderByAssignedAtAsc(eventId);
    }

    public EventAssignment assignTeamMember(UUID eventId, AssignTeamMemberDto dto, UUID tenantId, String authHeader) {
        getEventById(eventId, tenantId);
        validateAssignedUser(dto.getUserId(), tenantId, authHeader);

        EventAssignment assignment = EventAssignment.builder()
                .eventId(eventId)
                .userId(dto.getUserId())
                .userName(dto.getUserName())
                .role(dto.getRole())
                .build();

        return eventAssignmentRepository.save(assignment);
    }

    public void removeAssignment(UUID eventId, UUID assignmentId, UUID tenantId) {
        getEventById(eventId, tenantId);

        EventAssignment assignment = eventAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (!assignment.getEventId().equals(eventId)) {
            throw new IllegalArgumentException("Assignment does not belong to the specified event");
        }

        eventAssignmentRepository.delete(assignment);
    }

    // ─── Tasks (STAFF can only toggle their own) ───────────────────────────────

    @Transactional(readOnly = true)
    public List<EventTask> getEventTasks(UUID eventId, UUID tenantId) {
        getEventById(eventId, tenantId);
        return eventTaskRepository.findAllByEventIdOrderByDueDateAsc(eventId);
    }

    public EventTask addEventTask(UUID eventId, CreateEventTaskDto dto, UUID tenantId, String authHeader) {
        getEventById(eventId, tenantId);

        if (dto.getAssignedUserId() != null) {
            validateAssignedUser(dto.getAssignedUserId(), tenantId, authHeader);
        }

        EventTask task = EventTask.builder()
                .eventId(eventId)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .dueDate(dto.getDueDate())
                .completed(false)
                .assignedUserId(dto.getAssignedUserId())
                .assignedUserName(dto.getAssignedUserName())
                .build();

        evictCache(tenantId);
        return eventTaskRepository.save(task);
    }

    public EventTask toggleEventTask(UUID eventId, UUID taskId, UUID tenantId, UUID requestingUserId) {
        getEventById(eventId, tenantId);

        EventTask task = eventTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        if (!task.getEventId().equals(eventId)) {
            throw new IllegalArgumentException("Task does not belong to the specified event");
        }

        // STAFF can only toggle tasks assigned to themselves
        if (hasRole("STAFF") && !isAdminOrOwner()) {
            if (!requestingUserId.equals(task.getAssignedUserId())) {
                throw new AccessDeniedException("You can only update tasks assigned to you");
            }
        }

        task.setCompleted(!task.isCompleted());
        evictCache(tenantId);
        return eventTaskRepository.save(task);
    }

    public void deleteEventTask(UUID eventId, UUID taskId, UUID tenantId) {
        getEventById(eventId, tenantId);

        EventTask task = eventTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        if (!task.getEventId().equals(eventId)) {
            throw new IllegalArgumentException("Task does not belong to the specified event");
        }

        eventTaskRepository.delete(task);
        evictCache(tenantId);
    }

    // ─── Client-facing ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Event> getEventsByClientEmail(String clientEmail, UUID tenantId) {
        List<Invoice> clientInvoices = invoiceRepository
                .findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
        List<UUID> bookingIds = clientInvoices.stream()
                .map(Invoice::getBookingId).distinct().collect(Collectors.toList());
        List<Event> events = new ArrayList<>();
        for (UUID bookingId : bookingIds) {
            bookingRepository.findByIdAndTenantId(bookingId, tenantId).ifPresent(booking ->
                    eventRepository.findByIdAndTenantId(booking.getEventId(), tenantId).ifPresent(events::add));
        }
        return events;
    }

    @Transactional(readOnly = true)
    public List<EventTimelineItem> getTimelineItemsByClientEmail(String clientEmail, UUID tenantId) {
        List<Invoice> clientInvoices = invoiceRepository
                .findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
        List<UUID> bookingIds = clientInvoices.stream()
                .map(Invoice::getBookingId).distinct().collect(Collectors.toList());
        List<EventTimelineItem> timelineItems = new ArrayList<>();
        for (UUID bookingId : bookingIds) {
            bookingRepository.findByIdAndTenantId(bookingId, tenantId).ifPresent(booking ->
                    timelineItems.addAll(
                            eventTimelineItemRepository.findAllByEventIdOrderByScheduledTimeAsc(booking.getEventId())));
        }
        return timelineItems;
    }

    // ─── User validation (auth-service via RestTemplate) ──────────────────────

    @SuppressWarnings("unchecked")
    private void validateAssignedUser(UUID userId, UUID tenantId, String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            log.warn("Skipping user validation: no auth header in context (test or internal call)");
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authHeader);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<?> response = restTemplate.exchange(
                    authServiceBaseUrl + "/settings/team",
                    HttpMethod.GET,
                    entity,
                    Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || !(response.getBody() instanceof Map)) {
                throw new IllegalArgumentException("Could not validate assigned user — auth-service error");
            }

            Map<?, ?> body = (Map<?, ?>) response.getBody();
            List<?> teamList = (List<?>) body.get("data");
            if (teamList == null) {
                throw new IllegalArgumentException("Could not validate assigned user — no team data returned");
            }

            boolean found = teamList.stream()
                    .filter(m -> m instanceof Map)
                    .map(m -> (Map<?, ?>) m)
                    .anyMatch(m -> userId.toString().equals(String.valueOf(m.get("id")))
                            || userId.toString().equals(String.valueOf(m.get("userId"))));

            if (!found) {
                throw new IllegalArgumentException(
                        "Assigned user does not exist or does not belong to your tenant");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to validate assigned user via auth-service: {}", e.getMessage());
            throw new IllegalArgumentException("Failed to validate assigned user: " + e.getMessage());
        }
    }

    // ─── Visible for testing ───────────────────────────────────────────────────

    void setRestTemplate(RestTemplate restTemplate) {
        // no-op setter; actual instance is final — override in tests via reflection or constructor injection
    }
}
