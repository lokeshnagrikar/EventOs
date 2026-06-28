package com.eventos.gallery.service;

import com.eventos.gallery.dto.AlbumResponseDto;
import com.eventos.gallery.dto.CreateAlbumDto;
import com.eventos.gallery.entity.Album;
import com.eventos.gallery.entity.GalleryItem;
import com.eventos.gallery.event.AlbumDeletedEvent;
import com.eventos.gallery.repository.AlbumRepository;
import com.eventos.gallery.repository.GalleryItemRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class AlbumService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AlbumService.class);

    @org.springframework.beans.factory.annotation.Value("${service.event.base-url:http://localhost:8083/api/v1/events}")
    private String eventServiceBaseUrl;

    private final org.springframework.web.reactive.function.client.WebClient webClient = 
        org.springframework.web.reactive.function.client.WebClient.builder().build();

    private final AlbumRepository albumRepository;
    private final GalleryItemRepository galleryItemRepository;
    private final ApplicationEventPublisher eventPublisher;

    public AlbumService(AlbumRepository albumRepository, 
                        GalleryItemRepository galleryItemRepository, 
                        ApplicationEventPublisher eventPublisher) {
        this.albumRepository = albumRepository;
        this.galleryItemRepository = galleryItemRepository;
        this.eventPublisher = eventPublisher;
    }

    private com.eventos.gallery.config.UserPrincipal getCurrentPrincipal() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.gallery.config.UserPrincipal) {
            return (com.eventos.gallery.config.UserPrincipal) auth.getPrincipal();
        }
        return null;
    }

    private String getCurrentAuthHeader() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attr = 
                (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attr != null) {
                return attr.getRequest().getHeader("Authorization");
            }
        } catch (Exception ignored) {}
        return null;
    }

    private List<UUID> getClientEventIdsFromEventService(String authHeader) {
        if (authHeader == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Authorization context is missing");
        }
        try {
            java.util.Map<String, Object> response = webClient.get()
                .uri(eventServiceBaseUrl + "/client")
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<java.util.Map<String, Object>>() {})
                .block(java.time.Duration.ofSeconds(5));
            
            if (response != null && response.get("data") instanceof List) {
                List<?> dataList = (List<?>) response.get("data");
                List<UUID> eventIds = new java.util.ArrayList<>();
                for (Object item : dataList) {
                    if (item instanceof java.util.Map) {
                        java.util.Map<?, ?> map = (java.util.Map<?, ?>) item;
                        Object idObj = map.get("id");
                        if (idObj != null) {
                            eventIds.add(UUID.fromString(idObj.toString()));
                        }
                    }
                }
                return eventIds;
            }
        } catch (Exception e) {
            log.error("Failed to fetch client events from event-service: {}", e.getMessage());
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Failed to verify event ownership: " + e.getMessage());
        }
        return java.util.Collections.emptyList();
    }

    public List<AlbumResponseDto> getAllAlbums(UUID tenantId, UUID eventId) {
        com.eventos.gallery.config.UserPrincipal principal = getCurrentPrincipal();
        boolean isClient = principal != null && principal.getRoles() != null && principal.getRoles().toUpperCase().contains("CLIENT");

        if (isClient) {
            List<UUID> ownedEventIds = getClientEventIdsFromEventService(getCurrentAuthHeader());
            if (eventId != null) {
                if (!ownedEventIds.contains(eventId)) {
                    throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN, "Access to event albums denied");
                }
                List<com.eventos.gallery.repository.AlbumResponseProjection> albums = albumRepository.findAllWithStatsByTenantIdAndStatusAndEventId(tenantId, "PUBLISHED", eventId);
                return albums.stream().map(this::mapProjectionToResponseDto).collect(Collectors.toList());
            } else {
                if (ownedEventIds.isEmpty()) {
                    return new java.util.ArrayList<>();
                }
                List<com.eventos.gallery.repository.AlbumResponseProjection> albums = albumRepository.findAllWithStatsByTenantIdAndStatusAndEventIdIn(tenantId, "PUBLISHED", ownedEventIds);
                return albums.stream().map(this::mapProjectionToResponseDto).collect(Collectors.toList());
            }
        }

        List<com.eventos.gallery.repository.AlbumResponseProjection> albums;
        if (eventId != null) {
            albums = albumRepository.findAllWithStatsByTenantIdAndEventId(tenantId, eventId);
        } else {
            albums = albumRepository.findAllWithStatsByTenantId(tenantId);
        }

        return albums.stream()
                .map(this::mapProjectionToResponseDto)
                .collect(Collectors.toList());
    }

    public AlbumResponseDto getAlbum(UUID id, UUID tenantId) {
        Album album = albumRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + id));

        // Ownership guard for client role
        com.eventos.gallery.config.UserPrincipal principal = getCurrentPrincipal();
        if (principal != null && principal.getRoles() != null && principal.getRoles().toUpperCase().contains("CLIENT")) {
            if (album.getEventId() == null) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Access to unlinked album denied for client");
            }
            if (album.getStatus() != com.eventos.gallery.entity.AlbumStatus.PUBLISHED) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Access to non-published album denied for client");
            }
            List<UUID> ownedEventIds = getClientEventIdsFromEventService(getCurrentAuthHeader());
            if (!ownedEventIds.contains(album.getEventId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Access to album event denied");
            }
        }

        return mapToResponseDto(album);
    }

    @Transactional
    public AlbumResponseDto createAlbum(CreateAlbumDto dto, UUID tenantId) {
        Album album = Album.builder()
                .tenantId(tenantId)
                .name(dto.getName())
                .description(dto.getDescription())
                .eventId(dto.getEventId())
                .status(dto.getStatus() != null ? dto.getStatus() : com.eventos.gallery.entity.AlbumStatus.DRAFT)
                .visibility(dto.getVisibility() != null ? dto.getVisibility() : com.eventos.gallery.entity.AlbumVisibility.PUBLIC)
                .coverImage(dto.getCoverImage())
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
        album.setCoverImage(dto.getCoverImage());
        if (dto.getStatus() != null) {
            album.setStatus(dto.getStatus());
        }
        if (dto.getVisibility() != null) {
            album.setVisibility(dto.getVisibility());
        }

        Album saved = albumRepository.save(album);
        return mapToResponseDto(saved);
    }

    @Transactional
    public AlbumResponseDto archiveAlbum(UUID id, UUID tenantId) {
        Album album = albumRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + id));

        album.setStatus(com.eventos.gallery.entity.AlbumStatus.ARCHIVED);
        Album saved = albumRepository.save(album);
        return mapToResponseDto(saved);
    }

    @Transactional
    public void deleteAlbum(UUID id, UUID tenantId) {
        Album album = albumRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + id));

        List<GalleryItem> items = galleryItemRepository.findAllByTenantIdAndAlbumId(tenantId, id);
        
        List<AlbumDeletedEvent.DeletedItemInfo> itemInfos = items.stream()
                .map(item -> new AlbumDeletedEvent.DeletedItemInfo(
                        item.getPublicId(),
                        com.eventos.gallery.entity.GalleryItemType.VIDEO.equals(item.getType())
                ))
                .collect(Collectors.toList());

        // JPA Cascaded delete (triggered via foreign key constraint, or handled manually here)
        galleryItemRepository.deleteAll(items);
        albumRepository.delete(album);

        eventPublisher.publishEvent(new AlbumDeletedEvent(this, tenantId, id, itemInfos));
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
                .coverImage(album.getCoverImage())
                .status(album.getStatus())
                .visibility(album.getVisibility())
                .build();
    }

    public List<AlbumResponseDto> getClientAlbums(UUID tenantId, List<UUID> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) {
            return new java.util.ArrayList<>();
        }

        // Ownership guard for client role
        com.eventos.gallery.config.UserPrincipal principal = getCurrentPrincipal();
        if (principal != null && principal.getRoles() != null && principal.getRoles().toUpperCase().contains("CLIENT")) {
            List<UUID> ownedEventIds = getClientEventIdsFromEventService(getCurrentAuthHeader());
            for (UUID requestedId : eventIds) {
                if (!ownedEventIds.contains(requestedId)) {
                    throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN, "Access to event album denied");
                }
            }
        }

        List<com.eventos.gallery.repository.AlbumResponseProjection> albums = albumRepository.findAllWithStatsByTenantIdAndStatusAndEventIdIn(tenantId, "PUBLISHED", eventIds);
        return albums.stream()
                .map(this::mapProjectionToResponseDto)
                .collect(Collectors.toList());
    }

    private AlbumResponseDto mapProjectionToResponseDto(com.eventos.gallery.repository.AlbumResponseProjection projection) {
        com.eventos.gallery.entity.AlbumStatus statusVal = null;
        if (projection.getStatus() != null) {
            statusVal = com.eventos.gallery.entity.AlbumStatus.valueOf(projection.getStatus());
        }
        com.eventos.gallery.entity.AlbumVisibility visibilityVal = null;
        if (projection.getVisibility() != null) {
            visibilityVal = com.eventos.gallery.entity.AlbumVisibility.valueOf(projection.getVisibility());
        }

        return AlbumResponseDto.builder()
                .id(projection.getId())
                .tenantId(projection.getTenantId())
                .name(projection.getName())
                .description(projection.getDescription())
                .eventId(projection.getEventId())
                .createdAt(projection.getCreatedAt())
                .updatedAt(projection.getUpdatedAt())
                .itemCount(projection.getItemCount())
                .thumbnailUrl(projection.getThumbnailUrl())
                .coverImage(projection.getCoverImage())
                .status(statusVal)
                .visibility(visibilityVal)
                .build();
    }
}
