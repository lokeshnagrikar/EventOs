package com.eventos.gallery.controller;

import com.eventos.gallery.dto.GalleryItemResponseDto;
import com.eventos.gallery.dto.ConfirmUploadDto;
import com.eventos.gallery.dto.SignedUploadRequestDto;
import com.eventos.gallery.dto.SignedUploadResponseDto;
import com.eventos.gallery.service.GalleryItemService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getItemsByAlbum(
            @PathVariable UUID albumId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Boolean favorite,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            List<GalleryItemResponseDto> items = galleryItemService.getItemsByAlbum(albumId, tenantId, category, tag, favorite);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", items);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @PostMapping("/signed-upload-params")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getSignedUploadParams(
            @jakarta.validation.Valid @RequestBody SignedUploadRequestDto dto,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            SignedUploadResponseDto params = galleryItemService.generateUploadSignature(
                    dto.getAlbumId(), dto.getName(), tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", params);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("SIGNATURE_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/confirm-upload")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> confirmUpload(
            @jakarta.validation.Valid @RequestBody ConfirmUploadDto dto,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            GalleryItemResponseDto item = galleryItemService.confirmUpload(dto, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", item);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse("BAD_REQUEST", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("CONFIRM_FAILED", e.getMessage()));
        }
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> uploadItem(
            @RequestParam("file") MultipartFile file,
            @RequestParam("albumId") UUID albumId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
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
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> deleteItem(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
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

    @PatchMapping("/{id}/favorite")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> toggleFavorite(
            @PathVariable UUID id,
            @RequestParam(required = false) Boolean favorite,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            GalleryItemResponseDto item = galleryItemService.toggleFavorite(id, favorite, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", item);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("FAVORITE_FAILED", e.getMessage()));
        }
    }

    @PutMapping("/{id}/organization")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> updateOrganization(
            @PathVariable UUID id,
            @jakarta.validation.Valid @RequestBody com.eventos.gallery.dto.UpdateOrganizationDto dto,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            GalleryItemResponseDto item = galleryItemService.updateOrganization(id, dto, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", item);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("UPDATE_ORGANIZATION_FAILED", e.getMessage()));
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
