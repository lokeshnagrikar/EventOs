package com.eventos.gateway.security;

import com.eventos.gateway.config.JwtAuthFilter;
import com.eventos.gateway.config.ProductionSecurityValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("Phase 2I — Gateway Production Secrets & Fail-Closed Configuration Tests")
class GatewayProductionSecretsValidationTest {

    // ==========================================
    // 1. Gateway JWT RS256 Hardening
    // ==========================================

    @Test
    @DisplayName("Gateway in production fails closed if JWT_PUBLIC_KEY is missing and attempts ephemeral fallback")
    void gateway_production_fails_closed_on_missing_public_key() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtAuthFilter filter = new JwtAuthFilter();
        ReflectionTestUtils.setField(filter, "env", prodEnv);
        ReflectionTestUtils.setField(filter, "rawPublicKey", "");
        ReflectionTestUtils.setField(filter, "jwtSecret", "");

        Method initMethod;
        try {
            initMethod = JwtAuthFilter.class.getDeclaredMethod("init");
            initMethod.setAccessible(true);
            InvocationTargetException ite = assertThrows(InvocationTargetException.class, () -> {
                initMethod.invoke(filter);
            });
            assertTrue(ite.getCause() instanceof IllegalStateException || ite.getCause() instanceof RuntimeException);
            assertTrue(ite.getCause().getMessage().contains("CRITICAL SECURITY VIOLATION"));
        } catch (NoSuchMethodException e) {
            fail("init method should exist on JwtAuthFilter");
        }
    }

    @Test
    @DisplayName("Gateway in production fails closed if HS256 symmetric validation is attempted")
    void gateway_production_fails_closed_on_symmetric_attempt() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtAuthFilter filter = new JwtAuthFilter();
        ReflectionTestUtils.setField(filter, "env", prodEnv);
        ReflectionTestUtils.setField(filter, "rawPublicKey", "");
        ReflectionTestUtils.setField(filter, "jwtSecret", "some-32-byte-development-secret-key");

        Method initMethod;
        try {
            initMethod = JwtAuthFilter.class.getDeclaredMethod("init");
            initMethod.setAccessible(true);
            InvocationTargetException ite = assertThrows(InvocationTargetException.class, () -> {
                initMethod.invoke(filter);
            });
            assertTrue(ite.getCause() instanceof IllegalStateException);
            assertTrue(ite.getCause().getMessage().contains("CRITICAL SECURITY VIOLATION"));
        } catch (NoSuchMethodException e) {
            fail("init method should exist on JwtAuthFilter");
        }
    }

    // ==========================================
    // 2. Gateway Production Security Validator
    // ==========================================

    @Test
    @DisplayName("Gateway validator fails closed when GATEWAY_TRUST_SECRET is default or placeholder")
    void gateway_validator_fails_closed_on_insecure_gateway_secret() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtAuthFilter mockFilter = mock(JwtAuthFilter.class);
        when(mockFilter.isRs256Configured()).thenReturn(true);

        ProductionSecurityValidator validator = new ProductionSecurityValidator(prodEnv, mockFilter);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "eventos_gateway_secure_shared_secret");
        ReflectionTestUtils.setField(validator, "corsAllowedOrigins", "https://eventosapp.in");

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionSecurity);
        assertTrue(ex.getMessage().contains("GATEWAY_TRUST_SECRET"));
    }

    @Test
    @DisplayName("Gateway validator fails closed when CORS origins contain localhost or wildcard in production")
    void gateway_validator_fails_closed_on_insecure_cors() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtAuthFilter mockFilter = mock(JwtAuthFilter.class);
        when(mockFilter.isRs256Configured()).thenReturn(true);

        ProductionSecurityValidator validator = new ProductionSecurityValidator(prodEnv, mockFilter);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "VerySecureRandomGatewayTrustSecret12345678");
        ReflectionTestUtils.setField(validator, "corsAllowedOrigins", "https://eventosapp.in,http://localhost:3000");

        IllegalStateException ex = assertThrows(IllegalStateException.class, validator::validateProductionSecurity);
        assertTrue(ex.getMessage().contains("Insecure Gateway CORS allowed origin"));
    }

    @Test
    @DisplayName("Gateway validator passes when all production configurations are secure")
    void gateway_validator_passes_when_secure() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        JwtAuthFilter mockFilter = mock(JwtAuthFilter.class);
        when(mockFilter.isRs256Configured()).thenReturn(true);

        ProductionSecurityValidator validator = new ProductionSecurityValidator(prodEnv, mockFilter);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "VerySecureRandomGatewayTrustSecret12345678");
        ReflectionTestUtils.setField(validator, "corsAllowedOrigins", "https://eventosapp.in,https://www.eventosapp.in");

        assertDoesNotThrow(validator::validateProductionSecurity);
    }

    @Test
    @DisplayName("Gateway validator bypasses checks in development profile")
    void gateway_validator_bypasses_in_dev() {
        MockEnvironment devEnv = new MockEnvironment();
        devEnv.setActiveProfiles("dev");

        JwtAuthFilter mockFilter = mock(JwtAuthFilter.class);
        ProductionSecurityValidator validator = new ProductionSecurityValidator(devEnv, mockFilter);
        ReflectionTestUtils.setField(validator, "gatewaySecret", "eventos_gateway_secure_shared_secret");
        ReflectionTestUtils.setField(validator, "corsAllowedOrigins", "http://localhost:3000");

        assertDoesNotThrow(validator::validateProductionSecurity);
    }
}
