package com.eventos.gallery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SignedUploadRequestDto {

    @NotNull(message = "Album ID is required")
    private UUID albumId;

    private String name;
}
