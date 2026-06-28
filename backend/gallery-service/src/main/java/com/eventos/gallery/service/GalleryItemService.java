package com.eventos.gallery.service;

import com.eventos.gallery.dto.GalleryItemResponseDto;
import com.eventos.gallery.dto.ConfirmUploadDto;
import com.eventos.gallery.dto.SignedUploadResponseDto;
import com.eventos.gallery.entity.Album;
import com.eventos.gallery.entity.GalleryItem;
import com.eventos.gallery.entity.GalleryItemType;
import com.eventos.gallery.repository.AlbumRepository;
import com.eventos.gallery.repository.GalleryItemRepository;
import com.eventos.gallery.event.MediaDeletedEvent;
import com.eventos.gallery.config.MessagingConfig;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class GalleryItemService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GalleryItemService.class);

    @org.springframework.beans.factory.annotation.Value("${service.event.base-url:http://localhost:8083/api/v1/events}")
    private String eventServiceBaseUrl;

    private final org.springframework.web.reactive.function.client.WebClient webClient = 
        org.springframework.web.reactive.function.client.WebClient.builder().build();

    private final GalleryItemRepository galleryItemRepository;
    private final AlbumRepository albumRepository;
    private final CloudinaryService cloudinaryService;
    private final RabbitTemplate rabbitTemplate;

    public GalleryItemService(GalleryItemRepository galleryItemRepository, 
                              AlbumRepository albumRepository, 
                              CloudinaryService cloudinaryService,
                              RabbitTemplate rabbitTemplate) {
        this.galleryItemRepository = galleryItemRepository;
        this.albumRepository = albumRepository;
        this.cloudinaryService = cloudinaryService;
        this.rabbitTemplate = rabbitTemplate;
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

    public List<GalleryItemResponseDto> getItemsByAlbum(UUID albumId, UUID tenantId) {
        return getItemsByAlbum(albumId, tenantId, null, null, null);
    }

    public List<GalleryItemResponseDto> getItemsByAlbum(UUID albumId, UUID tenantId, String category, String tag, Boolean favorite) {
        // Verify album exists for tenant
        Album album = albumRepository.findByIdAndTenantId(albumId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + albumId));

        // Ownership guard for CLIENT role
        com.eventos.gallery.config.UserPrincipal principal = getCurrentPrincipal();
        if (principal != null && principal.getRoles() != null && principal.getRoles().toUpperCase().contains("CLIENT")) {
            if (album.getEventId() == null) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Access to unlinked album denied for client");
            }
            List<UUID> ownedEventIds = getClientEventIdsFromEventService(getCurrentAuthHeader());
            if (!ownedEventIds.contains(album.getEventId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Access to album event media denied");
            }
        }

        List<GalleryItem> items;
        if (category == null && tag == null && favorite == null) {
            items = galleryItemRepository.findAllByTenantIdAndAlbumId(tenantId, albumId);
        } else {
            items = galleryItemRepository.findFiltered(tenantId, albumId, category, tag, favorite);
        }
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
        Integer width = (Integer) uploadResult.get("width");
        Integer height = (Integer) uploadResult.get("height");
        String resourceType = (String) uploadResult.get("resource_type");

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
                .width(width)
                .height(height)
                .resourceType(resourceType)
                .build();

        GalleryItem saved = galleryItemRepository.save(item);
        return mapToResponseDto(saved);
    }

    @Transactional(readOnly = true)
    public SignedUploadResponseDto generateUploadSignature(UUID albumId, String filename, UUID tenantId) {
        Album album = albumRepository.findByIdAndTenantId(albumId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + albumId));

        Map<String, Object> sigParams = cloudinaryService.generateUploadSignature(tenantId, albumId, album.getEventId(), filename);

        return SignedUploadResponseDto.builder()
                .signature((String) sigParams.get("signature"))
                .timestamp((Long) sigParams.get("timestamp"))
                .apiKey((String) sigParams.get("apiKey"))
                .cloudName((String) sigParams.get("cloudName"))
                .publicId((String) sigParams.get("publicId"))
                .folder((String) sigParams.get("folder"))
                .uploadUrl((String) sigParams.get("uploadUrl"))
                .build();
    }

    @Transactional
    public GalleryItemResponseDto confirmUpload(ConfirmUploadDto dto, UUID tenantId) {
        Album album = albumRepository.findByIdAndTenantId(dto.getAlbumId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + dto.getAlbumId()));

        GalleryItem item = GalleryItem.builder()
                .tenantId(tenantId)
                .album(album)
                .name(dto.getName())
                .type(dto.getType())
                .url(dto.getUrl())
                .publicId(dto.getPublicId())
                .size(dto.getSize())
                .format(dto.getFormat())
                .duration(dto.getDuration())
                .width(dto.getWidth())
                .height(dto.getHeight())
                .resourceType(dto.getResourceType())
                .category(dto.getCategory())
                .favorite(dto.getFavorite() != null ? dto.getFavorite() : false)
                .tags(dto.getTags() != null ? dto.getTags() : new java.util.HashSet<>())
                .build();

        GalleryItem saved = galleryItemRepository.save(item);
        return mapToResponseDto(saved);
    }

    @Transactional
    public void deleteItem(UUID id, UUID tenantId) {
        GalleryItem item = galleryItemRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Media item not found with ID: " + id));

        // Delete from DB
        galleryItemRepository.delete(item);

        // Publish to RabbitMQ for async cleanup
        if (item.getPublicId() != null && !item.getPublicId().trim().isEmpty()) {
            try {
                MediaDeletedEvent.DeletedItemInfo itemInfo = MediaDeletedEvent.DeletedItemInfo.builder()
                        .publicId(item.getPublicId())
                        .isVideo(GalleryItemType.VIDEO.equals(item.getType()))
                        .build();

                MediaDeletedEvent event = MediaDeletedEvent.builder()
                        .tenantId(tenantId)
                        .items(List.of(itemInfo))
                        .build();

                rabbitTemplate.convertAndSend(MessagingConfig.EXCHANGE, MessagingConfig.CLEANUP_ROUTING_KEY, event);
                log.info("Published async Cloudinary deletion event for item: {}", item.getPublicId());
            } catch (Exception e) {
                log.error("Failed to publish media cleanup event to RabbitMQ for item: {}", item.getPublicId(), e);
            }
        }
    }

    public GalleryItemResponseDto mapToResponseDto(GalleryItem item) {
        String url = item.getUrl();
        if (item.getPublicId() != null && !item.getPublicId().startsWith("mock_")) {
            try {
                String optimizedUrl = cloudinaryService.getOptimizedUrl(item.getPublicId(), GalleryItemType.VIDEO.equals(item.getType()));
                if (optimizedUrl != null) {
                    url = optimizedUrl;
                }
            } catch (Exception e) {
                log.warn("Failed to generate optimized Cloudinary URL: {}", e.getMessage());
            }
        }
        return GalleryItemResponseDto.builder()
                .id(item.getId())
                .tenantId(item.getTenantId())
                .albumId(item.getAlbum().getId())
                .name(item.getName())
                .type(item.getType())
                .url(url)
                .publicId(item.getPublicId())
                .size(item.getSize())
                .format(item.getFormat())
                .duration(item.getDuration())
                .width(item.getWidth())
                .height(item.getHeight())
                .resourceType(item.getResourceType())
                .category(item.getCategory())
                .favorite(item.isFavorite())
                .tags(item.getTags() != null ? new java.util.HashSet<>(item.getTags()) : new java.util.HashSet<>())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    @Transactional
    public GalleryItemResponseDto toggleFavorite(UUID id, Boolean favorite, UUID tenantId) {
        GalleryItem item = galleryItemRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Media item not found with ID: " + id));

        boolean newFavorite = (favorite == null) ? !item.isFavorite() : favorite;
        item.setFavorite(newFavorite);
        GalleryItem saved = galleryItemRepository.save(item);
        return mapToResponseDto(saved);
    }

    @Transactional
    public GalleryItemResponseDto updateOrganization(UUID id, com.eventos.gallery.dto.UpdateOrganizationDto dto, UUID tenantId) {
        GalleryItem item = galleryItemRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Media item not found with ID: " + id));

        item.setCategory(dto.getCategory());
        item.setTags(dto.getTags() != null ? new java.util.HashSet<>(dto.getTags()) : new java.util.HashSet<>());
        GalleryItem saved = galleryItemRepository.save(item);
        return mapToResponseDto(saved);
    }

    public byte[] downloadFileBytes(String urlString) {
        if (urlString == null || urlString.trim().isEmpty() || urlString.startsWith("mock_")) {
            return "mock media content bytes".getBytes();
        }
        try {
            return webClient.get()
                    .uri(urlString)
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .block(java.time.Duration.ofSeconds(10));
        } catch (Exception e) {
            log.warn("WebClient download failed for {}, falling back to simple URL stream. Error: {}", urlString, e.getMessage());
            try (java.io.InputStream in = new java.net.URL(urlString).openStream()) {
                return in.readAllBytes();
            } catch (Exception ex) {
                throw new RuntimeException("HTTP download failed: " + ex.getMessage(), ex);
            }
        }
    }
}
