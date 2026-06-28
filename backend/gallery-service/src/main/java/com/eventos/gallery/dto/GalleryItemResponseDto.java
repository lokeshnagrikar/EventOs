package com.eventos.gallery.dto;

import com.eventos.gallery.entity.GalleryItemType;
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
public class GalleryItemResponseDto {
    private UUID id;
    private UUID tenantId;
    private UUID albumId;
    private String name;
    private GalleryItemType type;
    private String url;
    private String publicId;
    private Long size;
    private String format;
    private Double duration;
    private String category;
    private boolean favorite;
    private java.util.Set<String> tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer width;
    private Integer height;
    private String resourceType;
}
