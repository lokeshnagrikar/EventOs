package com.eventos.gallery.controller;

import com.eventos.gallery.dto.CreateShareLinkDto;
import com.eventos.gallery.dto.GalleryItemResponseDto;
import com.eventos.gallery.dto.ShareLinkResponseDto;
import com.eventos.gallery.dto.SharedAlbumResponseDto;
import com.eventos.gallery.exception.RateLimitExceededException;
import com.eventos.gallery.exception.ShareLinkExpiredException;
import com.eventos.gallery.exception.ShareLinkRevokedException;
import com.eventos.gallery.security.ClientIpResolver;
import com.eventos.gallery.service.ShareLinkService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/share")
public class ShareLinkController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ShareLinkController.class);

    private final ShareLinkService shareLinkService;
    private final ClientIpResolver clientIpResolver;

    @Autowired
    public ShareLinkController(ShareLinkService shareLinkService, ClientIpResolver clientIpResolver) {
        this.shareLinkService = shareLinkService;
        this.clientIpResolver = clientIpResolver != null ? clientIpResolver : new ClientIpResolver(null);
    }

    public ShareLinkController(ShareLinkService shareLinkService) {
        this(shareLinkService, new ClientIpResolver(null));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> createShareLink(
            @Valid @RequestBody CreateShareLinkDto dto,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            ShareLinkResponseDto responseDto = shareLinkService.createShareLink(dto, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", responseDto);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("CREATE_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/album/{albumId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT')")
    public ResponseEntity<?> getShareLinksForAlbum(
            @PathVariable UUID albumId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            List<ShareLinkResponseDto> links = shareLinkService.getShareLinksForAlbum(albumId, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", links);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> revokeShareLink(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId();
            shareLinkService.revokeShareLink(id, tenantId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Share link revoked successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    // Public Endpoint: Retrieve shared album with optional passcode or session token
    @GetMapping({"/public/view/{token}", "/public/{token}/view"})
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> getSharedAlbum(
            @PathVariable String token,
            @RequestParam(value = "passcode", required = false) String passcode,
            @RequestHeader(value = "X-Gallery-Passcode", required = false) String passcodeHeader,
            @RequestHeader(value = "X-Share-Session-Token", required = false) String sessionTokenHeader,
            @RequestParam(value = "sessionToken", required = false) String sessionTokenParam,
            HttpServletRequest request) {
        try {
            String activePasscode = (passcode != null && !passcode.trim().isEmpty()) ? passcode : passcodeHeader;
            String activeSessionToken = (sessionTokenHeader != null && !sessionTokenHeader.trim().isEmpty())
                    ? sessionTokenHeader : sessionTokenParam;

            String ipAddress = clientIpResolver.resolveClientIp(request);
            String userAgent = request.getHeader("User-Agent");

            SharedAlbumResponseDto album = shareLinkService.getSharedAlbum(
                    token, activePasscode, activeSessionToken, ipAddress, userAgent);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", album);

            return ResponseEntity.ok(response);
        } catch (RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                    .body(createErrorResponse("TOO_MANY_REQUESTS", e.getMessage()));
        } catch (ShareLinkRevokedException e) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(createErrorResponse("LINK_REVOKED", e.getMessage()));
        } catch (ShareLinkExpiredException e) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(createErrorResponse("LINK_EXPIRED", e.getMessage()));
        } catch (BadCredentialsException e) {
            String code = "passcode".equalsIgnoreCase(e.getMessage())
                    || "Passcode required".equalsIgnoreCase(e.getMessage())
                    ? "PASSCODE_REQUIRED"
                    : "INVALID_PASSCODE";
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse(code, e.getMessage()));
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("not published")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("ALBUM_NOT_PUBLISHED", e.getMessage()));
            }
            String code = e.getMessage().contains("expired") ? "LINK_EXPIRED"
                    : (e.getMessage().contains("revoked") ? "LINK_REVOKED" : "NOT_FOUND");
            HttpStatus status = (e.getMessage().contains("expired") || e.getMessage().contains("revoked"))
                    ? HttpStatus.GONE
                    : HttpStatus.NOT_FOUND;
            return ResponseEntity.status(status).body(createErrorResponse(code, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("FETCH_FAILED", e.getMessage()));
        }
    }

    // Public Endpoint: Streaming ZIP bulk download (requires verified session or passcode)
    @GetMapping({"/public/download/{token}", "/public/{token}/download"})
    @PreAuthorize("permitAll()")
    public ResponseEntity<org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody> downloadSharedAlbum(
            @PathVariable String token,
            @RequestParam(required = false) String passcode,
            @RequestHeader(value = "X-Gallery-Passcode", required = false) String passcodeHeader,
            @RequestHeader(value = "X-Share-Session-Token", required = false) String sessionTokenHeader,
            @RequestParam(value = "sessionToken", required = false) String sessionTokenParam,
            HttpServletRequest request) {
        try {
            String activePasscode = (passcode != null && !passcode.trim().isEmpty()) ? passcode : passcodeHeader;
            String activeSessionToken = (sessionTokenHeader != null && !sessionTokenHeader.trim().isEmpty())
                    ? sessionTokenHeader : sessionTokenParam;

            String ipAddress = clientIpResolver.resolveClientIp(request);
            String userAgent = request.getHeader("User-Agent");

            // Validate credentials (enforces token validation, expiration, revocation, and passcode/session token)
            SharedAlbumResponseDto album = shareLinkService.getSharedAlbum(
                    token, activePasscode, activeSessionToken, ipAddress, userAgent);

            if (!album.isAllowDownload()) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Downloading is not allowed for this share link");
            }

            List<GalleryItemResponseDto> items = album.getItems();

            org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody stream = outputStream -> {
                try (java.util.zip.ZipOutputStream zipOut = new java.util.zip.ZipOutputStream(outputStream)) {
                    java.util.Set<String> entryNames = new java.util.HashSet<>();
                    for (GalleryItemResponseDto item : items) {
                        String name = item.getName();
                        if (name == null || name.trim().isEmpty()) {
                            name = item.getId().toString()
                                    + (com.eventos.gallery.entity.GalleryItemType.VIDEO.equals(item.getType()) ? ".mp4" : ".jpg");
                        }
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

                        try {
                            byte[] fileBytes = shareLinkService.downloadFileBytes(item.getUrl());
                            if (fileBytes != null && fileBytes.length > 0) {
                                java.util.zip.ZipEntry zipEntry = new java.util.zip.ZipEntry(name);
                                zipOut.putNextEntry(zipEntry);
                                zipOut.write(fileBytes);
                                zipOut.closeEntry();
                            }
                        } catch (Exception e) {
                            log.error("Failed to download media item: {} (URL: {}). Error: {}", item.getName(), item.getUrl(), e.getMessage());
                        }
                    }
                    zipOut.finish();
                }
            };

            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + album.getName() + ".zip\"")
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/zip")
                    .body(stream);
        } catch (RateLimitExceededException e) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, e.getMessage());
        } catch (ShareLinkRevokedException | ShareLinkExpiredException e) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.GONE, e.getMessage());
        } catch (BadCredentialsException e) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalArgumentException e) {
            HttpStatus status = e.getMessage().contains("not published")
                    ? HttpStatus.FORBIDDEN
                    : (e.getMessage().contains("expired") || e.getMessage().contains("revoked")
                    ? HttpStatus.GONE
                    : HttpStatus.NOT_FOUND);
            throw new org.springframework.web.server.ResponseStatusException(status, e.getMessage());
        }
    }

    // Public Endpoint: Retrieve single media item (requires verified session or passcode if protected)
    @GetMapping({"/public/media/{token}/{itemId}", "/public/{token}/media/{itemId}"})
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> getSharedMediaItem(
            @PathVariable String token,
            @PathVariable UUID itemId,
            @RequestParam(required = false) String passcode,
            @RequestHeader(value = "X-Gallery-Passcode", required = false) String passcodeHeader,
            @RequestHeader(value = "X-Share-Session-Token", required = false) String sessionTokenHeader,
            @RequestParam(value = "sessionToken", required = false) String sessionTokenParam,
            HttpServletRequest request) {
        try {
            String activePasscode = (passcode != null && !passcode.trim().isEmpty()) ? passcode : passcodeHeader;
            String activeSessionToken = (sessionTokenHeader != null && !sessionTokenHeader.trim().isEmpty())
                    ? sessionTokenHeader : sessionTokenParam;

            String ipAddress = clientIpResolver.resolveClientIp(request);
            String userAgent = request.getHeader("User-Agent");

            GalleryItemResponseDto item = shareLinkService.getSharedMediaItem(
                    token, itemId, activePasscode, activeSessionToken, ipAddress, userAgent);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", item);

            return ResponseEntity.ok(response);
        } catch (RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                    .body(createErrorResponse("TOO_MANY_REQUESTS", e.getMessage()));
        } catch (ShareLinkRevokedException e) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(createErrorResponse("LINK_REVOKED", e.getMessage()));
        } catch (ShareLinkExpiredException e) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(createErrorResponse("LINK_EXPIRED", e.getMessage()));
        } catch (BadCredentialsException e) {
            String code = "passcode".equalsIgnoreCase(e.getMessage())
                    || "Passcode required".equalsIgnoreCase(e.getMessage())
                    ? "PASSCODE_REQUIRED"
                    : "INVALID_PASSCODE";
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse(code, e.getMessage()));
        } catch (IllegalArgumentException e) {
            HttpStatus status = e.getMessage().contains("not published") ? HttpStatus.FORBIDDEN : HttpStatus.NOT_FOUND;
            return ResponseEntity.status(status).body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    // Public Endpoint: Toggle item favorite by shared link viewer (requires verified session or passcode if protected)
    @PostMapping({"/public/favorite/{token}/{itemId}", "/public/{token}/favorite/{itemId}"})
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> toggleSharedFavorite(
            @PathVariable String token,
            @PathVariable UUID itemId,
            @RequestParam(required = false) Boolean favorite,
            @RequestParam(required = false) String passcode,
            @RequestHeader(value = "X-Gallery-Passcode", required = false) String passcodeHeader,
            @RequestHeader(value = "X-Share-Session-Token", required = false) String sessionTokenHeader,
            @RequestParam(value = "sessionToken", required = false) String sessionTokenParam,
            HttpServletRequest request) {
        try {
            String activePasscode = (passcode != null && !passcode.trim().isEmpty()) ? passcode : passcodeHeader;
            String activeSessionToken = (sessionTokenHeader != null && !sessionTokenHeader.trim().isEmpty())
                    ? sessionTokenHeader : sessionTokenParam;

            String ipAddress = clientIpResolver.resolveClientIp(request);
            String userAgent = request.getHeader("User-Agent");

            GalleryItemResponseDto item = shareLinkService.toggleSharedFavorite(
                    token, itemId, favorite, activePasscode, activeSessionToken, ipAddress, userAgent);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", item);

            return ResponseEntity.ok(response);
        } catch (RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                    .body(createErrorResponse("TOO_MANY_REQUESTS", e.getMessage()));
        } catch (ShareLinkRevokedException e) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(createErrorResponse("LINK_REVOKED", e.getMessage()));
        } catch (ShareLinkExpiredException e) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(createErrorResponse("LINK_EXPIRED", e.getMessage()));
        } catch (BadCredentialsException e) {
            String code = "passcode".equalsIgnoreCase(e.getMessage())
                    || "Passcode required".equalsIgnoreCase(e.getMessage())
                    ? "PASSCODE_REQUIRED"
                    : "INVALID_PASSCODE";
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse(code, e.getMessage()));
        } catch (IllegalArgumentException e) {
            HttpStatus status = e.getMessage().contains("not published") ? HttpStatus.FORBIDDEN : HttpStatus.NOT_FOUND;
            return ResponseEntity.status(status).body(createErrorResponse("NOT_FOUND", e.getMessage()));
        }
    }

    private UUID getTenantId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
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
