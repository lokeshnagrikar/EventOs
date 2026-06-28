package com.eventos.gallery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedAlbumResponseDto {
    private UUID albumId;
    private String name;
    private String description;
    private UUID eventId;
    private boolean allowDownload;
    private List<GalleryItemResponseDto> items;
}
