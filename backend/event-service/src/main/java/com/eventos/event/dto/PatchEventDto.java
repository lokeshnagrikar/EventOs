package com.eventos.event.dto;

import com.eventos.event.entity.EventType;
import com.eventos.event.entity.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PatchEventDto {

    public PatchEventDto() {
    }

    public PatchEventDto(String name, String title, EventType type, EventStatus status,
                         LocalDateTime startDate, LocalDateTime endDate, String location,
                         String venueName, String venueAddress, Integer guestCount,
                         String guestList, BigDecimal budget, String notes, UUID bookingId,
                         List<EventDayDto> eventDays, List<EventVenueDto> eventVenues) {
        this.name = name;
        this.title = title;
        this.type = type;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.location = location;
        this.venueName = venueName;
        this.venueAddress = venueAddress;
        this.guestCount = guestCount;
        this.guestList = guestList;
        this.budget = budget;
        this.notes = notes;
        this.bookingId = bookingId;
        this.eventDays = eventDays;
        this.eventVenues = eventVenues;
    }
    private String name;
    private String title;
    private EventType type;
    private EventStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String location;
    private String venueName;
    private String venueAddress;
    private Integer guestCount;
    private String guestList;
    private BigDecimal budget;
    private String notes;
    private UUID bookingId;
    private List<EventDayDto> eventDays;
    private List<EventVenueDto> eventVenues;
}
