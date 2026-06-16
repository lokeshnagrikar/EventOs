package com.eventos.gallery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateShareLinkDto {

    @NotNull(message = "Album ID is required")
    private UUID albumId;

    private Integer expiresInHours; // Expire duration (optional)

    private String password; // Optional passcode protecting the link
}
