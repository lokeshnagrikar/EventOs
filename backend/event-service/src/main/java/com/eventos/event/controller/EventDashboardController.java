package com.eventos.event.controller;

import com.eventos.event.dto.EventDashboardMetricsDto;
import com.eventos.event.entity.Booking;
import com.eventos.event.entity.Event;
import com.eventos.event.entity.EventTimelineItem;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.EventTimelineItemRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/dashboard")
public class EventDashboardController {

    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    private final EventTimelineItemRepository eventTimelineItemRepository;

    public EventDashboardController(EventRepository eventRepository,
                                    BookingRepository bookingRepository,
                                    EventTimelineItemRepository eventTimelineItemRepository) {
        this.eventRepository = eventRepository;
        this.bookingRepository = bookingRepository;
        this.eventTimelineItemRepository = eventTimelineItemRepository;
    }

    @GetMapping("/metrics")
    public ResponseEntity<?> getDashboardMetrics() {
        UUID tenantId = getTenantId();
        LocalDateTime now = LocalDateTime.now();

        // 1. Fetch upcoming events count & top 5 using database query
        long upcomingEventsCount = eventRepository.countByTenantIdAndStartDateAfter(tenantId, now);
        List<Event> upcomingEventsList = eventRepository.findTop5ByTenantIdAndStartDateAfterOrderByStartDateAsc(tenantId, now);

        List<EventDashboardMetricsDto.EventSummaryDto> upcomingSummaries = upcomingEventsList.stream()
                .map(e -> EventDashboardMetricsDto.EventSummaryDto.builder()
                        .id(e.getId().toString())
                        .name(e.getName())
                        .type(e.getType().name())
                        .status(e.getStatus().name())
                        .startDate(e.getStartDate().toString())
                        .location(e.getLocation())
                        .build())
                .collect(Collectors.toList());

        // 2. Fetch bookings revenue summary using database aggregations
        List<Object[]> revenueSummary = bookingRepository.getBookingRevenueSummary(tenantId);
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        if (revenueSummary != null && !revenueSummary.isEmpty()) {
            Object[] row = revenueSummary.get(0);
            if (row != null) {
                totalRevenue = (BigDecimal) row[0];
                totalPaid = (BigDecimal) row[1];
            }
        }
        BigDecimal pendingPayments = totalRevenue.subtract(totalPaid);

        // 3. Fetch uncompleted tasks (EventTimelineItems)
        List<EventTimelineItem> tasks = eventTimelineItemRepository
                .findAllByTenantIdAndCompletedOrderByScheduledTimeAsc(tenantId, false);

        // Fetch names of only the events referenced by tasks
        List<UUID> eventIds = tasks.stream()
                .map(EventTimelineItem::getEventId)
                .distinct()
                .collect(Collectors.toList());
        
        Map<UUID, String> eventNameMap = new HashMap<>();
        if (!eventIds.isEmpty()) {
            List<Event> eventsForTasks = eventRepository.findAllByIdInAndTenantId(eventIds, tenantId);
            eventNameMap = eventsForTasks.stream()
                    .collect(Collectors.toMap(Event::getId, Event::getName, (a, b) -> a));
        }

        List<EventDashboardMetricsDto.TaskSummaryDto> taskSummaries = tasks.stream()
                .limit(5)
                .map(t -> EventDashboardMetricsDto.TaskSummaryDto.builder()
                        .id(t.getId().toString())
                        .eventId(t.getEventId().toString())
                        .eventName(eventNameMap.getOrDefault(t.getEventId(), "Unknown Event"))
                        .title(t.getTitle())
                        .description(t.getDescription())
                        .scheduledTime(t.getScheduledTime().toString())
                        .completed(t.isCompleted())
                        .build())
                .collect(Collectors.toList());

        EventDashboardMetricsDto metrics = EventDashboardMetricsDto.builder()
                .upcomingEventsCount(upcomingEventsCount)
                .upcomingEvents(upcomingSummaries)
                .totalRevenue(totalRevenue)
                .pendingPayments(pendingPayments)
                .teamTasks(taskSummaries)
                .build();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", metrics);

        return ResponseEntity.ok(response);
    }

    private UUID getTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.event.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.event.config.UserPrincipal) auth.getPrincipal()).getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.UNAUTHORIZED, "Tenant context is missing or invalid");
    }
}
