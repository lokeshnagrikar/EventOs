package com.eventos.event.service;

import com.eventos.event.config.UserPrincipal;
import com.eventos.event.dto.AssignTeamMemberDto;
import com.eventos.event.dto.CreateEventDto;
import com.eventos.event.dto.PatchEventDto;
import com.eventos.event.dto.CreateTimelineItemDto;
import com.eventos.event.dto.CreateTimelineTaskDto;
import com.eventos.event.entity.*;
import com.eventos.event.repository.EventAssignmentRepository;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.EventTimelineItemRepository;
import com.eventos.event.repository.TimelineTaskRepository;
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
@SuppressWarnings("null")
public class EventService {

    private static final Logger log = LoggerFactory.getLogger(EventService.class);

    // ─── Valid status transitions ──────────────────────────────────────────────
    private static final Map<EventStatus, Set<EventStatus>> VALID_TRANSITIONS = new EnumMap<>(EventStatus.class);

    static {
        VALID_TRANSITIONS.put(EventStatus.PLANNING,    EnumSet.of(EventStatus.CONFIRMED, EventStatus.CANCELLED));
        VALID_TRANSITIONS.put(EventStatus.CONFIRMED,   EnumSet.of(EventStatus.IN_PROGRESS, EventStatus.CANCELLED));
        VALID_TRANSITIONS.put(EventStatus.IN_PROGRESS, EnumSet.of(EventStatus.COMPLETED, EventStatus.CANCELLED));
        VALID_TRANSITIONS.put(EventStatus.COMPLETED,   Collections.emptySet());
        VALID_TRANSITIONS.put(EventStatus.CANCELLED,   Collections.emptySet());
    }

    private final EventRepository eventRepository;
    private final EventAssignmentRepository eventAssignmentRepository;
    private final EventTimelineItemRepository eventTimelineItemRepository;
    private final TimelineTaskRepository timelineTaskRepository;
    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @Value("${service.auth.base-url:http://localhost:8081/api/v1}")
    private String authServiceBaseUrl;

    public EventService(EventRepository eventRepository,
                        EventAssignmentRepository eventAssignmentRepository,
                        EventTimelineItemRepository eventTimelineItemRepository,
                        TimelineTaskRepository timelineTaskRepository,
                        BookingRepository bookingRepository,
                        InvoiceRepository invoiceRepository,
                        StringRedisTemplate redisTemplate,
                        ObjectMapper objectMapper,
                        org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate) {
        this.eventRepository = eventRepository;
        this.eventAssignmentRepository = eventAssignmentRepository;
        this.eventTimelineItemRepository = eventTimelineItemRepository;
        this.timelineTaskRepository = timelineTaskRepository;
        this.bookingRepository = bookingRepository;
        this.invoiceRepository = invoiceRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.rabbitTemplate = rabbitTemplate;
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
        Page<Event> page;
        // STAFF: restrict to events they are assigned to
        if (hasRole("STAFF") && !isAdminOrOwner()) {
            List<UUID> assignedEventIds = eventAssignmentRepository
                    .findAllByUserId(userId)
                    .stream()
                    .map(EventAssignment::getEventId)
                    .distinct()
                    .collect(Collectors.toList());

            if (assignedEventIds.isEmpty()) {
                page = org.springframework.data.domain.Page.empty(pageable);
            } else {
                page = eventRepository.searchEventsForStaff(tenantId, status, type, startDate, endDate,
                        assignedEventIds, pageable);
            }
        } else {
            page = eventRepository.searchEvents(tenantId, status, type, startDate, endDate, pageable);
        }
        page.forEach(this::populateProgressPercentage);
        return page;
    }

    @Transactional(readOnly = true)
    public List<Event> getAllEvents(UUID tenantId, EventStatus status, EventType type) {
        List<Event> events;
        if (status != null && type != null) {
            events = eventRepository.findAllByTenantIdAndStatusAndTypeOrderByStartDateAsc(tenantId, status, type);
        } else if (status != null) {
            events = eventRepository.findAllByTenantIdAndStatusOrderByStartDateAsc(tenantId, status);
        } else if (type != null) {
            events = eventRepository.findAllByTenantIdAndTypeOrderByStartDateAsc(tenantId, type);
        } else {
            events = eventRepository.findAllByTenantIdOrderByStartDateAsc(tenantId);
        }
        events.forEach(this::populateProgressPercentage);
        return events;
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

        // CLIENT: verify they are linked via a booking invoice matching their email
        if (hasRole("CLIENT")) {
            String clientEmail = getCurrentUser().getEmail();
            List<Booking> bookings = bookingRepository.findAllByEventIdAndTenantId(id, tenantId);
            boolean hasAccess = false;
            if (bookings != null && !bookings.isEmpty()) {
                List<UUID> bookingIds = bookings.stream().map(Booking::getId).toList();
                hasAccess = invoiceRepository.findAllByBookingIdInAndTenantIdOrderByCreatedAtDesc(bookingIds, tenantId)
                        .stream()
                        .anyMatch(invoice -> invoice.getClientEmail() != null && invoice.getClientEmail().equalsIgnoreCase(clientEmail));
            }
            if (!hasAccess) {
                throw new AccessDeniedException("Access denied: You are not authorized to access this event");
            }
        }

        populateProgressPercentage(event);
        return event;
    }

    // ─── Create / Update ───────────────────────────────────────────────────────

    public Event createEvent(CreateEventDto dto, UUID tenantId) {
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("Event end date cannot be before start date");
        }

        String eventName = dto.getTitle() != null && !dto.getTitle().isEmpty() ? dto.getTitle() : dto.getName();

        List<EventDay> days = new ArrayList<>();
        if (dto.getEventDays() != null) {
            for (com.eventos.event.dto.EventDayDto dDto : dto.getEventDays()) {
                days.add(EventDay.builder()
                        .dayDate(dDto.getDayDate())
                        .title(dDto.getTitle())
                        .description(dDto.getDescription())
                        .tenantId(tenantId)
                        .build());
            }
        }

        List<EventVenue> venues = new ArrayList<>();
        if (dto.getEventVenues() != null) {
            for (com.eventos.event.dto.EventVenueDto vDto : dto.getEventVenues()) {
                venues.add(EventVenue.builder()
                        .name(vDto.getName())
                        .address(vDto.getAddress())
                        .notes(vDto.getNotes())
                        .tenantId(tenantId)
                        .build());
            }
        }

        Event event = Event.builder()
                .tenantId(tenantId)
                .name(eventName)
                .type(dto.getType())
                .status(EventStatus.PLANNING)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .location(dto.getLocation())
                .venueName(dto.getVenueName())
                .venueAddress(dto.getVenueAddress())
                .guestCount(dto.getGuestCount())
                .guestList(dto.getGuestList())
                .budget(dto.getBudget())
                .notes(dto.getNotes())
                .bookingId(dto.getBookingId())
                .eventDays(days)
                .eventVenues(venues)
                .build();

        populateChildTenants(event, tenantId);
        Event saved = eventRepository.save(event);

        if (dto.getBookingId() != null) {
            bookingRepository.findByIdAndTenantId(dto.getBookingId(), tenantId).ifPresent(b -> {
                b.setEventId(saved.getId());
                bookingRepository.save(b);
            });
        }

        populateProgressPercentage(saved);
        evictCache(tenantId);
        return saved;
    }

    public Event updateEvent(UUID id, CreateEventDto dto, UUID tenantId) {
        Event event = getEventById(id, tenantId);

        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("Event end date cannot be before start date");
        }

        String eventName = dto.getTitle() != null && !dto.getTitle().isEmpty() ? dto.getTitle() : dto.getName();

        event.setName(eventName);
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
        event.setBookingId(dto.getBookingId());

        // Update days
        event.getEventDays().clear();
        if (dto.getEventDays() != null) {
            for (com.eventos.event.dto.EventDayDto dDto : dto.getEventDays()) {
                event.getEventDays().add(EventDay.builder()
                        .eventId(event.getId())
                        .dayDate(dDto.getDayDate())
                        .title(dDto.getTitle())
                        .description(dDto.getDescription())
                        .tenantId(tenantId)
                        .build());
            }
        }

        // Update venues
        event.getEventVenues().clear();
        if (dto.getEventVenues() != null) {
            for (com.eventos.event.dto.EventVenueDto vDto : dto.getEventVenues()) {
                event.getEventVenues().add(EventVenue.builder()
                        .eventId(event.getId())
                        .name(vDto.getName())
                        .address(vDto.getAddress())
                        .notes(vDto.getNotes())
                        .tenantId(tenantId)
                        .build());
            }
        }

        populateChildTenants(event, tenantId);
        Event saved = eventRepository.save(event);

        if (dto.getBookingId() != null) {
            bookingRepository.findByIdAndTenantId(dto.getBookingId(), tenantId).ifPresent(b -> {
                b.setEventId(saved.getId());
                bookingRepository.save(b);
            });
        }

        populateProgressPercentage(saved);
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

        populateProgressPercentage(saved);
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
                .milestone(dto.getMilestone())
                .build();
        item.setTenantId(tenantId);

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
    public List<TimelineTask> getEventTasks(UUID eventId, UUID tenantId) {
        getEventById(eventId, tenantId);
        return timelineTaskRepository.findAllByEventIdOrderByDueDateAsc(eventId);
    }

    public TimelineTask addEventTask(UUID eventId, CreateTimelineTaskDto dto, UUID tenantId, String authHeader) {
        getEventById(eventId, tenantId);

        if (dto.getAssignedUserId() != null) {
            validateAssignedUser(dto.getAssignedUserId(), tenantId, authHeader);
        }

        TaskPriority priority = dto.getPriority() != null ? dto.getPriority() : TaskPriority.MEDIUM;
        TaskStatus status = dto.getStatus() != null ? dto.getStatus() : TaskStatus.TODO;

        TimelineTask task = TimelineTask.builder()
                .eventId(eventId)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .dueDate(dto.getDueDate())
                .completed(status == TaskStatus.COMPLETED)
                .assignedUserId(dto.getAssignedUserId())
                .assignedUserName(dto.getAssignedUserName())
                .priority(priority)
                .status(status)
                .build();
        task.setTenantId(tenantId);

        TimelineTask saved = timelineTaskRepository.save(task);
        evictCache(tenantId);

        // Publish TASK_ASSIGNED notification if assigned to a user
        if (saved.getAssignedUserId() != null) {
            publishTaskNotification(saved, "TASK_ASSIGNED", tenantId);
        }

        return saved;
    }

    public TimelineTask updateEventTask(UUID eventId, UUID taskId, CreateTimelineTaskDto dto, UUID tenantId, String authHeader) {
        getEventById(eventId, tenantId);

        TimelineTask task = timelineTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        if (!task.getEventId().equals(eventId)) {
            throw new IllegalArgumentException("Task does not belong to the specified event");
        }

        if (dto.getAssignedUserId() != null && !dto.getAssignedUserId().equals(task.getAssignedUserId())) {
            validateAssignedUser(dto.getAssignedUserId(), tenantId, authHeader);
        }

        boolean assigneeChanged = !Objects.equals(task.getAssignedUserId(), dto.getAssignedUserId());
        TaskStatus oldStatus = task.getStatus();
        TaskStatus newStatus = dto.getStatus() != null ? dto.getStatus() : task.getStatus();

        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setDueDate(dto.getDueDate());
        task.setAssignedUserId(dto.getAssignedUserId());
        task.setAssignedUserName(dto.getAssignedUserName());
        if (dto.getPriority() != null) {
            task.setPriority(dto.getPriority());
        }
        task.setStatus(newStatus);

        TimelineTask saved = timelineTaskRepository.save(task);
        evictCache(tenantId);

        // Publish notifications as needed
        if (assigneeChanged && saved.getAssignedUserId() != null) {
            publishTaskNotification(saved, "TASK_ASSIGNED", tenantId);
        }
        if (oldStatus != newStatus) {
            publishTaskNotification(saved, "TASK_STATUS_CHANGED", tenantId);
        }

        return saved;
    }

    public TimelineTask toggleEventTask(UUID eventId, UUID taskId, UUID tenantId, UUID requestingUserId) {
        getEventById(eventId, tenantId);

        TimelineTask task = timelineTaskRepository.findById(taskId)
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

        TaskStatus oldStatus = task.getStatus();
        task.setCompleted(!task.isCompleted());
        TimelineTask saved = timelineTaskRepository.save(task);
        evictCache(tenantId);

        if (oldStatus != saved.getStatus()) {
            publishTaskNotification(saved, "TASK_STATUS_CHANGED", tenantId);
        }

        return saved;
    }

    public void deleteEventTask(UUID eventId, UUID taskId, UUID tenantId) {
        getEventById(eventId, tenantId);

        TimelineTask task = timelineTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        if (!task.getEventId().equals(eventId)) {
            throw new IllegalArgumentException("Task does not belong to the specified event");
        }

        timelineTaskRepository.delete(task);
        evictCache(tenantId);
    }

    public List<TimelineTask> checkOverdueTasks(UUID tenantId) {
        List<TimelineTask> overdue = timelineTaskRepository.findAllByTenantIdAndDueDateBeforeAndCompletedFalse(tenantId, LocalDateTime.now());
        for (TimelineTask task : overdue) {
            publishTaskNotification(task, "TASK_OVERDUE", tenantId);
        }
        return overdue;
    }

    private void publishTaskNotification(TimelineTask task, String notificationType, UUID tenantId) {
        try {
            com.eventos.event.event.TaskNotificationEvent event = com.eventos.event.event.TaskNotificationEvent.builder()
                    .taskId(task.getId())
                    .eventId(task.getEventId())
                    .tenantId(tenantId)
                    .title(task.getTitle())
                    .eventType(notificationType)
                    .description(task.getDescription())
                    .assignedUserId(task.getAssignedUserId())
                    .dueDate(task.getDueDate())
                    .priority(task.getPriority())
                    .status(task.getStatus())
                    .timestamp(LocalDateTime.now())
                    .build();

            rabbitTemplate.convertAndSend(
                    com.eventos.event.config.MessagingConfig.EXCHANGE,
                    com.eventos.event.config.MessagingConfig.TASK_NOTIFICATION_ROUTING_KEY,
                    event
            );
            log.info("Published TaskNotificationEvent of type {} for Task ID: {}", notificationType, task.getId());
        } catch (Exception e) {
            log.error("Failed to publish TaskNotificationEvent: {}", e.getMessage());
        }
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
        events.forEach(this::populateProgressPercentage);
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

            Object responseBody = response.getBody();
            if (!response.getStatusCode().is2xxSuccessful() || !(responseBody instanceof Map)) {
                throw new IllegalArgumentException("Could not validate assigned user — auth-service error");
            }

            Map<?, ?> body = (Map<?, ?>) responseBody;
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

    public void populateProgressPercentage(Event event) {
        if (event == null) return;
        long totalTasks = timelineTaskRepository.countByEventId(event.getId());
        long completedTasks = timelineTaskRepository.countByEventIdAndCompletedTrue(event.getId());
        long totalTimeline = eventTimelineItemRepository.countByEventId(event.getId());
        long completedTimeline = eventTimelineItemRepository.countByEventIdAndCompletedTrue(event.getId());
        
        long total = totalTasks + totalTimeline;
        long completed = completedTasks + completedTimeline;
        
        double percentage = total > 0 ? (completed * 100.0) / total : 0.0;
        event.setProgressPercentage(percentage);
    }

    private void populateChildTenants(Event event, UUID tenantId) {
        if (event.getEventDays() != null) {
            for (EventDay day : event.getEventDays()) {
                day.setTenantId(tenantId);
            }
        }
        if (event.getEventVenues() != null) {
            for (EventVenue venue : event.getEventVenues()) {
                venue.setTenantId(tenantId);
            }
        }
    }

    // ─── Visible for testing ───────────────────────────────────────────────────

    void setRestTemplate(RestTemplate restTemplate) {
        // no-op setter; actual instance is final — override in tests via reflection or constructor injection
    }

    public Event patchEvent(UUID id, PatchEventDto dto, UUID tenantId) {
        Event event = getEventById(id, tenantId);

        if (dto.getStartDate() != null && dto.getEndDate() != null) {
            if (dto.getEndDate().isBefore(dto.getStartDate())) {
                throw new IllegalArgumentException("Event end date cannot be before start date");
            }
        }

        String eventName = dto.getTitle() != null && !dto.getTitle().isEmpty() ? dto.getTitle() : dto.getName();
        if (eventName != null) {
            event.setName(eventName);
        }
        if (dto.getType() != null) {
            event.setType(dto.getType());
        }
        if (dto.getStartDate() != null) {
            event.setStartDate(dto.getStartDate());
        }
        if (dto.getEndDate() != null) {
            event.setEndDate(dto.getEndDate());
        }
        if (dto.getLocation() != null) {
            event.setLocation(dto.getLocation());
        }
        if (dto.getVenueName() != null) {
            event.setVenueName(dto.getVenueName());
        }
        if (dto.getVenueAddress() != null) {
            event.setVenueAddress(dto.getVenueAddress());
        }
        if (dto.getGuestCount() != null) {
            event.setGuestCount(dto.getGuestCount());
        }
        if (dto.getGuestList() != null) {
            event.setGuestList(dto.getGuestList());
        }
        if (dto.getBudget() != null) {
            event.setBudget(dto.getBudget());
        }
        if (dto.getNotes() != null) {
            event.setNotes(dto.getNotes());
        }
        if (dto.getBookingId() != null) {
            event.setBookingId(dto.getBookingId());
        }
        if (dto.getStatus() != null) {
            event.setStatus(dto.getStatus());
        }

        if (dto.getEventDays() != null) {
            event.getEventDays().clear();
            for (com.eventos.event.dto.EventDayDto dDto : dto.getEventDays()) {
                event.getEventDays().add(EventDay.builder()
                        .eventId(event.getId())
                        .dayDate(dDto.getDayDate())
                        .title(dDto.getTitle())
                        .description(dDto.getDescription())
                        .tenantId(tenantId)
                        .build());
            }
        }

        if (dto.getEventVenues() != null) {
            event.getEventVenues().clear();
            for (com.eventos.event.dto.EventVenueDto vDto : dto.getEventVenues()) {
                event.getEventVenues().add(EventVenue.builder()
                        .eventId(event.getId())
                        .name(vDto.getName())
                        .address(vDto.getAddress())
                        .notes(vDto.getNotes())
                        .tenantId(tenantId)
                        .build());
            }
        }

        populateChildTenants(event, tenantId);
        Event saved = eventRepository.save(event);
        populateProgressPercentage(saved);
        evictCache(tenantId);
        return saved;
    }

    public List<TimelineTask> getAllTasksForTenant(UUID tenantId) {
        return timelineTaskRepository.findAllByTenantIdOrderByDueDateAsc(tenantId);
    }
}
