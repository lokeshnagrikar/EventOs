package com.eventos.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareLinkResponseDto {
    private UUID id;
    private UUID albumId;
    private String token;
    private LocalDateTime expiresAt;
    private boolean passwordProtected;
    private LocalDateTime createdAt;
    private boolean expired;
}
