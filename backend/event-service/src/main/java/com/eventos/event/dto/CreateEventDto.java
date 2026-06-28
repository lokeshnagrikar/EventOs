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
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEventDto {

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
