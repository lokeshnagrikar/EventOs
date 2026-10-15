package com.eventos.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AlbumResponseDto {

    public AlbumResponseDto() {
    }

    public AlbumResponseDto(UUID id, UUID tenantId, String name, String description, UUID eventId,
                            LocalDateTime createdAt, LocalDateTime updatedAt, long itemCount,
                            String thumbnailUrl, String coverImage,
                            com.eventos.gallery.entity.AlbumStatus status,
                            com.eventos.gallery.entity.AlbumVisibility visibility) {
        this.id = id;
        this.tenantId = tenantId;
        this.name = name;
        this.description = description;
        this.eventId = eventId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.itemCount = itemCount;
        this.thumbnailUrl = thumbnailUrl;
        this.coverImage = coverImage;
        this.status = status;
        this.visibility = visibility;
    }
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
