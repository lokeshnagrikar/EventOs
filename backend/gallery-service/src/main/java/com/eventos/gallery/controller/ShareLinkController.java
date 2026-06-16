package com.eventos.gallery.controller;

import com.eventos.gallery.dto.CreateShareLinkDto;
import com.eventos.gallery.dto.ShareLinkResponseDto;
import com.eventos.gallery.dto.SharedAlbumResponseDto;
import com.eventos.gallery.service.ShareLinkService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/share")
public class ShareLinkController {

    private final ShareLinkService shareLinkService;

    public ShareLinkController(ShareLinkService shareLinkService) {
        this.shareLinkService = shareLinkService;
    }

    @PostMapping
    public ResponseEntity<?> createShareLink(
            @Valid @RequestBody CreateShareLinkDto dto,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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
    public ResponseEntity<?> getShareLinksForAlbum(
            @PathVariable UUID albumId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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
    public ResponseEntity<?> revokeShareLink(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        try {
            UUID tenantId = getTenantId(tenantIdHeader);
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

    // Public Endpoint: Retrieve shared album with optional passcode protection
    @GetMapping("/public/view/{token}")
    public ResponseEntity<?> getSharedAlbum(
            @PathVariable String token,
            @RequestParam(value = "passcode", required = false) String passcode,
            @RequestHeader(value = "X-Gallery-Passcode", required = false) String passcodeHeader) {
        try {
            String activePasscode = (passcode != null && !passcode.trim().isEmpty()) 
                    ? passcode 
                    : passcodeHeader;

            SharedAlbumResponseDto album = shareLinkService.getSharedAlbum(token, activePasscode);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", album);

            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            String code = "passcode".equalsIgnoreCase(e.getMessage()) || "Passcode required".equalsIgnoreCase(e.getMessage())
                    ? "PASSCODE_REQUIRED" 
                    : "INVALID_PASSCODE";
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse(code, e.getMessage()));
        } catch (IllegalArgumentException e) {
            String code = e.getMessage().contains("expired") ? "LINK_EXPIRED" : "NOT_FOUND";
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(createErrorResponse(code, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("FETCH_FAILED", e.getMessage()));
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
