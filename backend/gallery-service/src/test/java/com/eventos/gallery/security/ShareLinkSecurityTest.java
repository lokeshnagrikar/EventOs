package com.eventos.gallery.security;

import com.eventos.gallery.controller.ShareLinkController;
import com.eventos.gallery.dto.CreateShareLinkDto;
import com.eventos.gallery.dto.GalleryItemResponseDto;
import com.eventos.gallery.dto.ShareLinkResponseDto;
import com.eventos.gallery.dto.SharedAlbumResponseDto;
import com.eventos.gallery.entity.Album;
import com.eventos.gallery.entity.AlbumStatus;
import com.eventos.gallery.entity.GalleryItem;
import com.eventos.gallery.entity.GalleryItemType;
import com.eventos.gallery.entity.ShareLink;
import com.eventos.gallery.exception.RateLimitExceededException;
import com.eventos.gallery.exception.ShareLinkExpiredException;
import com.eventos.gallery.exception.ShareLinkRevokedException;
import com.eventos.gallery.repository.AlbumRepository;
import com.eventos.gallery.repository.GalleryItemRepository;
import com.eventos.gallery.repository.ShareLinkAccessLogRepository;
import com.eventos.gallery.repository.ShareLinkRepository;
import com.eventos.gallery.service.CloudinaryService;
import com.eventos.gallery.service.GalleryItemService;
import com.eventos.gallery.service.ShareLinkService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@DisplayName("Share Link Security Hardening Tests")
public class ShareLinkSecurityTest {

    private ShareLinkRepository shareLinkRepository;
    private AlbumRepository albumRepository;
    private GalleryItemRepository galleryItemRepository;
    private GalleryItemService galleryItemService;
    private CloudinaryService cloudinaryService;
    private ShareLinkAccessLogRepository accessLogRepository;
    private ShareLinkRateLimiter rateLimiter;
    private ShareSessionTokenService sessionTokenService;
    private ClientIpResolver clientIpResolver;

    private ShareLinkService shareLinkService;
    private ShareLinkController shareLinkController;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID albumId = UUID.randomUUID();
    private final UUID itemId = UUID.randomUUID();
    private final String token = "test_secure_share_token_128bits";
    private final String correctPasscode = "654321";
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private Album testAlbum;
    private ShareLink protectedShareLink;
    private GalleryItem testItem;

    @BeforeEach
    void setUp() {
        shareLinkRepository = mock(ShareLinkRepository.class);
        albumRepository = mock(AlbumRepository.class);
        galleryItemRepository = mock(GalleryItemRepository.class);
        galleryItemService = mock(GalleryItemService.class);
        cloudinaryService = mock(CloudinaryService.class);
        accessLogRepository = mock(ShareLinkAccessLogRepository.class);

        // Rate limiter using in-memory tracker (no external redis required for unit tests)
        rateLimiter = new ShareLinkRateLimiter();
        sessionTokenService = new ShareSessionTokenService("test_secret_key_9a4f2c8d7e6b5a3f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d");
        clientIpResolver = new ClientIpResolver("127.0.0.1,::1");

        shareLinkService = new ShareLinkService(
                shareLinkRepository,
                albumRepository,
                galleryItemRepository,
                galleryItemService,
                cloudinaryService,
                accessLogRepository,
                rateLimiter,
                sessionTokenService
        );

        shareLinkController = new ShareLinkController(shareLinkService, clientIpResolver);

        testAlbum = Album.builder()
                .id(albumId)
                .tenantId(tenantId)
                .name("Annual Gala 2026")
                .status(AlbumStatus.PUBLISHED)
                .build();

        protectedShareLink = ShareLink.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .album(testAlbum)
                .token(token)
                .password(passwordEncoder.encode(correctPasscode))
                .allowDownload(true)
                .watermark(false)
                .isRevoked(false)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();

        testItem = GalleryItem.builder()
                .id(itemId)
                .tenantId(tenantId)
                .album(testAlbum)
                .name("photo1.jpg")
                .url("https://res.cloudinary.com/eventos/image/upload/photo1.jpg")
                .type(GalleryItemType.IMAGE)
                .build();

        when(shareLinkRepository.findByToken(token)).thenReturn(Optional.of(protectedShareLink));
        when(galleryItemRepository.findAllByTenantIdAndAlbumId(tenantId, albumId))
                .thenReturn(Collections.singletonList(testItem));
        when(galleryItemRepository.findByIdAndTenantId(itemId, tenantId))
                .thenReturn(Optional.of(testItem));
        when(galleryItemService.mapToResponseDto(any(GalleryItem.class)))
                .thenReturn(GalleryItemResponseDto.builder()
                        .id(itemId)
                        .name("photo1.jpg")
                        .url("https://res.cloudinary.com/eventos/photo1.jpg")
                        .build());
    }

    @Test
    @DisplayName("1. Brute-force lockout after 5 consecutive failures returns HTTP 429 with Retry-After")
    void testLockoutAfter5FailuresReturns429WithRetryAfter() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.25");

        // 4 failed attempts should yield 403 INVALID_PASSCODE
        for (int i = 1; i <= 4; i++) {
            ResponseEntity<?> response = shareLinkController.getSharedAlbum(token, "wrongPass", null, null, null, request);
            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode(), "Attempt " + i + " should return 403");
        }

        // 5th failed attempt should trigger lockout and return 429 TOO_MANY_REQUESTS
        ResponseEntity<?> fifthResponse = shareLinkController.getSharedAlbum(token, "wrongPass", null, null, null, request);
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, fifthResponse.getStatusCode(), "5th failure must trigger 429");
        assertTrue(fifthResponse.getHeaders().containsKey("Retry-After"), "Response must contain Retry-After header");
        assertEquals("1800", fifthResponse.getHeaders().getFirst("Retry-After"));

        // Subsequent attempt with correct passcode must be rejected due to active lockout
        ResponseEntity<?> lockedOutResponse = shareLinkController.getSharedAlbum(token, correctPasscode, null, null, null, request);
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, lockedOutResponse.getStatusCode(), "Subsequent attempt while locked must return 429");
        assertTrue(lockedOutResponse.getHeaders().containsKey("Retry-After"));
    }

    @Test
    @DisplayName("2. Success resets consecutive failure counter")
    void testSuccessResetsFailureCounter() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.30");

        // 3 failed attempts
        for (int i = 0; i < 3; i++) {
            ResponseEntity<?> response = shareLinkController.getSharedAlbum(token, "wrongPass", null, null, null, request);
            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        }

        // 4th attempt is successful
        ResponseEntity<?> successResponse = shareLinkController.getSharedAlbum(token, correctPasscode, null, null, null, request);
        assertEquals(HttpStatus.OK, successResponse.getStatusCode());

        // Counter is reset: 3 more failed attempts must NOT trigger lockout (requires 5 consecutive)
        for (int i = 0; i < 3; i++) {
            ResponseEntity<?> response = shareLinkController.getSharedAlbum(token, "wrongPass", null, null, null, request);
            assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        }
    }

    @Test
    @DisplayName("3. Expired share link returns HTTP 410 GONE")
    void testExpiredShareLinkReturns410() {
        protectedShareLink.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.35");

        ResponseEntity<?> response = shareLinkController.getSharedAlbum(token, correctPasscode, null, null, null, request);
        assertEquals(HttpStatus.GONE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().toString().contains("LINK_EXPIRED"));
    }

    @Test
    @DisplayName("4. Revoked share link returns HTTP 410 GONE")
    void testRevokedShareLinkReturns410() {
        protectedShareLink.setRevoked(true);
        protectedShareLink.setRevokedAt(Instant.now().minus(10, ChronoUnit.MINUTES));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.40");

        ResponseEntity<?> response = shareLinkController.getSharedAlbum(token, correctPasscode, null, null, null, request);
        assertEquals(HttpStatus.GONE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().toString().contains("LINK_REVOKED"));
    }

    @Test
    @DisplayName("5. Bypass attempt on media endpoint with only token is blocked with HTTP 403")
    void testBypassAttemptOnMediaEndpointBlockedWith403() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.45");

        // Direct call without passcode or session token
        ResponseEntity<?> response = shareLinkController.getSharedMediaItem(token, itemId, null, null, null, null, request);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("PASSCODE_REQUIRED"));
    }

    @Test
    @DisplayName("6. Bypass attempt on download endpoint with only token is blocked with HTTP 403")
    void testBypassAttemptOnDownloadEndpointBlockedWith403() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.50");

        // Calling download endpoint without passcode or session token throws ResponseStatusException(403)
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                shareLinkController.downloadSharedAlbum(token, null, null, null, null, request)
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("7. Access to media and view endpoints with verified short-lived session token succeeds")
    void testAccessWithVerifiedSessionTokenSucceeds() {
        // Generate valid session token
        String sessionToken = sessionTokenService.createSessionToken(token, albumId, tenantId);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.55");

        // Access view endpoint with session token header (no passcode provided)
        ResponseEntity<?> viewResponse = shareLinkController.getSharedAlbum(token, null, null, sessionToken, null, request);
        assertEquals(HttpStatus.OK, viewResponse.getStatusCode());

        // Access media endpoint with session token header (no passcode provided)
        ResponseEntity<?> mediaResponse = shareLinkController.getSharedMediaItem(token, itemId, null, null, sessionToken, null, request);
        assertEquals(HttpStatus.OK, mediaResponse.getStatusCode());
    }

    @Test
    @DisplayName("8. Tampered or expired session token is rejected")
    void testTamperedSessionTokenRejected() {
        String validSessionToken = sessionTokenService.createSessionToken(token, albumId, tenantId);
        String tamperedToken = validSessionToken + "tampered";

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.60");

        ResponseEntity<?> response = shareLinkController.getSharedMediaItem(token, itemId, null, null, tamperedToken, null, request);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    @DisplayName("9. Anti-spoofing client IP resolution blocks attacker spoofed X-Forwarded-For")
    void testAntiSpoofingClientIpResolution() {
        // Case A: Attacker directly connects from untrusted IP with spoofed header
        MockHttpServletRequest directAttackerRequest = new MockHttpServletRequest();
        directAttackerRequest.setRemoteAddr("203.0.113.199"); // Untrusted direct peer
        directAttackerRequest.addHeader("X-Forwarded-For", "127.0.0.1, 10.0.0.1");

        String resolvedIp = clientIpResolver.resolveClientIp(directAttackerRequest);
        assertEquals("203.0.113.199", resolvedIp, "Must discard spoofed header from untrusted peer");

        // Case B: Request through trusted proxy (loopback Caddy)
        MockHttpServletRequest trustedProxyRequest = new MockHttpServletRequest();
        trustedProxyRequest.setRemoteAddr("127.0.0.1"); // Trusted peer
        trustedProxyRequest.addHeader("X-Forwarded-For", "198.51.100.88, 127.0.0.1");

        String resolvedBehindProxy = clientIpResolver.resolveClientIp(trustedProxyRequest);
        assertEquals("198.51.100.88", resolvedBehindProxy, "Must resolve legitimate client IP behind trusted proxy");
    }

    @Test
    @DisplayName("10. High-entropy token generation produces at least 128 bits of entropy")
    void testHighEntropyTokenGeneration() {
        String token1 = ShareLinkService.generateHighEntropyToken();
        String token2 = ShareLinkService.generateHighEntropyToken();

        assertNotNull(token1);
        assertNotNull(token2);
        assertNotEquals(token1, token2);
        // 16 bytes = 32 hexadecimal characters = 128 bits
        assertEquals(32, token1.length());
        assertEquals(32, token2.length());
    }

    @Test
    @DisplayName("11. Configurable PIN generation supports 6+ digits by default")
    void testPinGeneration() {
        String pin6 = ShareLinkService.generateNumericPin(6);
        assertEquals(6, pin6.length());
        assertTrue(pin6.matches("^\\d{6}$"));

        String pin8 = ShareLinkService.generateNumericPin(8);
        assertEquals(8, pin8.length());
        assertTrue(pin8.matches("^\\d{8}$"));

        // Min length bound at 4
        String pinUnderMin = ShareLinkService.generateNumericPin(2);
        assertEquals(4, pinUnderMin.length());
    }
}
