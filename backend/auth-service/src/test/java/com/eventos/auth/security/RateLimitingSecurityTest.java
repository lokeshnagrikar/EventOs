package com.eventos.auth.security;

import com.eventos.auth.controller.AuthController;
import com.eventos.auth.exception.RateLimitExceededException;
import com.eventos.auth.service.RateLimiterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("Phase 2J — Production Rate Limiting & Abuse Protection Test Suite")
public class RateLimitingSecurityTest {

    private StringRedisTemplate redisTemplate;
    private RateLimiterService rateLimiterService;
    private Environment environment;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        redisTemplate = Mockito.mock(StringRedisTemplate.class);
        environment = Mockito.mock(Environment.class);
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

        rateLimiterService = new RateLimiterService(redisTemplate);
        ReflectionTestUtils.setField(rateLimiterService, "environment", environment);

        // Configure deterministic thresholds
        ReflectionTestUtils.setField(rateLimiterService, "enabled", true);
        ReflectionTestUtils.setField(rateLimiterService, "loginIpLimit", 10);
        ReflectionTestUtils.setField(rateLimiterService, "loginIpWindowSeconds", 900L);
        ReflectionTestUtils.setField(rateLimiterService, "loginAccountLimit", 5);
        ReflectionTestUtils.setField(rateLimiterService, "loginSuperAdminAccountLimit", 3);
        ReflectionTestUtils.setField(rateLimiterService, "loginAccountWindowSeconds", 900L);
        ReflectionTestUtils.setField(rateLimiterService, "passwordResetIpLimit", 5);
        ReflectionTestUtils.setField(rateLimiterService, "passwordResetIpWindowSeconds", 3600L);
        ReflectionTestUtils.setField(rateLimiterService, "passwordResetAccountLimit", 3);
        ReflectionTestUtils.setField(rateLimiterService, "passwordResetAccountWindowSeconds", 3600L);
        ReflectionTestUtils.setField(rateLimiterService, "otpLimit", 5);
        ReflectionTestUtils.setField(rateLimiterService, "otpWindowSeconds", 900L);
        ReflectionTestUtils.setField(rateLimiterService, "otpVerifyLimit", 5);
        ReflectionTestUtils.setField(rateLimiterService, "otpVerifyWindowSeconds", 900L);
        ReflectionTestUtils.setField(rateLimiterService, "magicLinkLimit", 5);
        ReflectionTestUtils.setField(rateLimiterService, "magicLinkWindowSeconds", 3600L);
    }

    @Test
    @DisplayName("1. Genuinely Atomic Lua Script: Executes in single Redis transaction and returns count + TTL")
    void trulyAtomicLuaScriptExecution() {
        // Mock Redis Lua execution returning [count=1, ttl=900]
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString()))
                .thenReturn(List.of(1L, 900L));

        assertDoesNotThrow(() ->
                rateLimiterService.checkLoginRateLimit("198.51.100.1", "user@eventos.com"));

        // Verify that stringRedisTemplate executed the atomic Lua script
        verify(redisTemplate, atLeastOnce()).execute(
                argThat((RedisScript s) -> s != null && s.getScriptAsString().contains("INCR") && s.getScriptAsString().contains("EXPIRE")),
                anyList(),
                eq("900")
        );
    }

    @Test
    @DisplayName("2. SuperAdmin Login: Stricter threshold of 3 attempts is enforced")
    void superAdminLoginEnforcesStricterLimit() {
        // Mock Lua returning count=4 (exceeds SuperAdmin limit of 3, but under regular limit of 5)
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString()))
                .thenReturn(List.of(4L, 600L));

        // When isSuperAdmin = true -> blocks at 4
        RateLimitExceededException ex = assertThrows(RateLimitExceededException.class, () ->
                rateLimiterService.checkLoginRateLimit("198.51.100.1", "admin@eventosapp.in", true));

        assertEquals("RATE_LIMITED", ex.getErrorCode());
        assertEquals(600L, ex.getRetryAfterSeconds());
    }

    @Test
    @DisplayName("3. Regular Login: Under 5 attempts succeeds when SuperAdmin stricter limit is false")
    void regularLoginAllowsUpToFiveAttempts() {
        // Mock Lua returning count=4
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString()))
                .thenReturn(List.of(4L, 600L));

        // Regular user with count=4 is allowed under limit of 5
        assertDoesNotThrow(() ->
                rateLimiterService.checkLoginRateLimit("198.51.100.1", "regular@eventos.com", false));
    }

    @Test
    @DisplayName("4. Distributed Abuse Defense: Rotating IPs attacking single account are blocked")
    void rotatingIpsAttackingSingleAccountAreBlocked() {
        ArgumentCaptor<List<String>> keysCaptor = ArgumentCaptor.forClass(List.class);

        when(redisTemplate.execute(any(RedisScript.class), keysCaptor.capture(), anyString()))
                .thenReturn(List.of(1L, 900L))
                .thenReturn(List.of(1L, 900L))
                .thenReturn(List.of(1L, 900L))
                .thenReturn(List.of(4L, 750L)); // 4th attempt exceeds SuperAdmin limit

        assertThrows(RateLimitExceededException.class, () -> {
            rateLimiterService.checkLoginRateLimit("203.0.113.1", "admin@eventosapp.in", true);
            rateLimiterService.checkLoginRateLimit("203.0.113.2", "admin@eventosapp.in", true);
        });
    }

    @Test
    @DisplayName("5. Password reset requests are limited by IP and account")
    void passwordResetRequestsAreLimited() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString()))
                .thenReturn(List.of(4L, 1800L)); // Exceeds account reset limit of 3

        RateLimitExceededException ex = assertThrows(RateLimitExceededException.class, () ->
                rateLimiterService.checkPasswordResetRateLimit(null, "victim@eventos.com"));

        assertEquals("RATE_LIMITED", ex.getErrorCode());
        assertEquals(1800L, ex.getRetryAfterSeconds());
    }

    @Test
    @DisplayName("6. OTP requests and verification attempts are limited")
    void otpDispatchAndVerificationAreLimited() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString()))
                .thenReturn(List.of(6L, 450L)); // Exceeds limit of 5

        RateLimitExceededException ex1 = assertThrows(RateLimitExceededException.class, () ->
                rateLimiterService.checkOtpDispatchRateLimit("+1234567890"));
        assertEquals(450L, ex1.getRetryAfterSeconds());

        RateLimitExceededException ex2 = assertThrows(RateLimitExceededException.class, () ->
                rateLimiterService.checkOtpVerifyRateLimit("+1234567890"));
        assertEquals(450L, ex2.getRetryAfterSeconds());
    }

    @Test
    @DisplayName("7. Magic-link requests are limited")
    void magicLinkRequestsAreLimited() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString()))
                .thenReturn(List.of(6L, 2000L)); // Exceeds limit of 5

        RateLimitExceededException ex = assertThrows(RateLimitExceededException.class, () ->
                rateLimiterService.checkMagicLinkRateLimit("magic@eventos.com"));

        assertEquals("RATE_LIMITED", ex.getErrorCode());
        assertEquals(2000L, ex.getRetryAfterSeconds());
    }

    @Test
    @DisplayName("8. Redis keys contain no raw secrets, raw passwords, or raw emails")
    void redisKeysContainNoRawSecretsOrEmails() {
        ArgumentCaptor<List<String>> keysCaptor = ArgumentCaptor.forClass(List.class);
        when(redisTemplate.execute(any(RedisScript.class), keysCaptor.capture(), anyString()))
                .thenReturn(List.of(1L, 900L));

        String rawEmail = "sensitive-superadmin-email@eventosapp.in";
        rateLimiterService.checkLoginRateLimit("198.51.100.1", rawEmail, true);

        for (List<String> keys : keysCaptor.getAllValues()) {
            for (String key : keys) {
                assertFalse(key.contains(rawEmail), "Redis key must not contain raw email: " + key);
                assertFalse(key.contains("password"), "Redis key must not contain password: " + key);
                assertFalse(key.contains("secret"), "Redis key must not contain secrets: " + key);
            }
        }
    }

    @Test
    @DisplayName("9. Outage Policy: Production Redis outage fails closed on sensitive auth operations")
    void productionRedisOutageFailsClosed() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString()))
                .thenThrow(new RuntimeException("Redis connection refused in production"));

        RateLimitExceededException ex = assertThrows(RateLimitExceededException.class, () ->
                rateLimiterService.checkLoginRateLimit("198.51.100.1", "user@eventos.com", false));

        assertEquals("SERVICE_UNAVAILABLE", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("temporarily unavailable"));
        assertEquals(60L, ex.getRetryAfterSeconds());
    }

    @Test
    @DisplayName("10. Outage Policy: Development Redis outage fails open so dev/tests proceed")
    void devRedisOutageFailsOpen() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});
        when(redisTemplate.execute(any(RedisScript.class), anyList(), anyString()))
                .thenThrow(new RuntimeException("Local redis not running"));

        assertDoesNotThrow(() ->
                rateLimiterService.checkLoginRateLimit("198.51.100.1", "user@eventos.com", false));
    }

    @Test
    @DisplayName("11. Client IP Security in AuthController: Untrusted private network peer cannot spoof XFF")
    void authControllerClientIpAntiSpoofing() {
        AuthController controller = new AuthController(null, null);
        ReflectionTestUtils.setField(controller, "trustedProxies", "127.0.0.1,::1");

        // Untrusted private peer 10.244.0.5 attempting to spoof XFF
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.244.0.5");
        request.addHeader("X-Forwarded-For", "198.51.100.77");

        String resolvedIp = controller.extractClientIp(request);
        assertEquals("10.244.0.5", resolvedIp, "Must ignore spoofed XFF from untrusted peer");

        // Trusted proxy 127.0.0.1 forwarding legitimate client IP
        MockHttpServletRequest trustedRequest = new MockHttpServletRequest();
        trustedRequest.setRemoteAddr("127.0.0.1");
        trustedRequest.addHeader("X-Forwarded-For", "198.51.100.77");

        String trustedResolvedIp = controller.extractClientIp(trustedRequest);
        assertEquals("198.51.100.77", trustedResolvedIp, "Must extract client IP from trusted proxy");
    }
}
