package com.eventos.event.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
public class CreateVendorDto {

    public CreateVendorDto() {
    }

    public CreateVendorDto(String name, String contactName, String email, String phone, String serviceType) {
        this.name = name;
        this.contactName = contactName;
        this.email = email;
        this.phone = phone;
        this.serviceType = serviceType;
    }

    @NotBlank(message = "Vendor name is required")
    private String name;

    private String contactName;
    private String email;
    private String phone;
    @NotBlank(message = "Service type is required")
    private String serviceType;
}
