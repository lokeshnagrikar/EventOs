package com.eventos.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class SharedAlbumResponseDto {

    public SharedAlbumResponseDto() {
    }

    public SharedAlbumResponseDto(UUID albumId, String name, String description, UUID eventId,
                                  boolean allowDownload, boolean watermark, String watermarkText,
                                  List<GalleryItemResponseDto> items) {
        this.albumId = albumId;
        this.name = name;
        this.description = description;
        this.eventId = eventId;
        this.allowDownload = allowDownload;
        this.watermark = watermark;
        this.watermarkText = watermarkText;
        this.items = items;
    }
    private UUID albumId;
    private String name;
    private String description;
    private UUID eventId;
    private boolean allowDownload;
    private boolean watermark;
    private String watermarkText;
    private List<GalleryItemResponseDto> items;
}
