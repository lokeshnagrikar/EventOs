package com.eventos.gallery.service;

import com.eventos.gallery.dto.CreateShareLinkDto;
import com.eventos.gallery.dto.GalleryItemResponseDto;
import com.eventos.gallery.dto.ShareLinkResponseDto;
import com.eventos.gallery.dto.SharedAlbumResponseDto;
import com.eventos.gallery.entity.Album;
import com.eventos.gallery.entity.GalleryItem;
import com.eventos.gallery.entity.ShareLink;
import com.eventos.gallery.exception.RateLimitExceededException;
import com.eventos.gallery.exception.ShareLinkExpiredException;
import com.eventos.gallery.exception.ShareLinkRevokedException;
import com.eventos.gallery.repository.AlbumRepository;
import com.eventos.gallery.repository.GalleryItemRepository;
import com.eventos.gallery.repository.ShareLinkAccessLogRepository;
import com.eventos.gallery.repository.ShareLinkRepository;
import com.eventos.gallery.security.ShareLinkRateLimiter;
import com.eventos.gallery.security.ShareSessionTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class ShareLinkService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ShareLinkService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ShareLinkRepository shareLinkRepository;
    private final AlbumRepository albumRepository;
    private final GalleryItemRepository galleryItemRepository;
    private final GalleryItemService galleryItemService;
    private final CloudinaryService cloudinaryService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final ShareLinkAccessLogRepository shareLinkAccessLogRepository;
    private final ShareLinkRateLimiter rateLimiter;
    private final ShareSessionTokenService sessionTokenService;

    @Value("${app.security.passcode-default-length:6}")
    private int defaultPasscodeLength = 6;

    @Autowired
    public ShareLinkService(ShareLinkRepository shareLinkRepository,
                            AlbumRepository albumRepository,
                            GalleryItemRepository galleryItemRepository,
                            GalleryItemService galleryItemService,
                            CloudinaryService cloudinaryService,
                            ShareLinkAccessLogRepository shareLinkAccessLogRepository,
                            ShareLinkRateLimiter rateLimiter,
                            ShareSessionTokenService sessionTokenService) {
        this.shareLinkRepository = shareLinkRepository;
        this.albumRepository = albumRepository;
        this.galleryItemRepository = galleryItemRepository;
        this.galleryItemService = galleryItemService;
        this.cloudinaryService = cloudinaryService;
        this.shareLinkAccessLogRepository = shareLinkAccessLogRepository;
        this.rateLimiter = rateLimiter != null ? rateLimiter : new ShareLinkRateLimiter();
        this.sessionTokenService = sessionTokenService != null ? sessionTokenService :
                new ShareSessionTokenService("9a4f2c8d7e6b5a3f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d");
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public ShareLinkService(ShareLinkRepository shareLinkRepository,
                            AlbumRepository albumRepository,
                            GalleryItemRepository galleryItemRepository,
                            GalleryItemService galleryItemService,
                            CloudinaryService cloudinaryService,
                            ShareLinkAccessLogRepository shareLinkAccessLogRepository) {
        this(shareLinkRepository, albumRepository, galleryItemRepository, galleryItemService,
                cloudinaryService, shareLinkAccessLogRepository, new ShareLinkRateLimiter(),
                new ShareSessionTokenService("9a4f2c8d7e6b5a3f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"));
    }

    /**
     * Generates a high-entropy share token with at least 128 bits of cryptographic randomness.
     */
    public static String generateHighEntropyToken() {
        byte[] tokenBytes = new byte[16]; // 16 bytes = 128 bits
        SECURE_RANDOM.nextBytes(tokenBytes);
        return HexFormat.of().formatHex(tokenBytes);
    }

    /**
     * Generates a secure numeric PIN passcode of the specified length (minimum 4, default 6).
     */
    public static String generateNumericPin(int length) {
        int pinLen = Math.max(4, Math.min(length, 16));
        StringBuilder sb = new StringBuilder(pinLen);
        for (int i = 0; i < pinLen; i++) {
            sb.append(SECURE_RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    @Transactional
    public ShareLinkResponseDto createShareLink(CreateShareLinkDto dto, UUID tenantId) {
        Album album = albumRepository.findByIdAndTenantId(dto.getAlbumId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + dto.getAlbumId()));

        String token = generateHighEntropyToken();

        java.time.Instant expiresAt = null;
        if (dto.getExpiresAt() != null) {
            expiresAt = dto.getExpiresAt();
        } else if (dto.getExpiresInHours() != null && dto.getExpiresInHours() > 0) {
            expiresAt = java.time.Instant.now().plus(dto.getExpiresInHours(), java.time.temporal.ChronoUnit.HOURS);
        }

        String rawPassword = null;
        String hashedPassword = null;

        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            rawPassword = dto.getPassword().trim();
            hashedPassword = passwordEncoder.encode(rawPassword);
        } else if (Boolean.TRUE.equals(dto.getGeneratePasscode())) {
            int length = (dto.getPasscodeLength() != null && dto.getPasscodeLength() >= 4)
                    ? dto.getPasscodeLength()
                    : defaultPasscodeLength;
            rawPassword = generateNumericPin(length);
            hashedPassword = passwordEncoder.encode(rawPassword);
        }

        boolean allowDownload = dto.getAllowDownload() == null || dto.getAllowDownload();
        boolean watermark = dto.getWatermark() != null && dto.getWatermark();
        String watermarkText = dto.getWatermarkText();

        ShareLink shareLink = ShareLink.builder()
                .tenantId(tenantId)
                .album(album)
                .token(token)
                .expiresAt(expiresAt)
                .password(hashedPassword)
                .allowDownload(allowDownload)
                .watermark(watermark)
                .watermarkText(watermarkText)
                .isRevoked(false)
                .build();

        ShareLink saved = shareLinkRepository.save(shareLink);
        ShareLinkResponseDto responseDto = mapToResponseDto(saved);
        if (rawPassword != null && Boolean.TRUE.equals(dto.getGeneratePasscode())) {
            responseDto.setGeneratedPasscode(rawPassword);
        }
        return responseDto;
    }

    public List<ShareLinkResponseDto> getShareLinksForAlbum(UUID albumId, UUID tenantId) {
        albumRepository.findByIdAndTenantId(albumId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Album not found with ID: " + albumId));

        return shareLinkRepository.findAllByTenantIdAndAlbumId(tenantId, albumId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Revokes a share link. Soft revocation records revocation timestamp and marks isRevoked=true.
     */
    @Transactional
    public void revokeShareLink(UUID id, UUID tenantId) {
        ShareLink shareLink = shareLinkRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Share link not found with ID: " + id));
        shareLink.setRevoked(true);
        shareLink.setRevokedAt(java.time.Instant.now());
        shareLinkRepository.save(shareLink);
        log.info("Share link id={} revoked for tenantId={}", id, tenantId);
    }

    /**
     * Validates access to a share link, checking revocation, expiry, published status,
     * and passcode/session-token credentials with Redis brute-force protection.
     */
    @Transactional
    public ShareLink validateShareLinkAccess(String token, String passcode, String sessionToken, String ipAddress, String userAgent) {
        ShareLink shareLink = shareLinkRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Share link not found or invalid"));

        if (shareLink.isRevoked()) {
            throw new ShareLinkRevokedException("This share link has been revoked");
        }

        if (shareLink.isExpired()) {
            throw new ShareLinkExpiredException("This share link has expired");
        }

        Album album = shareLink.getAlbum();
        if (album.getStatus() != com.eventos.gallery.entity.AlbumStatus.PUBLISHED) {
            throw new IllegalArgumentException("This album is not published");
        }

        // Check password protection
        if (shareLink.getPassword() != null && !shareLink.getPassword().isEmpty()) {
            // First check if a valid short-lived HMAC session token is provided
            if (sessionToken != null && sessionTokenService.isValidSessionToken(sessionToken, token)) {
                // Verified by short-lived session token
                return shareLink;
            }

            // Check if rate limited before attempting password verification
            rateLimiter.checkLockout(token, ipAddress);

            if (passcode == null || passcode.trim().isEmpty()) {
                throw new BadCredentialsException("Passcode required");
            }

            if (!passwordEncoder.matches(passcode.trim(), shareLink.getPassword())) {
                rateLimiter.recordFailure(token, ipAddress);
                throw new BadCredentialsException("Invalid passcode");
            }

            // Success: Reset brute-force counter for this IP
            rateLimiter.recordSuccess(token, ipAddress);
        }

        return shareLink;
    }

    @Transactional
    public SharedAlbumResponseDto getSharedAlbum(String token, String passcode, String sessionToken, String ipAddress, String userAgent) {
        ShareLink shareLink = null;
        try {
            shareLink = validateShareLinkAccess(token, passcode, sessionToken, ipAddress, userAgent);
            Album album = shareLink.getAlbum();

            List<GalleryItem> items = galleryItemRepository.findAllByTenantIdAndAlbumId(shareLink.getTenantId(), album.getId());
            boolean applyWatermark = shareLink.isWatermark();
            String watermarkText = shareLink.getWatermarkText();

            List<GalleryItemResponseDto> itemDtos = items.stream()
                    .map(item -> {
                        GalleryItemResponseDto dto = galleryItemService.mapToResponseDto(item);
                        if (applyWatermark) {
                            boolean isVideo = item.getResourceType() != null && item.getResourceType().startsWith("video");
                            String watermarkedUrl = cloudinaryService.getWatermarkedUrl(item.getPublicId(), item.getUrl(), watermarkText, isVideo);
                            dto.setUrl(watermarkedUrl);
                        }
                        return dto;
                    })
                    .collect(Collectors.toList());

            // Create short-lived session token
            String verifiedSessionToken = sessionTokenService.createSessionToken(token, album.getId(), shareLink.getTenantId());

            // Log successful access attempt
            recordAccessLog(token, shareLink, true, null, ipAddress, userAgent);

            return SharedAlbumResponseDto.builder()
                    .albumId(album.getId())
                    .name(album.getName())
                    .description(album.getDescription())
                    .eventId(album.getEventId())
                    .allowDownload(shareLink.isAllowDownload())
                    .watermark(shareLink.isWatermark())
                    .watermarkText(shareLink.getWatermarkText())
                    .items(itemDtos)
                    .shareSessionToken(verifiedSessionToken)
                    .build();

        } catch (BadCredentialsException e) {
            String reason = "Passcode required".equalsIgnoreCase(e.getMessage()) ? "PASSCODE_REQUIRED" : "INVALID_PASSCODE";
            recordAccessLog(token, shareLink, false, reason, ipAddress, userAgent);
            throw e;
        } catch (RateLimitExceededException e) {
            recordAccessLog(token, shareLink, false, "RATE_LIMIT_EXCEEDED", ipAddress, userAgent);
            throw e;
        } catch (ShareLinkRevokedException e) {
            recordAccessLog(token, shareLink, false, "LINK_REVOKED", ipAddress, userAgent);
            throw e;
        } catch (ShareLinkExpiredException e) {
            recordAccessLog(token, shareLink, false, "LINK_EXPIRED", ipAddress, userAgent);
            throw e;
        } catch (IllegalArgumentException e) {
            String reason;
            if (e.getMessage().contains("not found") || e.getMessage().contains("invalid")) {
                reason = "INVALID_TOKEN";
            } else if (e.getMessage().contains("expired")) {
                reason = "LINK_EXPIRED";
            } else if (e.getMessage().contains("revoked")) {
                reason = "LINK_REVOKED";
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

    public SharedAlbumResponseDto getSharedAlbum(String token, String passcode, String ipAddress, String userAgent) {
        return getSharedAlbum(token, passcode, null, ipAddress, userAgent);
    }

    public SharedAlbumResponseDto getSharedAlbum(String token, String passcode) {
        return getSharedAlbum(token, passcode, null, null, null);
    }

    @Transactional
    public GalleryItemResponseDto getSharedMediaItem(String token, UUID itemId, String passcode, String sessionToken, String ipAddress, String userAgent) {
        ShareLink shareLink = validateShareLinkAccess(token, passcode, sessionToken, ipAddress, userAgent);
        GalleryItem item = galleryItemRepository.findByIdAndTenantId(itemId, shareLink.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Media item not found with ID: " + itemId));

        if (!item.getAlbum().getId().equals(shareLink.getAlbum().getId())) {
            throw new IllegalArgumentException("Media item does not belong to this shared album");
        }

        GalleryItemResponseDto dto = galleryItemService.mapToResponseDto(item);
        if (shareLink.isWatermark()) {
            boolean isVideo = item.getResourceType() != null && item.getResourceType().startsWith("video");
            String watermarkedUrl = cloudinaryService.getWatermarkedUrl(item.getPublicId(), item.getUrl(), shareLink.getWatermarkText(), isVideo);
            dto.setUrl(watermarkedUrl);
        }
        return dto;
    }

    @Transactional
    public GalleryItemResponseDto toggleSharedFavorite(String token, UUID itemId, Boolean favorite, String passcode, String sessionToken, String ipAddress, String userAgent) {
        ShareLink shareLink = validateShareLinkAccess(token, passcode, sessionToken, ipAddress, userAgent);
        GalleryItem item = galleryItemRepository.findByIdAndTenantId(itemId, shareLink.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Media item not found with ID: " + itemId));

        if (!item.getAlbum().getId().equals(shareLink.getAlbum().getId())) {
            throw new IllegalArgumentException("Media item does not belong to this shared album");
        }

        boolean newFavorite = (favorite == null) ? !item.isFavorite() : favorite;
        item.setFavorite(newFavorite);
        GalleryItem saved = galleryItemRepository.save(item);
        return galleryItemService.mapToResponseDto(saved);
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
        log.info("Access attempt logged: shareLinkId={}, success={}, reason={}, ip={}", logEntry.getId(), success, failureReason, ip);
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
                .isRevoked(shareLink.isRevoked())
                .revokedAt(shareLink.getRevokedAt())
                .allowDownload(shareLink.isAllowDownload())
                .watermark(shareLink.isWatermark())
                .watermarkText(shareLink.getWatermarkText())
                .build();
    }

    public byte[] downloadFileBytes(String url) {
        return galleryItemService.downloadFileBytes(url);
    }
}
