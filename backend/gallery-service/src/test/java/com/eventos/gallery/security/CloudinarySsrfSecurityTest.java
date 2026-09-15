package com.eventos.gallery.security;

import com.eventos.gallery.service.CloudinaryService;
import com.eventos.gallery.service.GalleryItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

@DisplayName("2Q-05 — Cloudinary SSRF Final Hardening Security Tests")
public class CloudinarySsrfSecurityTest {

    private CloudinaryService cloudinaryService;
    private GalleryItemService galleryItemService;
    private final String cloudName = "eventos-prod";

    @BeforeEach
    void setUp() {
        cloudinaryService = new CloudinaryService();
        ReflectionTestUtils.setField(cloudinaryService, "cloudName", cloudName);

        galleryItemService = new GalleryItemService(
                mock(com.eventos.gallery.repository.GalleryItemRepository.class),
                mock(com.eventos.gallery.repository.AlbumRepository.class),
                cloudinaryService,
                mock(org.springframework.amqp.rabbit.core.RabbitTemplate.class)
        );
    }

    @Test
    @DisplayName("1. Valid Cloudinary URL matching trusted host and expected cloud name is accepted")
    void testValidCloudinaryUrlAccepted() {
        String validUrl = "https://res.cloudinary.com/" + cloudName + "/image/upload/v1234567890/eventos/sample.jpg";
        assertTrue(cloudinaryService.isValidCloudinaryUrl(validUrl));
    }

    @Test
    @DisplayName("2. Attacker domain is rejected (SSRF prevention)")
    void testAttackerDomainRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://attacker.com/malicious.jpg"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://attacker.com/res.cloudinary.com/sample.jpg"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://res.cloudinary.com.attacker.com/sample.jpg"));
    }

    @Test
    @DisplayName("3. Insecure HTTP protocol is rejected")
    void testHttpRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("http://res.cloudinary.com/" + cloudName + "/image/upload/sample.jpg"));
    }

    @Test
    @DisplayName("4. Userinfo in URL is rejected")
    void testUserInfoRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://user:pass@res.cloudinary.com/" + cloudName + "/sample.jpg"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://res.cloudinary.com@" + cloudName + "/sample.jpg"));
    }

    @Test
    @DisplayName("5. Cloud metadata IP 169.254.169.254 is rejected")
    void testCloudMetadataIpRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("http://169.254.169.254/latest/meta-data/"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://169.254.169.254/latest/meta-data/"));
    }

    @Test
    @DisplayName("6. Loopback address 127.0.0.1 is rejected")
    void testLoopbackIpRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("http://127.0.0.1:8080/admin"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://127.0.0.1:8443/admin"));
    }

    @Test
    @DisplayName("7. Hostname localhost is rejected")
    void testLocalhostRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("http://localhost:8080/api/v1/keys"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://localhost:443/secrets"));
    }

    @Test
    @DisplayName("8. IPv6 loopback is rejected")
    void testIpv6LoopbackRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("http://[::1]:8080/admin"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://[::1]/admin"));
    }

    @Test
    @DisplayName("9. Private IP ranges (RFC 1918) are rejected")
    void testPrivateIpRangesRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("http://10.0.0.1:8080/internal"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://192.168.1.1/router"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://172.16.0.1/admin"));
    }

    @Test
    @DisplayName("10. Link-local IP ranges are rejected")
    void testLinkLocalIpRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("http://169.254.1.1/secret"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://169.254.100.50/config"));
    }

    @Test
    @DisplayName("11. Wrong cloud name is rejected")
    void testWrongCloudNameRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://res.cloudinary.com/wrong-tenant-cloud/image/upload/sample.jpg"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://res.cloudinary.com/attacker-cloud/image/upload/sample.jpg"));
    }

    @Test
    @DisplayName("12. Path traversal attempts are rejected")
    void testPathTraversalRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://res.cloudinary.com/" + cloudName + "/../../../etc/passwd"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://res.cloudinary.com/" + cloudName + "/image/upload/../../secret"));
    }

    @Test
    @DisplayName("13. Encoded traversal sequences are rejected")
    void testEncodedTraversalRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://res.cloudinary.com/" + cloudName + "/%2e%2e/%2e%2e/admin"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://res.cloudinary.com/" + cloudName + "/%252e%252e/admin"));
    }

    @Test
    @DisplayName("14. Non-standard ports are rejected")
    void testNonStandardPortsRejected() {
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://res.cloudinary.com:8443/" + cloudName + "/sample.jpg"));
        assertFalse(cloudinaryService.isValidCloudinaryUrl("https://res.cloudinary.com:80/" + cloudName + "/sample.jpg"));
    }

    @Test
    @DisplayName("15. GalleryItemService.downloadFileBytes blocks SSRF payloads with SecurityException")
    void testDownloadFileBytesBlocksSsrf() {
        SecurityException ex1 = assertThrows(SecurityException.class, () ->
                galleryItemService.downloadFileBytes("https://attacker.com/malicious.jpg")
        );
        assertTrue(ex1.getMessage().contains("SSRF blocked"));

        SecurityException ex2 = assertThrows(SecurityException.class, () ->
                galleryItemService.downloadFileBytes("http://169.254.169.254/latest/meta-data")
        );
        assertTrue(ex2.getMessage().contains("SSRF blocked"));

        SecurityException ex3 = assertThrows(SecurityException.class, () ->
                galleryItemService.downloadFileBytes("https://res.cloudinary.com/other-cloud/image/upload/sample.jpg")
        );
        assertTrue(ex3.getMessage().contains("SSRF blocked"));
    }
}
