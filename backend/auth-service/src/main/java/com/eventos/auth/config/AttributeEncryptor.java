package com.eventos.auth.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Converter
@Component
public class AttributeEncryptor implements AttributeConverter<String, String> {

    private static final String AES = "AES";
    private static final String AES_GCM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int GCM_IV_LENGTH = 12;

    public static final String DEFAULT_DEV_KEY = "EventOsSuperSecretKeyForEncryption32!";
    private static final java.util.Set<String> INSECURE_KEY_PLACEHOLDERS = java.util.Set.of(
        "eventossupersecretkeyforencryption32!",
        "changeme", "change-me", "password", "password123", "admin123",
        "secret", "default", "example", "placeholder", "test", "dev-secret"
    );

    private static SecretKeySpec keySpec;

    @org.springframework.beans.factory.annotation.Autowired
    public AttributeEncryptor(
            @Value("${app.security.encryption.key:EventOsSuperSecretKeyForEncryption32!}") String secretKey,
            @org.springframework.beans.factory.annotation.Autowired(required = false) org.springframework.core.env.Environment env) {
        initKey(secretKey, env);
    }

    public AttributeEncryptor() {
        // Required by JPA converter spec
    }

    public AttributeEncryptor(String secretKey) {
        this(secretKey, null);
    }

    private static void initKey(String secretKey, org.springframework.core.env.Environment env) {
        if (isProductionProfile(env)) {
            if (secretKey == null || secretKey.trim().isEmpty()) {
                throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Mandatory PII encryption key 'app.security.encryption.key' is missing in production profile.");
            }
            String trimmedKey = secretKey.trim();
            if (DEFAULT_DEV_KEY.equals(trimmedKey) || INSECURE_KEY_PLACEHOLDERS.contains(trimmedKey.toLowerCase())) {
                throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Production PII encryption key cannot use development default or placeholder value.");
            }
            if (trimmedKey.getBytes(StandardCharsets.UTF_8).length < 32) {
                throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Production PII encryption key must be at least 32 bytes (256 bits).");
            }
        }

        byte[] keyBytes = (secretKey != null ? secretKey : DEFAULT_DEV_KEY).getBytes(StandardCharsets.UTF_8);
        byte[] key32 = new byte[32];
        System.arraycopy(keyBytes, 0, key32, 0, Math.min(keyBytes.length, 32));
        keySpec = new SecretKeySpec(key32, AES);
    }

    private static boolean isProductionProfile(org.springframework.core.env.Environment env) {
        if (env != null) {
            for (String profile : env.getActiveProfiles()) {
                if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                    return true;
                }
            }
        }
        String sysProfile = System.getProperty("spring.profiles.active");
        if (sysProfile != null && ("prod".equalsIgnoreCase(sysProfile) || "production".equalsIgnoreCase(sysProfile))) {
            return true;
        }
        String envProfile = System.getenv("SPRING_PROFILES_ACTIVE");
        return envProfile != null && ("prod".equalsIgnoreCase(envProfile) || "production".equalsIgnoreCase(envProfile));
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.trim().isEmpty()) {
            return attribute;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec);

            byte[] encrypted = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + encrypted.length];

            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return "ENC:" + Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting PII field", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || !dbData.startsWith("ENC:")) {
            return dbData; // Unencrypted legacy fallback
        }
        try {
            String cipherText = dbData.substring(4);
            byte[] combined = Base64.getDecoder().decode(cipherText);

            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];

            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(combined, GCM_IV_LENGTH, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);

            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting PII field", e);
        }
    }
}
