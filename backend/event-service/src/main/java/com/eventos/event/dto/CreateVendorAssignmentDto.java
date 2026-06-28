package com.eventos.event.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVendorAssignmentDto {

    @NotNull(message = "Vendor ID is required")
    private UUID vendorId;

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    private UUID taskId;
    private String roleDescription;
}
