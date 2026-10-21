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
    private java.time.Instant expiresAt;
    private boolean passwordProtected;
    private String generatedPasscode; // Returned to creator if auto-generated
    private LocalDateTime createdAt;
    private boolean expired;
    private boolean isRevoked;
    private java.time.Instant revokedAt;
    private boolean allowDownload;
    private boolean watermark;
    private String watermarkText;
}
