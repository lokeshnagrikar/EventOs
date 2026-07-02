package com.eventos.event.service;

import com.eventos.event.entity.Booking;
import com.eventos.event.entity.Event;
import com.eventos.event.entity.EventTimelineItem;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.EventRepository;
import com.eventos.event.repository.EventTimelineItemRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TimelineService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final EventTimelineItemRepository eventTimelineItemRepository;

    public TimelineService(BookingRepository bookingRepository,
                           EventRepository eventRepository,
                           EventTimelineItemRepository eventTimelineItemRepository) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.eventTimelineItemRepository = eventTimelineItemRepository;
    }

    public List<EventTimelineItem> getTimelineItems(String clientEmail, UUID tenantId) {
        List<Booking> bookings = bookingRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
        List<UUID> bookingIds = bookings.stream().map(Booking::getId).collect(Collectors.toList());

        if (bookingIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Event> events = eventRepository.findAllByBookingIdInAndTenantId(bookingIds, tenantId);
        List<EventTimelineItem> items = new ArrayList<>();

        for (Event event : events) {
            items.addAll(eventTimelineItemRepository.findAllByEventIdOrderByScheduledTimeAsc(event.getId()));
        }

        return items;
    }
}
