package com.eventos.gallery.service;

import com.eventos.gallery.dto.CreateShareLinkDto;
import com.eventos.gallery.dto.GalleryItemResponseDto;
import com.eventos.gallery.dto.ShareLinkResponseDto;
import com.eventos.gallery.dto.SharedAlbumResponseDto;
import com.eventos.gallery.entity.Album;
import com.eventos.gallery.entity.GalleryItem;
import com.eventos.gallery.entity.ShareLink;
import com.eventos.gallery.repository.AlbumRepository;
import com.eventos.gallery.repository.GalleryItemRepository;
import com.eventos.gallery.repository.ShareLinkRepository;
import com.eventos.gallery.repository.ShareLinkAccessLogRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class ShareLinkService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ShareLinkService.class);

    private final ShareLinkRepository shareLinkRepository;
    private final AlbumRepository albumRepository;
    private final GalleryItemRepository galleryItemRepository;
    private final GalleryItemService galleryItemService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final ShareLinkAccessLogRepository shareLinkAccessLogRepository;

    public ShareLinkService(ShareLinkRepository shareLinkRepository,
                            AlbumRepository albumRepository,
                            GalleryItemRepository galleryItemRepository,
                            GalleryItemService galleryItemService,
                            ShareLinkAccessLogRepository shareLinkAccessLogRepository) {
        this.shareLinkRepository = shareLinkRepository;
        this.albumRepository = albumRepository;
        this.galleryItemRepository = galleryItemRepository;
        this.galleryItemService = galleryItemService;
        this.shareLinkAccessLogRepository = shareLinkAccessLogRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Transactional
    public ShareLinkResponseDto createShareLink(CreateShareLinkDto dto, UUID tenantId) {
        Album album = albumRepository.findByIdAndTenantId(dto.getAlbumId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + dto.getAlbumId()));

        String token = UUID.randomUUID().toString().replace("-", "");
        
        java.time.Instant expiresAt = null;
        if (dto.getExpiresAt() != null) {
            expiresAt = dto.getExpiresAt();
        } else if (dto.getExpiresInHours() != null && dto.getExpiresInHours() > 0) {
            expiresAt = java.time.Instant.now().plus(dto.getExpiresInHours(), java.time.temporal.ChronoUnit.HOURS);
        }

        String hashedPassword = null;
        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            hashedPassword = passwordEncoder.encode(dto.getPassword().trim());
        }

        boolean allowDownload = dto.getAllowDownload() == null || dto.getAllowDownload();

        ShareLink shareLink = ShareLink.builder()
                .tenantId(tenantId)
                .album(album)
                .token(token)
                .expiresAt(expiresAt)
                .password(hashedPassword)
                .allowDownload(allowDownload)
                .build();

        ShareLink saved = shareLinkRepository.save(shareLink);
        return mapToResponseDto(saved);
    }

    public List<ShareLinkResponseDto> getShareLinksForAlbum(UUID albumId, UUID tenantId) {
        albumRepository.findByIdAndTenantId(albumId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + albumId));

        return shareLinkRepository.findAllByTenantIdAndAlbumId(tenantId, albumId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void revokeShareLink(UUID id, UUID tenantId) {
        ShareLink shareLink = shareLinkRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Share link not found with ID: " + id));
        shareLinkRepository.delete(shareLink);
    }

    @Transactional
    public SharedAlbumResponseDto getSharedAlbum(String token, String passcode, String ipAddress, String userAgent) {
        ShareLink shareLink = null;
        try {
            shareLink = shareLinkRepository.findByToken(token)
                    .orElseThrow(() -> new IllegalArgumentException("Share link not found or invalid"));

            if (shareLink.isExpired()) {
                throw new IllegalArgumentException("This share link has expired");
            }

            // Check password protection
            if (shareLink.getPassword() != null && !shareLink.getPassword().isEmpty()) {
                if (passcode == null || passcode.trim().isEmpty()) {
                    throw new BadCredentialsException("Passcode required");
                }
                if (!passwordEncoder.matches(passcode.trim(), shareLink.getPassword())) {
                    throw new BadCredentialsException("Invalid passcode");
                }
            }

            Album album = shareLink.getAlbum();
            if (album.getStatus() != com.eventos.gallery.entity.AlbumStatus.PUBLISHED) {
                throw new IllegalArgumentException("This album is not published");
            }
            List<GalleryItem> items = galleryItemRepository.findAllByTenantIdAndAlbumId(shareLink.getTenantId(), album.getId());
            
            List<GalleryItemResponseDto> itemDtos = items.stream()
                    .map(galleryItemService::mapToResponseDto)
                    .collect(Collectors.toList());

            // Log success access attempt
            recordAccessLog(token, shareLink, true, null, ipAddress, userAgent);

            return SharedAlbumResponseDto.builder()
                    .albumId(album.getId())
                    .name(album.getName())
                    .description(album.getDescription())
                    .eventId(album.getEventId())
                    .allowDownload(shareLink.isAllowDownload())
                    .items(itemDtos)
                    .build();

        } catch (BadCredentialsException e) {
            String reason = "Passcode required".equalsIgnoreCase(e.getMessage()) ? "PASSCODE_REQUIRED" : "INVALID_PASSCODE";
            recordAccessLog(token, shareLink, false, reason, ipAddress, userAgent);
            throw e;
        } catch (IllegalArgumentException e) {
            String reason;
            if (e.getMessage().contains("not found") || e.getMessage().contains("invalid")) {
                reason = "INVALID_TOKEN";
            } else if (e.getMessage().contains("expired")) {
                reason = "LINK_EXPIRED";
            } else if (e.getMessage().contains("not published")) {
                reason = "ALBUM_NOT_PUBLISHED";
            } else {
                reason = "VALIDATION_FAILED";
            }
            recordAccessLog(token, shareLink, false, reason, ipAddress, userAgent);
            throw e;
        } catch (Exception e) {
            recordAccessLog(token, shareLink, false, "UNKNOWN_ERROR: " + e.getMessage(), ipAddress, userAgent);
            throw e;
        }
    }

    public SharedAlbumResponseDto getSharedAlbum(String token, String passcode) {
        return getSharedAlbum(token, passcode, null, null);
    }

    @Transactional
    public void recordAccessLog(String token, ShareLink shareLink, boolean success, String failureReason, String ip, String ua) {
        UUID logTenantId = shareLink != null ? shareLink.getTenantId() : UUID.fromString("00000000-0000-0000-0000-000000000000");
        com.eventos.gallery.entity.ShareLinkAccessLog logEntry = com.eventos.gallery.entity.ShareLinkAccessLog.builder()
                .tenantId(logTenantId)
                .shareLink(shareLink)
                .token(token)
                .ipAddress(ip)
                .userAgent(ua)
                .success(success)
                .failureReason(failureReason)
                .build();
        shareLinkAccessLogRepository.save(logEntry);
        log.info("Access attempt logged: token={}, success={}, reason={}, ip={}, ua={}", token, success, failureReason, ip, ua);
    }

    public List<com.eventos.gallery.entity.ShareLinkAccessLog> getAccessLogs(String token, UUID tenantId) {
        if (tenantId != null) {
            return shareLinkAccessLogRepository.findAllByTenantIdAndToken(tenantId, token);
        }
        return shareLinkAccessLogRepository.findAllByToken(token);
    }

    public ShareLinkResponseDto mapToResponseDto(ShareLink shareLink) {
        return ShareLinkResponseDto.builder()
                .id(shareLink.getId())
                .albumId(shareLink.getAlbum().getId())
                .token(shareLink.getToken())
                .expiresAt(shareLink.getExpiresAt())
                .passwordProtected(shareLink.getPassword() != null && !shareLink.getPassword().isEmpty())
                .createdAt(shareLink.getCreatedAt())
                .expired(shareLink.isExpired())
                .allowDownload(shareLink.isAllowDownload())
                .build();
    }

    public byte[] downloadFileBytes(String url) {
        return galleryItemService.downloadFileBytes(url);
    }
}
