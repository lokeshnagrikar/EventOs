package com.eventos.gallery.service;

import com.eventos.gallery.dto.AlbumResponseDto;
import com.eventos.gallery.dto.CreateAlbumDto;
import com.eventos.gallery.entity.Album;
import com.eventos.gallery.entity.GalleryItem;
import com.eventos.gallery.repository.AlbumRepository;
import com.eventos.gallery.repository.GalleryItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final GalleryItemRepository galleryItemRepository;
    private final CloudinaryService cloudinaryService;

    public AlbumService(AlbumRepository albumRepository, 
                        GalleryItemRepository galleryItemRepository, 
                        CloudinaryService cloudinaryService) {
        this.albumRepository = albumRepository;
        this.galleryItemRepository = galleryItemRepository;
        this.cloudinaryService = cloudinaryService;
    }

    public List<AlbumResponseDto> getAllAlbums(UUID tenantId, UUID eventId) {
        List<Album> albums;
        if (eventId != null) {
            albums = albumRepository.findAllByTenantIdAndEventId(tenantId, eventId);
        } else {
            albums = albumRepository.findAllByTenantId(tenantId);
        }

        return albums.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    public AlbumResponseDto getAlbum(UUID id, UUID tenantId) {
        Album album = albumRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + id));
        return mapToResponseDto(album);
    }

    @Transactional
    public AlbumResponseDto createAlbum(CreateAlbumDto dto, UUID tenantId) {
        Album album = Album.builder()
                .tenantId(tenantId)
                .name(dto.getName())
                .description(dto.getDescription())
                .eventId(dto.getEventId())
                .build();

        Album saved = albumRepository.save(album);
        return mapToResponseDto(saved);
    }

    @Transactional
    public AlbumResponseDto updateAlbum(UUID id, CreateAlbumDto dto, UUID tenantId) {
        Album album = albumRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + id));

        album.setName(dto.getName());
        album.setDescription(dto.getDescription());
        album.setEventId(dto.getEventId());

        Album saved = albumRepository.save(album);
        return mapToResponseDto(saved);
    }

    @Transactional
    public void deleteAlbum(UUID id, UUID tenantId) {
        Album album = albumRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + id));

        // Delete all items in this album from Cloudinary first
        List<GalleryItem> items = galleryItemRepository.findAllByTenantIdAndAlbumId(tenantId, id);
        for (GalleryItem item : items) {
            boolean isVideo = com.eventos.gallery.entity.GalleryItemType.VIDEO.equals(item.getType());
            cloudinaryService.delete(item.getPublicId(), isVideo);
        }

        // JPA Cascaded delete (triggered via foreign key constraint, or handled manually here)
        galleryItemRepository.deleteAll(items);
        albumRepository.delete(album);
    }

    public AlbumResponseDto mapToResponseDto(Album album) {
        List<GalleryItem> items = galleryItemRepository.findAllByTenantIdAndAlbumId(album.getTenantId(), album.getId());
        
        long count = items.size();
        String thumbnailUrl = null;
        if (count > 0) {
            // Use the most recently created item's URL as thumbnail
            thumbnailUrl = items.stream()
                    .max((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                    .map(GalleryItem::getUrl)
                    .orElse(null);
        }

        return AlbumResponseDto.builder()
                .id(album.getId())
                .tenantId(album.getTenantId())
                .name(album.getName())
                .description(album.getDescription())
                .eventId(album.getEventId())
                .createdAt(album.getCreatedAt())
                .updatedAt(album.getUpdatedAt())
                .itemCount(count)
                .thumbnailUrl(thumbnailUrl)
                .build();
    }

    public List<AlbumResponseDto> getClientAlbums(UUID tenantId, List<UUID> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) {
            return new java.util.ArrayList<>();
        }
        List<Album> albums = albumRepository.findAllByTenantIdAndEventIdIn(tenantId, eventIds);
        return albums.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
}
