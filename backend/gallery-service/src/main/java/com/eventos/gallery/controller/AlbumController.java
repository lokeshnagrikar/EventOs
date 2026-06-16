package com.eventos.gallery.controller;

import com.eventos.gallery.dto.AlbumResponseDto;
import com.eventos.gallery.dto.CreateAlbumDto;
import com.eventos.gallery.service.AlbumService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/albums")
public class AlbumController {

    private final AlbumService albumService;

    public AlbumController(AlbumService albumService) {
        this.albumService = albumService;
    }

    @GetMapping
    public ResponseEntity<?> getAlbums(
            @RequestParam(value = "eventId", required = false) UUID eventId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        List<AlbumResponseDto> albums = albumService.getAllAlbums(tenantId, eventId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", albums);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAlbumById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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
    public ResponseEntity<?> createAlbum(
            @Valid @RequestBody CreateAlbumDto dto,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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
    public ResponseEntity<?> updateAlbum(
            @PathVariable UUID id,
            @Valid @RequestBody CreateAlbumDto dto,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAlbum(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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
    public ResponseEntity<?> getClientAlbums(
            @RequestParam(value = "eventIds") List<UUID> eventIds,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        List<AlbumResponseDto> albums = albumService.getClientAlbums(tenantId, eventIds);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", albums);

        return ResponseEntity.ok(response);
    }

    private UUID getTenantId(String header) {
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.gallery.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.gallery.config.UserPrincipal) auth.getPrincipal()).getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        if (header != null && !header.isEmpty()) {
            return UUID.fromString(header);
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.BAD_REQUEST, "Tenant ID context is missing");
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
