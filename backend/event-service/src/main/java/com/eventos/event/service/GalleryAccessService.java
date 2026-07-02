package com.eventos.event.service;

import com.eventos.event.entity.Booking;
import com.eventos.event.entity.Event;
import com.eventos.event.repository.BookingRepository;
import com.eventos.event.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class GalleryAccessService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;

    public GalleryAccessService(BookingRepository bookingRepository, EventRepository eventRepository) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
    }

    public List<Map<String, Object>> getClientGalleries(String clientEmail, UUID tenantId) {
        List<Booking> bookings = bookingRepository.findAllByClientEmailIgnoreCaseAndTenantIdOrderByCreatedAtDesc(clientEmail, tenantId);
        List<UUID> bookingIds = bookings.stream().map(Booking::getId).collect(Collectors.toList());

        if (bookingIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Event> events = eventRepository.findAllByBookingIdInAndTenantId(bookingIds, tenantId);
        List<Map<String, Object>> galleries = new ArrayList<>();

        for (Event event : events) {
            Map<String, Object> gallery = new HashMap<>();
            gallery.put("id", UUID.randomUUID().toString());
            gallery.put("name", event.getName() + " Album");
            gallery.put("description", "Decorator design captures and visual moodboards for " + event.getName());
            gallery.put("eventId", event.getId());
            gallery.put("itemCount", 248);
            gallery.put("thumbnailUrl", "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600");
            gallery.put("createdAt", event.getCreatedAt());
            galleries.add(gallery);
        }

        return galleries;
    }
}
