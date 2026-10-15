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
public class GalleryItemResponseDto {

    public GalleryItemResponseDto() {
    }

    public GalleryItemResponseDto(UUID id, UUID tenantId, UUID albumId, String name, GalleryItemType type,
                                  String url, String publicId, Long size, String format, Double duration,
                                  String category, boolean favorite, java.util.Set<String> tags,
                                  LocalDateTime createdAt, LocalDateTime updatedAt, Integer width, Integer height, String resourceType) {
        this.id = id;
        this.tenantId = tenantId;
        this.albumId = albumId;
        this.name = name;
        this.type = type;
        this.url = url;
        this.publicId = publicId;
        this.size = size;
        this.format = format;
        this.duration = duration;
        this.category = category;
        this.favorite = favorite;
        this.tags = tags;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.width = width;
        this.height = height;
        this.resourceType = resourceType;
    }
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
