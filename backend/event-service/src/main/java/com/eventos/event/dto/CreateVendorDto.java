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
public class CreateVendorDto {

    @NotBlank(message = "Vendor name is required")
    private String name;

    private String contactName;
    private String email;
    private String phone;
    @NotBlank(message = "Service type is required")
    private String serviceType;
}
