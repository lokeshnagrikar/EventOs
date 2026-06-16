package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateInvoiceStatusDto {

    @NotBlank(message = "Status is required")
    private String status; // DRAFT, SENT, PAID, OVERDUE, CANCELLED
}
