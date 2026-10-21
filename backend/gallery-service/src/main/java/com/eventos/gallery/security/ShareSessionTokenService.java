package com.eventos.gallery.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.UUID;

/**
 * Service that issues and validates cryptographically signed (HMAC-SHA256) short-lived session tokens
 * for verified passcode sessions on shared galleries.
 *
 * Prevents unauthorized or unauthenticated bypass of media, ZIP, and favorite endpoints.
 */
@Service
public class ShareSessionTokenService {

    private static final Logger log = LoggerFactory.getLogger(ShareSessionTokenService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    public static final long SESSION_EXPIRY_MS = 2 * 60 * 60 * 1000L; // 2 hours

    private final byte[] secretKeyBytes;

    public ShareSessionTokenService(
            @Value("${app.jwt.secret:9a4f2c8d7e6b5a3f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d}") String secret) {
        this.secretKeyBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Issues an HMAC-SHA256 signed session token valid for 2 hours for this share link.
     */
    public String createSessionToken(String shareToken, UUID albumId, UUID tenantId) {
        long now = System.currentTimeMillis();
        long expiry = now + SESSION_EXPIRY_MS;
        String payload = shareToken + ":" + albumId + ":" + tenantId + ":" + expiry;
        String payloadEncoded = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String signature = sign(payloadEncoded);
        return payloadEncoded + "." + signature;
    }

    /**
     * Validates whether a given session token is valid, unexpired, and matches the expected share token.
     */
    public boolean isValidSessionToken(String sessionToken, String expectedShareToken) {
        if (sessionToken == null || sessionToken.trim().isEmpty() || expectedShareToken == null) {
            return false;
        }

        String[] parts = sessionToken.trim().split("\\.");
        if (parts.length != 2) {
            return false;
        }

        String payloadEncoded = parts[0];
        String providedSignature = parts[1];

        // Constant-time signature verification
        String expectedSignature = sign(payloadEncoded);
        if (!MessageDigest.isEqual(providedSignature.getBytes(StandardCharsets.UTF_8),
                expectedSignature.getBytes(StandardCharsets.UTF_8))) {
            log.warn("Invalid session token signature for share token {}", expectedShareToken);
            return false;
        }

        try {
            String payload = new String(Base64.getUrlDecoder().decode(payloadEncoded), StandardCharsets.UTF_8);
            String[] fields = payload.split(":");
            if (fields.length != 4) {
                return false;
            }

            String tokenInSession = fields[0];
            long expiryTime = Long.parseLong(fields[3]);

            if (!tokenInSession.equals(expectedShareToken)) {
                log.warn("Session token shareToken mismatch: expected {} but got {}", expectedShareToken, tokenInSession);
                return false;
            }

            if (System.currentTimeMillis() > expiryTime) {
                log.warn("Session token expired for share token {}", expectedShareToken);
                return false;
            }

            return true;
        } catch (Exception e) {
            log.warn("Error decoding session token payload: {}", e.getMessage());
            return false;
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secretKeyBytes, HMAC_ALGORITHM));
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to calculate HMAC signature", e);
        }
    }
}
