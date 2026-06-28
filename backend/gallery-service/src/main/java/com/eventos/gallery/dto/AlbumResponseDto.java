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
public class AlbumResponseDto {
    private UUID id;
    private UUID tenantId;
    private String name;
    private String description;
    private UUID eventId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long itemCount;
    private String thumbnailUrl;
    private String coverImage;
    private com.eventos.gallery.entity.AlbumStatus status;
    private com.eventos.gallery.entity.AlbumVisibility visibility;
}
