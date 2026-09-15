package com.eventos.auth.controller;

import com.eventos.auth.config.ProductionSecurityValidator;
import com.eventos.auth.service.AuthService;
import com.eventos.auth.service.RecaptchaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

@DisplayName("Phase 2L — Authentication Cookie Hardening Tests")
class CookieSecurityTest {

    @Test
    @DisplayName("Phase 2L: Production environment ALWAYS enforces Secure=true on refresh cookie")
    void productionAlwaysEnforcesSecureTrue() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        ProductionSecurityValidator validator = mock(ProductionSecurityValidator.class);
        org.mockito.Mockito.when(validator.isProduction()).thenReturn(true);

        AuthController controller = new AuthController(mock(AuthService.class), mock(RecaptchaService.class));
        ReflectionTestUtils.setField(controller, "environment", prodEnv);
        ReflectionTestUtils.setField(controller, "productionSecurityValidator", validator);

        // Call private createRefreshTokenCookie via reflection
        ResponseCookie cookie = ReflectionTestUtils.invokeMethod(
                controller, "createRefreshTokenCookie", "mock-token-abc", 604800L);

        assertNotNull(cookie);
        assertTrue(cookie.isSecure(), "Production refresh-token cookie MUST be Secure");
        assertTrue(cookie.isHttpOnly(), "Refresh-token cookie MUST be HttpOnly");
        assertEquals("/", cookie.getPath(), "Refresh-token cookie MUST have Path=/");
        assertEquals("Lax", cookie.getSameSite(), "Default SameSite MUST be Lax");
        assertNull(cookie.getDomain(), "Refresh-token cookie MUST be host-only (Domain omitted)");
        assertEquals(604800L, cookie.getMaxAge().getSeconds());
    }

    @Test
    @DisplayName("Phase 2L: COOKIE_SECURE=false CANNOT downgrade Secure=true in production")
    void productionCannotBeDowngradedByFalseOverride() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("production");

        ProductionSecurityValidator validator = mock(ProductionSecurityValidator.class);
        org.mockito.Mockito.when(validator.isProduction()).thenReturn(true);

        AuthController controller = new AuthController(mock(AuthService.class), mock(RecaptchaService.class));
        ReflectionTestUtils.setField(controller, "environment", prodEnv);
        ReflectionTestUtils.setField(controller, "productionSecurityValidator", validator);
        ReflectionTestUtils.setField(controller, "secureCookieOverrideStr", "false"); // Attempted downgrade!

        ResponseCookie cookie = ReflectionTestUtils.invokeMethod(
                controller, "createRefreshTokenCookie", "mock-token-abc", 604800L);

        assertNotNull(cookie);
        assertTrue(cookie.isSecure(), "Production refresh-token cookie MUST remain Secure even if override is false");
    }

    @Test
    @DisplayName("Phase 2L: Development environment preserves HTTP compatibility without Secure")
    void devEnvironmentPreservesHttpCompatibility() {
        MockEnvironment devEnv = new MockEnvironment();
        devEnv.setActiveProfiles("dev");

        ProductionSecurityValidator validator = mock(ProductionSecurityValidator.class);
        org.mockito.Mockito.when(validator.isProduction()).thenReturn(false);

        AuthController controller = new AuthController(mock(AuthService.class), mock(RecaptchaService.class));
        ReflectionTestUtils.setField(controller, "environment", devEnv);
        ReflectionTestUtils.setField(controller, "productionSecurityValidator", validator);
        ReflectionTestUtils.setField(controller, "secureCookieOverrideStr", null);

        ResponseCookie cookie = ReflectionTestUtils.invokeMethod(
                controller, "createRefreshTokenCookie", "mock-token-abc", 604800L);

        assertNotNull(cookie);
        assertFalse(cookie.isSecure(), "Development refresh cookie should omit Secure for HTTP localhost");
        assertTrue(cookie.isHttpOnly());
        assertEquals("Lax", cookie.getSameSite());
        assertEquals("/", cookie.getPath());
    }

    @Test
    @DisplayName("Phase 2L: Explicit SameSite=Strict is respected")
    void explicitSameSiteStrictIsRespected() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        ProductionSecurityValidator validator = mock(ProductionSecurityValidator.class);
        org.mockito.Mockito.when(validator.isProduction()).thenReturn(true);

        AuthController controller = new AuthController(mock(AuthService.class), mock(RecaptchaService.class));
        ReflectionTestUtils.setField(controller, "environment", prodEnv);
        ReflectionTestUtils.setField(controller, "productionSecurityValidator", validator);
        ReflectionTestUtils.setField(controller, "sameSitePolicyOverride", "Strict");

        ResponseCookie cookie = ReflectionTestUtils.invokeMethod(
                controller, "createRefreshTokenCookie", "mock-token-abc", 604800L);

        assertNotNull(cookie);
        assertEquals("Strict", cookie.getSameSite());
        assertTrue(cookie.isSecure());
    }

    @Test
    @DisplayName("Phase 2L: SameSite=None strictly enforces Secure=true even in non-production")
    void sameSiteNoneStrictlyEnforcesSecure() {
        MockEnvironment devEnv = new MockEnvironment();
        devEnv.setActiveProfiles("dev");

        ProductionSecurityValidator validator = mock(ProductionSecurityValidator.class);
        org.mockito.Mockito.when(validator.isProduction()).thenReturn(false);

        AuthController controller = new AuthController(mock(AuthService.class), mock(RecaptchaService.class));
        ReflectionTestUtils.setField(controller, "environment", devEnv);
        ReflectionTestUtils.setField(controller, "productionSecurityValidator", validator);
        ReflectionTestUtils.setField(controller, "sameSitePolicyOverride", "None");

        ResponseCookie cookie = ReflectionTestUtils.invokeMethod(
                controller, "createRefreshTokenCookie", "mock-token-abc", 604800L);

        assertNotNull(cookie);
        assertEquals("None", cookie.getSameSite());
        assertTrue(cookie.isSecure(), "SameSite=None MUST strictly require Secure=true");
    }

    @Test
    @DisplayName("Phase 2L: Logout revocation cookie matches scope with Max-Age=0")
    void logoutRevocationCookieMatchesScopeWithMaxAgeZero() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        ProductionSecurityValidator validator = mock(ProductionSecurityValidator.class);
        org.mockito.Mockito.when(validator.isProduction()).thenReturn(true);

        AuthController controller = new AuthController(mock(AuthService.class), mock(RecaptchaService.class));
        ReflectionTestUtils.setField(controller, "environment", prodEnv);
        ReflectionTestUtils.setField(controller, "productionSecurityValidator", validator);

        ResponseCookie cookie = ReflectionTestUtils.invokeMethod(
                controller, "createRefreshTokenCookie", "", 0L);

        assertNotNull(cookie);
        assertEquals("", cookie.getValue());
        assertEquals(0L, cookie.getMaxAge().getSeconds());
        assertEquals("/", cookie.getPath());
        assertEquals("Lax", cookie.getSameSite());
        assertTrue(cookie.isSecure(), "Logout cookie in production must match Secure=true");
        assertTrue(cookie.isHttpOnly());
        assertNull(cookie.getDomain());
    }
}
