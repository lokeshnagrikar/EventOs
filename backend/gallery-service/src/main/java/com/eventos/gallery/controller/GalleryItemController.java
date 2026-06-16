package com.eventos.gallery.controller;

import com.eventos.gallery.dto.GalleryItemResponseDto;
import com.eventos.gallery.service.GalleryItemService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/items")
public class GalleryItemController {

    private final GalleryItemService galleryItemService;

    public GalleryItemController(GalleryItemService galleryItemService) {
        this.galleryItemService = galleryItemService;
    }

    @GetMapping("/album/{albumId}")
    public ResponseEntity<?> getItemsByAlbum(
            @PathVariable UUID albumId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
            List<GalleryItemResponseDto> items = galleryItemService.getItemsByAlbum(albumId, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", items);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadItem(
            @RequestParam("file") MultipartFile file,
            @RequestParam("albumId") UUID albumId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
            GalleryItemResponseDto item = galleryItemService.uploadItem(albumId, file, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", item);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("BAD_REQUEST", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("UPLOAD_FAILED", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItem(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
            galleryItemService.deleteItem(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Media item deleted successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("DELETE_FAILED", e.getMessage()));
        }
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
