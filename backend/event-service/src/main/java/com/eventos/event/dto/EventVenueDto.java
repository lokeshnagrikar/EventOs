package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
public class EventVenueDto {

    public EventVenueDto() {
    }

    public EventVenueDto(String name, String address, String notes) {
        this.name = name;
        this.address = address;
        this.notes = notes;
    }

    @NotBlank(message = "Venue name is required")
    private String name;

    private String address;

    private String notes;
}
