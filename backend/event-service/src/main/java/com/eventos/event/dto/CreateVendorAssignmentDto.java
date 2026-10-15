package com.eventos.event.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
public class CreateVendorAssignmentDto {

    public CreateVendorAssignmentDto() {
    }

    public CreateVendorAssignmentDto(UUID vendorId, UUID bookingId, UUID taskId, String roleDescription) {
        this.vendorId = vendorId;
        this.bookingId = bookingId;
        this.taskId = taskId;
        this.roleDescription = roleDescription;
    }

    @NotNull(message = "Vendor ID is required")
    private UUID vendorId;

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    private UUID taskId;
    private String roleDescription;
}
