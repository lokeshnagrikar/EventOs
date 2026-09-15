package com.eventos.auth.security;

import com.eventos.auth.config.AttributeEncryptor;
import com.eventos.auth.config.ProductionSecurityValidator;
import com.eventos.auth.service.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("Phase 2I — Production Secrets & Fail-Closed Configuration Tests")
class ProductionSecretsValidationTest {

    // ==========================================
    // 1. PII Attribute Encryption Key Hardening
    // ==========================================

    @Test
    @DisplayName("Production fails closed if PII encryption key uses development default")
    void production_fails_closed_on_default_encryption_key() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            new AttributeEncryptor("EventOsSuperSecretKeyForEncryption32!", prodEnv);
        });

        assertTrue(ex.getMessage().contains("CRITICAL SECURITY VIOLATION"));
        assertTrue(ex.getMessage().contains("development default"));
    }

    @Test
    @DisplayName("Production fails closed if PII encryption key is missing or blank")
    void production_fails_closed_on_missing_encryption_key() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("production");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            new AttributeEncryptor("", prodEnv);
        });

        assertTrue(ex.getMessage().contains("CRITICAL SECURITY VIOLATION"));
        assertTrue(ex.getMessage().contains("missing"));
    }

    @Test
    @DisplayName("Production fails closed if PII encryption key is placeholder or too short (< 32 bytes)")
    void production_fails_closed_on_placeholder_or_short_encryption_key() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        // Placeholder
        assertThrows(IllegalStateException.class, () -> {
            new AttributeEncryptor("password123", prodEnv);
        });

        assertThrows(IllegalStateException.class, () -> {
            new AttributeEncryptor("changeme", prodEnv);
        });

        // Short key (e.g. 16 chars)
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            new AttributeEncryptor("short-16-bytes--", prodEnv);
        });
        assertTrue(ex.getMessage().contains("at least 32 bytes"));
    }

    @Test
    @DisplayName("Development environment successfully initializes with default encryption key")
    void dev_environment_succeeds_with_default_encryption_key() {
        MockEnvironment devEnv = new MockEnvironment();
        devEnv.setActiveProfiles("dev");

        AttributeEncryptor encryptor = new AttributeEncryptor("EventOsSuperSecretKeyForEncryption32!", devEnv);
        assertNotNull(encryptor);

        String sample = "Sensitive PII Data";
        String encrypted = encryptor.convertToDatabaseColumn(sample);
        assertNotNull(encrypted);
        assertTrue(encrypted.startsWith("ENC:"));

        String decrypted = encryptor.convertToEntityAttribute(encrypted);
        assertEquals(sample, decrypted);
    }

    // ==========================================
    // 2. JWT RS256 Cryptographic Hardening
    // ==========================================

    @Test
    @DisplayName("Production fails closed if JwtService cannot load RS256 keys and attempts ephemeral fallback")
    void production_fails_closed_on_ephemeral_or_missing_rsa_keys() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "env", prodEnv);
        ReflectionTestUtils.setField(jwtService, "rawPrivateKey", "");
        ReflectionTestUtils.setField(jwtService, "rawPublicKey", "");
        ReflectionTestUtils.setField(jwtService, "jwtSecret", "");

        // When initializing with missing keys in prod profile, it must throw IllegalStateException
        Method initMethod;
        try {
            initMethod = JwtService.class.getDeclaredMethod("init");
            initMethod.setAccessible(true);
            InvocationTargetException ite = assertThrows(InvocationTargetException.class, () -> {
                initMethod.invoke(jwtService);
            });
            assertTrue(ite.getCause() instanceof IllegalStateException || ite.getCause() instanceof RuntimeException);
            assertTrue(ite.getCause().getMessage().contains("CRITICAL SECURITY VIOLATION"));
        } catch (NoSuchMethodException e) {
            fail("init method should exist on JwtService");
        }
    }

    @Test
    @DisplayName("Production fails closed if HS256 symmetric JWT configuration is attempted")
    void production_fails_closed_on_hs256_symmetric_attempt() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "env", prodEnv);
        ReflectionTestUtils.setField(jwtService, "rawPrivateKey", "");
        ReflectionTestUtils.setField(jwtService, "rawPublicKey", "");
        ReflectionTestUtils.setField(jwtService, "jwtSecret", "some-random-32-byte-secret-key-configured-here");

        Method initMethod;
        try {
            initMethod = JwtService.class.getDeclaredMethod("init");
            initMethod.setAccessible(true);
            InvocationTargetException ite = assertThrows(InvocationTargetException.class, () -> {
                initMethod.invoke(jwtService);
            });
            assertTrue(ite.getCause() instanceof IllegalStateException);
            assertTrue(ite.getCause().getMessage().contains("CRITICAL SECURITY VIOLATION"));
        } catch (NoSuchMethodException e) {
            fail("init method should exist on JwtService");
        }
    }

    // ==========================================
    // 3. Central Production Security Validator
    // ==========================================

    @Test
    @DisplayName("Production validator fails closed when GATEWAY_TRUST_SECRET is default or placeholder")
    void production_validator_fails_closed_on_insecure_gateway_secret() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtService mockJwtService = mock(JwtService.class);
        when(mockJwtService.isRs256Configured()).thenReturn(true);

        ProductionSecurityValidator validator = new ProductionSecurityValidator(prodEnv, mockJwtService);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "eventos_gateway_secure_shared_secret");
        ReflectionTestUtils.setField(validator, "encryptionKey", "A-Valid-Production-Key-With-32-Characters!!");
        ReflectionTestUtils.setField(validator, "allowedOrigins", List.of("https://eventosapp.in"));

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionSecurity);
        assertTrue(ex.getMessage().contains("GATEWAY_TRUST_SECRET"));
    }

    @Test
    @DisplayName("Production validator fails closed when PII encryption key is default")
    void production_validator_fails_closed_on_default_pii_encryption_key() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtService mockJwtService = mock(JwtService.class);
        when(mockJwtService.isRs256Configured()).thenReturn(true);

        ProductionSecurityValidator validator = new ProductionSecurityValidator(prodEnv, mockJwtService);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "VerySecureRandomGatewayTrustSecret12345678");
        ReflectionTestUtils.setField(validator, "encryptionKey", "EventOsSuperSecretKeyForEncryption32!");
        ReflectionTestUtils.setField(validator, "allowedOrigins", List.of("https://eventosapp.in"));

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionSecurity);
        assertTrue(ex.getMessage().contains("PII encryption key"));
    }

    @Test
    @DisplayName("Production validator fails closed when database password is default or placeholder")
    void production_validator_fails_closed_on_insecure_db_password() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtService mockJwtService = mock(JwtService.class);
        when(mockJwtService.isRs256Configured()).thenReturn(true);

        ProductionSecurityValidator validator = new ProductionSecurityValidator(prodEnv, mockJwtService);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "VerySecureRandomGatewayTrustSecret12345678");
        ReflectionTestUtils.setField(validator, "encryptionKey", "A-Valid-Production-Key-With-32-Characters!!");
        ReflectionTestUtils.setField(validator, "dbPassword", "eventos_secure_pass");
        ReflectionTestUtils.setField(validator, "allowedOrigins", List.of("https://eventosapp.in"));

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionSecurity);
        assertTrue(ex.getMessage().contains("Database password"));
    }

    @Test
    @DisplayName("Production validator fails closed when RabbitMQ password is default or placeholder")
    void production_validator_fails_closed_on_insecure_rabbitmq_password() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtService mockJwtService = mock(JwtService.class);
        when(mockJwtService.isRs256Configured()).thenReturn(true);

        ProductionSecurityValidator validator = new ProductionSecurityValidator(prodEnv, mockJwtService);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "VerySecureRandomGatewayTrustSecret12345678");
        ReflectionTestUtils.setField(validator, "encryptionKey", "A-Valid-Production-Key-With-32-Characters!!");
        ReflectionTestUtils.setField(validator, "rabbitPassword", "eventos_guest_pass");
        ReflectionTestUtils.setField(validator, "allowedOrigins", List.of("https://eventosapp.in"));

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionSecurity);
        assertTrue(ex.getMessage().contains("RabbitMQ password"));
    }

    @Test
    @DisplayName("Production validator fails closed when CORS contains localhost or wildcard in production")
    void production_validator_fails_closed_on_insecure_cors_origin() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtService mockJwtService = mock(JwtService.class);
        when(mockJwtService.isRs256Configured()).thenReturn(true);

        ProductionSecurityValidator validator = new ProductionSecurityValidator(prodEnv, mockJwtService);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "VerySecureRandomGatewayTrustSecret12345678");
        ReflectionTestUtils.setField(validator, "encryptionKey", "A-Valid-Production-Key-With-32-Characters!!");
        ReflectionTestUtils.setField(validator, "allowedOrigins", List.of("http://localhost:3000", "https://eventosapp.in"));

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionSecurity);
        assertTrue(ex.getMessage().contains("Insecure CORS allowed origin"));
    }

    @Test
    @DisplayName("Production validator passes when all secrets are properly configured and secure")
    void production_validator_passes_when_all_secrets_valid() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtService mockJwtService = mock(JwtService.class);
        when(mockJwtService.isRs256Configured()).thenReturn(true);

        ProductionSecurityValidator validator = new ProductionSecurityValidator(prodEnv, mockJwtService);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "VerySecureRandomGatewayTrustSecret12345678");
        ReflectionTestUtils.setField(validator, "encryptionKey", "A-Valid-Production-Key-With-32-Characters!!");
        ReflectionTestUtils.setField(validator, "dbPassword", "K9#mX$2vP@7qL!9zR4wT8b");
        ReflectionTestUtils.setField(validator, "rabbitPassword", "H6*vN#3wK$8pQ!2yT5sB9c");
        ReflectionTestUtils.setField(validator, "allowedOrigins", List.of("https://eventosapp.in", "https://www.eventosapp.in"));

        assertDoesNotThrow(validator::validateProductionSecurity);
    }

    @Test
    @DisplayName("Development environment does not throw validation errors on default configs")
    void dev_environment_bypasses_production_validators() {
        MockEnvironment devEnv = new MockEnvironment();
        devEnv.setActiveProfiles("dev");

        JwtService mockJwtService = mock(JwtService.class);
        ProductionSecurityValidator validator = new ProductionSecurityValidator(devEnv, mockJwtService);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "eventos_gateway_secure_shared_secret");
        ReflectionTestUtils.setField(validator, "encryptionKey", "EventOsSuperSecretKeyForEncryption32!");
        ReflectionTestUtils.setField(validator, "allowedOrigins", List.of("http://localhost:3000"));

        assertDoesNotThrow(validator::validateProductionSecurity);
    }

    // ==========================================
    // 7. Phase 2L — Secure Cookie Hardening
    // ==========================================

    @Test
    @DisplayName("Phase 2L: Production fails closed if cookie secure attribute is explicitly false")
    void production_fails_closed_when_cookie_secure_is_explicitly_false() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtService mockJwtService = mock(JwtService.class);
        when(mockJwtService.isRs256Configured()).thenReturn(true);

        ProductionSecurityValidator validator = new ProductionSecurityValidator(prodEnv, mockJwtService);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "VerySecureRandomGatewayTrustSecret12345678");
        ReflectionTestUtils.setField(validator, "encryptionKey", "A-Valid-Production-Key-With-32-Characters!!");
        ReflectionTestUtils.setField(validator, "allowedOrigins", List.of("https://eventosapp.in"));
        ReflectionTestUtils.setField(validator, "cookieSecure", "false");

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionSecurity);
        assertTrue(ex.getMessage().contains("Production cookie secure attribute cannot be configured to false"));
    }

    @Test
    @DisplayName("Phase 2L: Production fails closed if cookie SameSite is invalid")
    void production_fails_closed_when_cookie_samesite_is_invalid() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtService mockJwtService = mock(JwtService.class);
        when(mockJwtService.isRs256Configured()).thenReturn(true);

        ProductionSecurityValidator validator = new ProductionSecurityValidator(prodEnv, mockJwtService);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "VerySecureRandomGatewayTrustSecret12345678");
        ReflectionTestUtils.setField(validator, "encryptionKey", "A-Valid-Production-Key-With-32-Characters!!");
        ReflectionTestUtils.setField(validator, "allowedOrigins", List.of("https://eventosapp.in"));
        ReflectionTestUtils.setField(validator, "cookieSameSite", "InvalidPolicyXYZ");

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionSecurity);
        assertTrue(ex.getMessage().contains("Invalid SameSite policy configured in production"));
    }

    @Test
    @DisplayName("Phase 2L: Production passes when cookie secure is true and SameSite is Lax")
    void production_passes_when_cookie_secure_true_and_samesite_lax() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtService mockJwtService = mock(JwtService.class);
        when(mockJwtService.isRs256Configured()).thenReturn(true);

        ProductionSecurityValidator validator = new ProductionSecurityValidator(prodEnv, mockJwtService);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "VerySecureRandomGatewayTrustSecret12345678");
        ReflectionTestUtils.setField(validator, "encryptionKey", "A-Valid-Production-Key-With-32-Characters!!");
        ReflectionTestUtils.setField(validator, "allowedOrigins", List.of("https://eventosapp.in"));
        ReflectionTestUtils.setField(validator, "cookieSecure", "true");
        ReflectionTestUtils.setField(validator, "cookieSameSite", "Lax");

        assertDoesNotThrow(validator::validateProductionSecurity);
    }
}
