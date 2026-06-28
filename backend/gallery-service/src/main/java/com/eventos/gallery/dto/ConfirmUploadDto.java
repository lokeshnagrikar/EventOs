package com.eventos.gallery.dto;

import com.eventos.gallery.entity.GalleryItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ConfirmUploadDto {

    @NotNull(message = "Album ID is required")
    private UUID albumId;

    @NotBlank(message = "File name is required")
    private String name;

    @NotNull(message = "Media type is required")
    private GalleryItemType type;

    @NotBlank(message = "URL is required")
    private String url;

    @NotBlank(message = "Public ID is required")
    private String publicId;

    private Long size;

    private String format;

    private Double duration;

    private String category;

    private Boolean favorite;

    private java.util.Set<String> tags;

    private Integer width;

    private Integer height;

    private String resourceType;
}
