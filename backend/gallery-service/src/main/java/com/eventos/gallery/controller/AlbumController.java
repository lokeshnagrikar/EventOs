package com.eventos.gallery.controller;

import com.eventos.gallery.dto.AlbumResponseDto;
import com.eventos.gallery.dto.CreateAlbumDto;
import com.eventos.gallery.dto.GalleryItemResponseDto;
import com.eventos.gallery.service.AlbumService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/albums")
public class AlbumController {

    private final AlbumService albumService;
    private final com.eventos.gallery.service.GalleryItemService galleryItemService;

    public AlbumController(AlbumService albumService, com.eventos.gallery.service.GalleryItemService galleryItemService) {
        this.albumService = albumService;
        this.galleryItemService = galleryItemService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getAlbums(
            @RequestParam(value = "eventId", required = false) UUID eventId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId();
        List<AlbumResponseDto> albums = albumService.getAllAlbums(tenantId, eventId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", albums);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getAlbumById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            AlbumResponseDto album = albumService.getAlbum(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", album);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> createAlbum(
            @Valid @RequestBody CreateAlbumDto dto,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            AlbumResponseDto album = albumService.createAlbum(dto, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", album);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("CREATE_FAILED", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> updateAlbum(
            @PathVariable UUID id,
            @Valid @RequestBody CreateAlbumDto dto,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            AlbumResponseDto album = albumService.updateAlbum(id, dto, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", album);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("UPDATE_FAILED", e.getMessage()));
        }
    }

    @PutMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> archiveAlbum(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            AlbumResponseDto album = albumService.archiveAlbum(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", album);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("ARCHIVE_FAILED", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> deleteAlbum(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            albumService.deleteAlbum(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Album and its media items deleted successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("DELETE_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/client")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getClientAlbums(
            @RequestParam(value = "eventIds") List<UUID> eventIds,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId();
        List<AlbumResponseDto> albums = albumService.getClientAlbums(tenantId, eventIds);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", albums);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{albumId}/download")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody> downloadAlbum(
            @PathVariable UUID albumId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            // Verify access & get album metadata
            AlbumResponseDto album = albumService.getAlbum(albumId, tenantId);

            // Fetch items
            List<GalleryItemResponseDto> items = galleryItemService.getItemsByAlbum(albumId, tenantId, null, null, null);

            org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody stream = outputStream -> {
                try (java.util.zip.ZipOutputStream zipOut = new java.util.zip.ZipOutputStream(outputStream)) {
                    java.util.Set<String> entryNames = new java.util.HashSet<>();
                    for (GalleryItemResponseDto item : items) {
                        String name = item.getName();
                        if (name == null || name.trim().isEmpty()) {
                            name = item.getId().toString() + (com.eventos.gallery.entity.GalleryItemType.VIDEO.equals(item.getType()) ? ".mp4" : ".jpg");
                        }
                        // Deduplicate
                        String baseName = name;
                        int extIndex = baseName.lastIndexOf('.');
                        String nameWithoutExt = extIndex > 0 ? baseName.substring(0, extIndex) : baseName;
                        String ext = extIndex > 0 ? baseName.substring(extIndex) : "";
                        int counter = 1;
                        while (entryNames.contains(name)) {
                            name = nameWithoutExt + "_" + counter + ext;
                            counter++;
                        }
                        entryNames.add(name);

                        java.util.zip.ZipEntry zipEntry = new java.util.zip.ZipEntry(name);
                        zipOut.putNextEntry(zipEntry);

                        try {
                            byte[] fileBytes = galleryItemService.downloadFileBytes(item.getUrl());
                            zipOut.write(fileBytes);
                        } catch (Exception e) {
                            zipOut.write(("Failed to download media item: " + item.getName() + " (URL: " + item.getUrl() + "). Error: " + e.getMessage()).getBytes());
                        }
                        zipOut.closeEntry();
                    }
                    zipOut.finish();
                }
            };

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + album.getName() + ".zip\"")
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/zip")
                    .body(stream);
        } catch (IllegalArgumentException e) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    private UUID getTenantId() {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.gallery.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.gallery.config.UserPrincipal) auth.getPrincipal()).getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.UNAUTHORIZED, "Tenant ID context is missing or unauthenticated");
    }

    private Map<String, Object> createErrorResponse(String code, String message) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("code", code);
        errorDetails.put("message", message);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", errorDetails);

        return errorResponse;
    }
}
