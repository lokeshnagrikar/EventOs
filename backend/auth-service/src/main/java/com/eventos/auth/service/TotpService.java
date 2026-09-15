package com.eventos.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

/**
 * Real RFC 6238 Time-Based One-Time Password (TOTP) implementation
 * for Multi-Factor Authentication (MFA).
 */
@Service
public class TotpService {

    private static final Logger log = LoggerFactory.getLogger(TotpService.class);
    private static final String HMAC_ALGO = "HmacSHA1";
    private static final int TIME_STEP_SECONDS = 30;
    private static final int DIGITS = 6;
    private static final int MODULUS = 1_000_000;
    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generate a cryptographically secure 160-bit Base32 TOTP secret.
     */
    public String generateSecret() {
        byte[] bytes = new byte[20];
        secureRandom.nextBytes(bytes);
        return encodeBase32(bytes);
    }

    /**
     * Generate 5 secure single-use backup codes (formatted as 8 alphanumeric chars).
     */
    public List<String> generateBackupCodes() {
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            StringBuilder sb = new StringBuilder();
            for (int j = 0; j < 8; j++) {
                int idx = secureRandom.nextInt(BASE32_CHARS.length());
                sb.append(BASE32_CHARS.charAt(idx));
            }
            codes.add(sb.toString());
        }
        return codes;
    }

    /**
     * Validate a 6-digit TOTP code against the Base32 secret with a 1-step window (±30s).
     */
    public boolean verifyCode(String base32Secret, String code) {
        if (base32Secret == null || code == null || code.trim().length() != DIGITS) {
            return false;
        }

        try {
            int parsedCode = Integer.parseInt(code.trim());
            byte[] keyBytes = decodeBase32(base32Secret.trim().toUpperCase());
            long currentWindow = System.currentTimeMillis() / 1000L / TIME_STEP_SECONDS;

            for (int windowOffset = -1; windowOffset <= 1; windowOffset++) {
                long window = currentWindow + windowOffset;
                int generated = generateTotp(keyBytes, window);
                if (generated == parsedCode) {
                    return true;
                }
            }
        } catch (Exception e) {
            log.warn("[TOTP] Failed to verify TOTP code: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Generate standard TOTP code for a specific window.
     */
    public int generateTotp(byte[] keyBytes, long timeWindow) throws Exception {
        byte[] data = ByteBuffer.allocate(8).putLong(timeWindow).array();
        Mac mac = Mac.getInstance(HMAC_ALGO);
        mac.init(new SecretKeySpec(keyBytes, HMAC_ALGO));
        byte[] hash = mac.doFinal(data);

        int offset = hash[hash.length - 1] & 0x0F;
        int binary = ((hash[offset] & 0x7F) << 24)
                | ((hash[offset + 1] & 0xFF) << 16)
                | ((hash[offset + 2] & 0xFF) << 8)
                | (hash[offset + 3] & 0xFF);

        return binary % MODULUS;
    }

    /**
     * Base32 encoding.
     */
    public static String encodeBase32(byte[] data) {
        StringBuilder result = new StringBuilder();
        int buffer = 0;
        int bitsLeft = 0;

        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                int index = (buffer >> (bitsLeft - 5)) & 0x1F;
                bitsLeft -= 5;
                result.append(BASE32_CHARS.charAt(index));
            }
        }

        if (bitsLeft > 0) {
            int index = (buffer << (5 - bitsLeft)) & 0x1F;
            result.append(BASE32_CHARS.charAt(index));
        }

        return result.toString();
    }

    /**
     * Base32 decoding.
     */
    public static byte[] decodeBase32(String base32) {
        String clean = base32.replaceAll("[^A-Z2-7]", "");
        int numBytes = clean.length() * 5 / 8;
        byte[] result = new byte[numBytes];
        int buffer = 0;
        int bitsLeft = 0;
        int byteIndex = 0;

        for (int i = 0; i < clean.length(); i++) {
            char c = clean.charAt(i);
            int val = BASE32_CHARS.indexOf(c);
            if (val < 0) {
                continue;
            }
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                if (byteIndex < result.length) {
                    result[byteIndex++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xFF);
                }
                bitsLeft -= 8;
            }
        }

        return result;
    }
}
