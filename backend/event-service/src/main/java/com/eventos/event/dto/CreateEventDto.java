package com.eventos.event.dto;

import com.eventos.event.entity.EventType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CreateEventDto {

    public CreateEventDto() {
    }

    public CreateEventDto(String name, String title, EventType type, LocalDateTime startDate, LocalDateTime endDate,
                          String location, String venueName, String venueAddress, Integer guestCount, String guestList,
                          BigDecimal budget, String notes, java.util.UUID bookingId,
                          java.util.List<EventDayDto> eventDays, java.util.List<EventVenueDto> eventVenues) {
        this.name = name;
        this.title = title;
        this.type = type;
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

    @NotNull(message = "Event type is required")
    private EventType type;

    @NotNull(message = "Start date is required")
    private LocalDateTime startDate;

    @NotNull(message = "End date is required")
    private LocalDateTime endDate;

    private String location;

    private String venueName;

    private String venueAddress;

    private Integer guestCount;

    private String guestList;

    @PositiveOrZero(message = "Budget must be positive or zero")
    private BigDecimal budget;

    private String notes;

    private java.util.UUID bookingId;

    private java.util.List<EventDayDto> eventDays;

    private java.util.List<EventVenueDto> eventVenues;
}
