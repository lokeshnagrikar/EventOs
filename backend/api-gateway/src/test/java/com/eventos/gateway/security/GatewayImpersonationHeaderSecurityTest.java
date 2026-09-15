package com.eventos.gateway.security;

import com.eventos.gateway.config.JwtAuthFilter;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@DisplayName("2Q-03 — Gateway Identity & Impersonation Header Trust Security Tests")
class GatewayImpersonationHeaderSecurityTest {

    private JwtAuthFilter filter;
    private ReactiveStringRedisTemplate redisTemplate;
    private ReactiveValueOperations<String, String> valueOperations;
    private MockEnvironment environment;
    private KeyPair keyPair;
    private String gatewaySecret = "TrustedGatewaySecret99999999999999";

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        keyPair = kpg.generateKeyPair();

        redisTemplate = Mockito.mock(ReactiveStringRedisTemplate.class);
        valueOperations = Mockito.mock(ReactiveValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

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

    private String createToken(UUID userId, UUID tenantId, String role, Boolean impersonated, String adminUserId) {
        var builder = Jwts.builder()
                .issuer("eventos-auth-service")
                .audience().add("eventos-platform").and()
                .subject("legitimate-user@eventos.com")
                .claim("userId", userId.toString())
                .claim("tenantId", tenantId.toString())
                .claim("roles", List.of(role))
                .claim("permissions", List.of("EVENT_READ"))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600_000))
                .signWith(keyPair.getPrivate());

        if (Boolean.TRUE.equals(impersonated)) {
            builder.claim("impersonated", true);
            if (adminUserId != null) {
                builder.claim("adminUserId", adminUserId);
            }
        }
        return builder.compact();
    }

    @Test
    @DisplayName("1. Forged X-Impersonated, X-Admin-User-ID, and X-Original-Admin-ID headers are stripped for non-impersonated JWT")
    void testForgedImpersonationHeadersAreStripped() {
        UUID legitUserId = UUID.randomUUID();
        UUID legitTenantId = UUID.randomUUID();
        String token = createToken(legitUserId, legitTenantId, "CLIENT", false, null);

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/event/bookings")
                .header("Authorization", "Bearer " + token)
                .header("X-Impersonated", "true")
                .header("X-Admin-User-ID", UUID.randomUUID().toString())
                .header("X-Original-Admin-ID", UUID.randomUUID().toString())
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> forwardedExchange = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            forwardedExchange.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertNotNull(forwardedExchange.get());
        HttpHeaders headers = forwardedExchange.get().getRequest().getHeaders();

        assertNull(headers.getFirst("X-Impersonated"), "X-Impersonated must NOT be present when JWT claim is not impersonated");
        assertNull(headers.getFirst("X-Admin-User-ID"), "X-Admin-User-ID must NOT be present when JWT claim is not impersonated");
        assertNull(headers.getFirst("X-Original-Admin-ID"), "X-Original-Admin-ID must NOT be present when JWT claim is not impersonated");
    }

    @Test
    @DisplayName("2. Forged tenant, user, role, permission headers are stripped and replaced with verified JWT claims")
    void testForgedIdentityHeadersAreStrippedAndReplaced() {
        UUID legitUserId = UUID.randomUUID();
        UUID legitTenantId = UUID.randomUUID();
        UUID forgedTenantId = UUID.randomUUID();
        UUID forgedUserId = UUID.randomUUID();

        String token = createToken(legitUserId, legitTenantId, "STAFF", false, null);

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/crm/contacts")
                .header("Authorization", "Bearer " + token)
                .header("X-Tenant-ID", forgedTenantId.toString())
                .header("X-User-ID", forgedUserId.toString())
                .header("X-User-Roles", "SUPER_ADMIN,OWNER")
                .header("X-User-Permissions", "ALL_PERMISSIONS")
                .header("X-Gateway-Secret", "spoofed-secret")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> forwardedExchange = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            forwardedExchange.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertNotNull(forwardedExchange.get());
        HttpHeaders headers = forwardedExchange.get().getRequest().getHeaders();

        // Authoritative claims from token MUST override client headers
        assertEquals(legitTenantId.toString(), headers.getFirst("X-Tenant-ID"), "Must use token tenantId, not forged client header");
        assertEquals(legitUserId.toString(), headers.getFirst("X-User-ID"), "Must use token userId, not forged client header");
        assertTrue(headers.getFirst("X-User-Roles").contains("STAFF"), "Must use token roles, not forged SUPER_ADMIN");
        assertFalse(headers.getFirst("X-User-Roles").contains("SUPER_ADMIN"), "Forged role must not be present");
        assertEquals(gatewaySecret, headers.getFirst("X-Gateway-Secret"), "Gateway secret must be gateway's own secret");
    }

    @Test
    @DisplayName("3. Valid impersonated JWT properly populates X-Impersonated, X-Admin-User-ID, and X-Original-Admin-ID")
    void testValidImpersonatedJwtProperlyGeneratesHeaders() {
        UUID targetUserId = UUID.randomUUID();
        UUID targetTenantId = UUID.randomUUID();
        UUID adminUserId = UUID.randomUUID();

        String token = createToken(targetUserId, targetTenantId, "ADMIN", true, adminUserId.toString());

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/event/bookings")
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
        HttpHeaders headers = forwardedExchange.get().getRequest().getHeaders();

        assertEquals("true", headers.getFirst("X-Impersonated"));
        assertEquals(adminUserId.toString(), headers.getFirst("X-Admin-User-ID"));
        assertEquals(adminUserId.toString(), headers.getFirst("X-Original-Admin-ID"));
        assertEquals(targetUserId.toString(), headers.getFirst("X-User-ID"));
        assertEquals(targetTenantId.toString(), headers.getFirst("X-Tenant-ID"));
    }

    @Test
    @DisplayName("4. Public endpoint strips client-supplied identity & impersonation headers")
    void testPublicEndpointStripsClientHeaders() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/auth/login")
                .header("X-Tenant-ID", UUID.randomUUID().toString())
                .header("X-User-ID", UUID.randomUUID().toString())
                .header("X-User-Roles", "SUPER_ADMIN")
                .header("X-Impersonated", "true")
                .header("X-Admin-User-ID", UUID.randomUUID().toString())
                .header("X-Gateway-Secret", "forged-secret")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        AtomicReference<ServerWebExchange> forwardedExchange = new AtomicReference<>();
        GatewayFilterChain chain = ex -> {
            forwardedExchange.set(ex);
            return Mono.empty();
        };

        filter.filter(exchange, chain).block();

        assertNotNull(forwardedExchange.get());
        HttpHeaders headers = forwardedExchange.get().getRequest().getHeaders();

        assertNull(headers.getFirst("X-Tenant-ID"));
        assertNull(headers.getFirst("X-User-ID"));
        assertNull(headers.getFirst("X-User-Roles"));
        assertNull(headers.getFirst("X-Impersonated"));
        assertNull(headers.getFirst("X-Admin-User-ID"));
        assertEquals(gatewaySecret, headers.getFirst("X-Gateway-Secret"));
        assertNotNull(headers.getFirst("X-Trace-ID"));
    }
}
