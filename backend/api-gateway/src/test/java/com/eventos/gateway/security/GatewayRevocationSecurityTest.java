package com.eventos.gateway.security;

import com.eventos.gateway.config.JwtAuthFilter;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@DisplayName("Phase 2N — Gateway Revocation, Issuer/Audience & Impersonation Security Tests")
class GatewayRevocationSecurityTest {

    private JwtAuthFilter filter;
    private ReactiveStringRedisTemplate redisTemplate;
    private ReactiveValueOperations<String, String> valueOperations;
    private GatewayFilterChain filterChain;
    private MockEnvironment environment;
    private KeyPair keyPair;
    private String gatewaySecret = "TestGatewaySecret12345678901234567890";

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        keyPair = kpg.generateKeyPair();

        redisTemplate = Mockito.mock(ReactiveStringRedisTemplate.class);
        valueOperations = Mockito.mock(ReactiveValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // Default: no blacklist, no session revocation, no user revocation
        when(redisTemplate.hasKey(any(String.class))).thenReturn(Mono.just(false));
        when(valueOperations.get(any(String.class))).thenReturn(Mono.empty());

        environment = new MockEnvironment();
        environment.setActiveProfiles("dev");

        filter = new JwtAuthFilter();
        ReflectionTestUtils.setField(filter, "redisTemplate", redisTemplate);
        ReflectionTestUtils.setField(filter, "env", environment);
        ReflectionTestUtils.setField(filter, "gatewaySecret", gatewaySecret);
        ReflectionTestUtils.setField(filter, "publicKey", keyPair.getPublic());
        ReflectionTestUtils.setField(filter, "useSymmetric", false);
        ReflectionTestUtils.setField(filter, "jwtParser", Jwts.parser().verifyWith(keyPair.getPublic()).build());
    }

    private String createToken(String issuer, String audience, UUID userId, UUID tenantId, UUID sessionId,
                              Date issuedAt, Boolean impersonated, String adminUserId) {
        var builder = Jwts.builder()
                .issuer(issuer)
                .audience().add(audience).and()
                .subject("alice@eventos.security")
                .claim("userId", userId.toString())
                .claim("tenantId", tenantId.toString())
                .claim("roles", List.of("ADMIN"))
                .claim("permissions", List.of("CRM_READ", "CRM_WRITE"))
                .issuedAt(issuedAt)
                .expiration(new Date(System.currentTimeMillis() + 3600_000))
                .signWith(keyPair.getPrivate());

        if (sessionId != null) {
            builder.claim("sessionId", sessionId.toString());
        }
        if (Boolean.TRUE.equals(impersonated)) {
            builder.claim("impersonated", true);
            if (adminUserId != null) {
                builder.claim("adminUserId", adminUserId);
            }
        }
        return builder.compact();
    }

    @Test
    @DisplayName("2N-J: Valid JWT with correct issuer and audience passes and forwards security headers")
    void testValidTokenPassesAndForwardsHeaders() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        String token = createToken("eventos-auth-service", "eventos-platform", userId, tenantId, sessionId, new Date(), false, null);

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/crm/contacts")
                .header("Authorization", "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> forwardedExchange = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            forwardedExchange.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertNotNull(forwardedExchange.get(), "Chain must be invoked for valid token");
        var forwardedHeaders = forwardedExchange.get().getRequest().getHeaders();
        assertEquals(tenantId.toString(), forwardedHeaders.getFirst("X-Tenant-ID"));
        assertEquals(userId.toString(), forwardedHeaders.getFirst("X-User-ID"));
        assertEquals(gatewaySecret, forwardedHeaders.getFirst("X-Gateway-Secret"));
        assertNull(forwardedHeaders.getFirst("X-Impersonated"));
    }

    @Test
    @DisplayName("2N-J: JWT with invalid issuer is rejected with 401 UNAUTHORIZED")
    void testInvalidIssuerRejected() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        String token = createToken("attacker-service", "eventos-platform", userId, tenantId, null, new Date(), false, null);

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/crm/contacts")
                .header("Authorization", "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = ex -> Mono.empty();
        filter.filter(exchange, chain).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    @DisplayName("2N-J: JWT with invalid audience is rejected with 401 UNAUTHORIZED")
    void testInvalidAudienceRejected() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        String token = createToken("eventos-auth-service", "foreign-platform", userId, tenantId, null, new Date(), false, null);

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/crm/contacts")
                .header("Authorization", "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = ex -> Mono.empty();
        filter.filter(exchange, chain).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    @DisplayName("2N-C: Session-level revocation key in Redis rejects request with 401 UNAUTHORIZED")
    void testSessionRevocationRejected() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        String token = createToken("eventos-auth-service", "eventos-platform", userId, tenantId, sessionId, new Date(), false, null);

        when(redisTemplate.hasKey("session:revoked:" + sessionId)).thenReturn(Mono.just(true));

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/crm/contacts")
                .header("Authorization", "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = ex -> Mono.empty();
        filter.filter(exchange, chain).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    @DisplayName("2N-C: User-level global revocation timestamp in Redis rejects older tokens with 401 UNAUTHORIZED")
    void testUserRevocationTimestampRejected() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        long tokenIssuedAtMs = System.currentTimeMillis() - 60_000; // 1 minute ago
        long passwordChangedAtMs = System.currentTimeMillis();       // just now

        String token = createToken("eventos-auth-service", "eventos-platform", userId, tenantId, null, new Date(tokenIssuedAtMs), false, null);

        when(valueOperations.get("user:revoked_before:" + userId)).thenReturn(Mono.just(String.valueOf(passwordChangedAtMs)));

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/crm/contacts")
                .header("Authorization", "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = ex -> Mono.empty();
        filter.filter(exchange, chain).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    @DisplayName("2N-F: SuperAdmin Impersonation forwards X-Impersonated and X-Admin-User-ID headers")
    void testImpersonationClaimsForwarded() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        UUID adminUserId = UUID.randomUUID();
        String token = createToken("eventos-auth-service", "eventos-platform", userId, tenantId, null, new Date(), true, adminUserId.toString());

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/event/events")
                .header("Authorization", "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> forwardedExchange = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            forwardedExchange.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertNotNull(forwardedExchange.get());
        var forwardedHeaders = forwardedExchange.get().getRequest().getHeaders();
        assertEquals("true", forwardedHeaders.getFirst("X-Impersonated"));
        assertEquals(adminUserId.toString(), forwardedHeaders.getFirst("X-Admin-User-ID"));
    }

    @Test
    @DisplayName("2N-C: In production profile, Redis errors during revocation check fail closed with 401 UNAUTHORIZED")
    void testRedisErrorFailsClosedInProd() {
        environment.setActiveProfiles("prod");

        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        String token = createToken("eventos-auth-service", "eventos-platform", userId, tenantId, null, new Date(), false, null);

        when(redisTemplate.hasKey(any(String.class))).thenReturn(Mono.error(new RuntimeException("Redis connection pool exhausted")));

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/crm/contacts")
                .header("Authorization", "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = ex -> Mono.empty();
        filter.filter(exchange, chain).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode(),
                "In production profile, Redis failure during revocation checks must fail closed");
    }
}
