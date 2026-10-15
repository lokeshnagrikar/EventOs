package com.eventos.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ShareLinkResponseDto {

    public ShareLinkResponseDto() {
    }

    public ShareLinkResponseDto(UUID id, UUID albumId, String token, java.time.Instant expiresAt,
                                boolean passwordProtected, LocalDateTime createdAt, boolean expired,
                                boolean allowDownload, boolean watermark, String watermarkText) {
        this.id = id;
        this.albumId = albumId;
        this.token = token;
        this.expiresAt = expiresAt;
        this.passwordProtected = passwordProtected;
        this.createdAt = createdAt;
        this.expired = expired;
        this.allowDownload = allowDownload;
        this.watermark = watermark;
        this.watermarkText = watermarkText;
    }
    private UUID id;
    private UUID albumId;
    private String token;
    private java.time.Instant expiresAt;
    private boolean passwordProtected;
    private LocalDateTime createdAt;
    private boolean expired;
    private boolean allowDownload;
    private boolean watermark;
    private String watermarkText;
}
