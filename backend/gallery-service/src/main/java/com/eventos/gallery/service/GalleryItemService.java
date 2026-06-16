package com.eventos.gallery.service;

import com.eventos.gallery.dto.GalleryItemResponseDto;
import com.eventos.gallery.entity.Album;
import com.eventos.gallery.entity.GalleryItem;
import com.eventos.gallery.entity.GalleryItemType;
import com.eventos.gallery.repository.AlbumRepository;
import com.eventos.gallery.repository.GalleryItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GalleryItemService {

    private final GalleryItemRepository galleryItemRepository;
    private final AlbumRepository albumRepository;
    private final CloudinaryService cloudinaryService;

    public GalleryItemService(GalleryItemRepository galleryItemRepository, 
                              AlbumRepository albumRepository, 
                              CloudinaryService cloudinaryService) {
        this.galleryItemRepository = galleryItemRepository;
        this.albumRepository = albumRepository;
        this.cloudinaryService = cloudinaryService;
    }

    public List<GalleryItemResponseDto> getItemsByAlbum(UUID albumId, UUID tenantId) {
        // Verify album exists for tenant
        albumRepository.findByIdAndTenantId(albumId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + albumId));

        List<GalleryItem> items = galleryItemRepository.findAllByTenantIdAndAlbumId(tenantId, albumId);
        return items.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public GalleryItemResponseDto uploadItem(UUID albumId, MultipartFile file, UUID tenantId) throws IOException {
        Album album = albumRepository.findByIdAndTenantId(albumId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + albumId));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }

        // Upload to Cloudinary
        Map<String, Object> uploadResult = cloudinaryService.upload(file);
        
        String url = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");
        Long size = (Long) uploadResult.get("bytes");
        String format = (String) uploadResult.get("format");
        Double duration = (Double) uploadResult.get("duration");

        String contentType = file.getContentType();
        GalleryItemType type = (contentType != null && contentType.startsWith("video/")) 
                ? GalleryItemType.VIDEO 
                : GalleryItemType.IMAGE;

        // Save metadata to DB
        GalleryItem item = GalleryItem.builder()
                .tenantId(tenantId)
                .album(album)
                .name(file.getOriginalFilename() != null ? file.getOriginalFilename() : "untitled")
                .type(type)
                .url(url)
                .publicId(publicId)
                .size(size)
                .format(format)
                .duration(duration)
                .build();

        GalleryItem saved = galleryItemRepository.save(item);
        return mapToResponseDto(saved);
    }

    @Transactional
    public void deleteItem(UUID id, UUID tenantId) {
        GalleryItem item = galleryItemRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Media item not found with ID: " + id));

        // Delete from Cloudinary
        boolean isVideo = GalleryItemType.VIDEO.equals(item.getType());
        cloudinaryService.delete(item.getPublicId(), isVideo);

        // Delete from DB
        galleryItemRepository.delete(item);
    }

    public GalleryItemResponseDto mapToResponseDto(GalleryItem item) {
        return GalleryItemResponseDto.builder()
                .id(item.getId())
                .tenantId(item.getTenantId())
                .albumId(item.getAlbum().getId())
                .name(item.getName())
                .type(item.getType())
                .url(item.getUrl())
                .publicId(item.getPublicId())
                .size(item.getSize())
                .format(item.getFormat())
                .duration(item.getDuration())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
