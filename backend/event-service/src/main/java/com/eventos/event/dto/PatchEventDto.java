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
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatchEventDto {
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
