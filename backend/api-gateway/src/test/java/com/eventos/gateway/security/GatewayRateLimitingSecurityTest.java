package com.eventos.gateway.security;

import com.eventos.gateway.config.RateLimitingFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Range;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveZSetOperations;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@DisplayName("Gateway Rate Limiting & Abuse Protection Security Test")
public class GatewayRateLimitingSecurityTest {

    private ReactiveStringRedisTemplate redisTemplate;
    private ReactiveZSetOperations<String, String> zSetOps;
    private GatewayFilterChain filterChain;
    private RateLimitingFilter filter;
    private Environment environment;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        redisTemplate = Mockito.mock(ReactiveStringRedisTemplate.class);
        zSetOps = Mockito.mock(ReactiveZSetOperations.class);
        filterChain = Mockito.mock(GatewayFilterChain.class);
        environment = Mockito.mock(Environment.class);

        when(redisTemplate.opsForZSet()).thenReturn(zSetOps);
        when(filterChain.filter(any())).thenReturn(Mono.empty());
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

        filter = new RateLimitingFilter(redisTemplate);
        ReflectionTestUtils.setField(filter, "environment", environment);

        // Configure deterministic thresholds
        ReflectionTestUtils.setField(filter, "enabled", true);
        ReflectionTestUtils.setField(filter, "defaultLimit", 120);
        ReflectionTestUtils.setField(filter, "defaultWindowSeconds", 60);
        ReflectionTestUtils.setField(filter, "authLoginLimit", 10);
        ReflectionTestUtils.setField(filter, "authLoginWindowSeconds", 60);
        ReflectionTestUtils.setField(filter, "superAdminMutationLimit", 10);
        ReflectionTestUtils.setField(filter, "superAdminMutationWindowSeconds", 60);
        ReflectionTestUtils.setField(filter, "superAdminReadLimit", 30);
        ReflectionTestUtils.setField(filter, "superAdminReadWindowSeconds", 60);
        ReflectionTestUtils.setField(filter, "refreshLimit", 60);
        ReflectionTestUtils.setField(filter, "refreshWindowSeconds", 60);
        ReflectionTestUtils.setField(filter, "trustedProxies", "127.0.0.1,::1,10.0.0.2");
    }

    @Test
    @DisplayName("1. Under limit request is allowed downstream and sets Redis TTL")
    void underLimitRequestAllowed() {
        when(zSetOps.add(anyString(), anyString(), anyDouble())).thenReturn(Mono.just(true));
        when(zSetOps.removeRangeByScore(anyString(), any(Range.class))).thenReturn(Mono.just(0L));
        when(zSetOps.size(anyString())).thenReturn(Mono.just(2L));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login")
                .remoteAddress(new InetSocketAddress("198.51.100.10", 12345))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        assertNull(exchange.getResponse().getStatusCode());
        Mockito.verify(filterChain).filter(exchange);
        Mockito.verify(redisTemplate).expire(anyString(), any(Duration.class));
    }

    @Test
    @DisplayName("2. Exceeding limit returns HTTP 429 with Retry-After header and generic body")
    void exceedingLimitReturns429WithRetryAfter() {
        when(zSetOps.add(anyString(), anyString(), anyDouble())).thenReturn(Mono.just(true));
        when(zSetOps.removeRangeByScore(anyString(), any(Range.class))).thenReturn(Mono.just(0L));
        when(zSetOps.size(anyString())).thenReturn(Mono.just(11L)); // Exceeds limit of 10

        long now = System.currentTimeMillis();
        when(zSetOps.range(anyString(), any(Range.class)))
                .thenReturn(Flux.just("uuid:" + (now - 20000L))); // 20s old in a 60s window -> retry-after ~40s

        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login")
                .remoteAddress(new InetSocketAddress("198.51.100.10", 12345))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exchange.getResponse().getStatusCode());
        String retryAfter = exchange.getResponse().getHeaders().getFirst("Retry-After");
        assertNotNull(retryAfter);
        assertTrue(Long.parseLong(retryAfter) > 0 && Long.parseLong(retryAfter) <= 60);

        Mockito.verify(filterChain, Mockito.never()).filter(any());
    }

    @Test
    @DisplayName("3. Anti-spoofing: Direct public client sending spoofed XFF is ignored")
    void directAttackerSpoofedXffIgnored() {
        when(zSetOps.add(anyString(), anyString(), anyDouble())).thenReturn(Mono.just(true));
        when(zSetOps.removeRangeByScore(anyString(), any(Range.class))).thenReturn(Mono.just(0L));
        when(zSetOps.size(anyString())).thenReturn(Mono.just(1L));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login")
                .remoteAddress(new InetSocketAddress("203.0.113.55", 54321))
                .header("X-Forwarded-For", "198.51.100.99")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        // Key must bind to direct public remote socket, NOT spoofed XFF
        Mockito.verify(zSetOps).add(argThat(key -> key.contains("ip:203.0.113.55") && !key.contains("198.51.100.99")),
                anyString(), anyDouble());
    }

    @Test
    @DisplayName("4. Anti-spoofing: Untrusted RFC1918 private network peer sending spoofed XFF is ignored")
    void untrustedPrivateNetworkPeerSpoofedXffIgnored() {
        when(zSetOps.add(anyString(), anyString(), anyDouble())).thenReturn(Mono.just(true));
        when(zSetOps.removeRangeByScore(anyString(), any(Range.class))).thenReturn(Mono.just(0L));
        when(zSetOps.size(anyString())).thenReturn(Mono.just(1L));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        // 10.244.0.15 is a private IP, but NOT in trustedProxies (127.0.0.1,::1,10.0.0.2)
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login")
                .remoteAddress(new InetSocketAddress("10.244.0.15", 54321))
                .header("X-Forwarded-For", "198.51.100.99")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        // Key must bind to socket address 10.244.0.15, NOT spoofed header
        Mockito.verify(zSetOps).add(argThat(key -> key.contains("ip:10.244.0.15") && !key.contains("198.51.100.99")),
                anyString(), anyDouble());
    }

    @Test
    @DisplayName("5. Trusted proxy: Explicit trusted proxy peer extracts client IP from XFF")
    void trustedProxyExtractsClientIpFromHeader() {
        when(zSetOps.add(anyString(), anyString(), anyDouble())).thenReturn(Mono.just(true));
        when(zSetOps.removeRangeByScore(anyString(), any(Range.class))).thenReturn(Mono.just(0L));
        when(zSetOps.size(anyString())).thenReturn(Mono.just(1L));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        // 10.0.0.2 is explicitly in trustedProxies
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login")
                .remoteAddress(new InetSocketAddress("10.0.0.2", 8080))
                .header("X-Forwarded-For", "198.51.100.99")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        Mockito.verify(zSetOps).add(argThat(key -> key.contains("ip:198.51.100.99")),
                anyString(), anyDouble());
    }

    @Test
    @DisplayName("6. Multiple XFF entries: Extracts leftmost client IP")
    void multipleXffEntriesExtractsLeftmost() {
        when(zSetOps.add(anyString(), anyString(), anyDouble())).thenReturn(Mono.just(true));
        when(zSetOps.removeRangeByScore(anyString(), any(Range.class))).thenReturn(Mono.just(0L));
        when(zSetOps.size(anyString())).thenReturn(Mono.just(1L));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login")
                .remoteAddress(new InetSocketAddress("127.0.0.1", 8080))
                .header("X-Forwarded-For", "203.0.113.1, 10.0.0.1, 127.0.0.1")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        Mockito.verify(zSetOps).add(argThat(key -> key.contains("ip:203.0.113.1")),
                anyString(), anyDouble());
    }

    @Test
    @DisplayName("7. Malformed XFF: Fallback to socket IP")
    void malformedXffFallsBackToSocketIp() {
        when(zSetOps.add(anyString(), anyString(), anyDouble())).thenReturn(Mono.just(true));
        when(zSetOps.removeRangeByScore(anyString(), any(Range.class))).thenReturn(Mono.just(0L));
        when(zSetOps.size(anyString())).thenReturn(Mono.just(1L));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login")
                .remoteAddress(new InetSocketAddress("127.0.0.1", 8080))
                .header("X-Forwarded-For", "invalid..ip//injection")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        Mockito.verify(zSetOps).add(argThat(key -> key.contains("ip:127.0.0.1")),
                anyString(), anyDouble());
    }

    @Test
    @DisplayName("8. IPv6 handling: Trusted proxy with valid IPv6 client is parsed correctly")
    void ipv6ClientIpParsedCorrectly() {
        when(zSetOps.add(anyString(), anyString(), anyDouble())).thenReturn(Mono.just(true));
        when(zSetOps.removeRangeByScore(anyString(), any(Range.class))).thenReturn(Mono.just(0L));
        when(zSetOps.size(anyString())).thenReturn(Mono.just(1L));
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login")
                .remoteAddress(new InetSocketAddress("127.0.0.1", 8080))
                .header("X-Forwarded-For", "2001:db8:85a3::8a2e:370:7334")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        Mockito.verify(zSetOps).add(argThat(key -> key.contains("ip:2001:db8:85a3::8a2e:370:7334")),
                anyString(), anyDouble());
    }

    @Test
    @DisplayName("9. SuperAdmin Mutation routes enforce strict limit (10 req/60s)")
    void superAdminMutationEnforcesStricterLimit() {
        when(zSetOps.add(anyString(), anyString(), anyDouble())).thenReturn(Mono.just(true));
        when(zSetOps.removeRangeByScore(anyString(), any(Range.class))).thenReturn(Mono.just(0L));
        when(zSetOps.size(anyString())).thenReturn(Mono.just(11L)); // Over 10
        when(zSetOps.range(anyString(), any(Range.class))).thenReturn(Flux.empty());

        MockServerHttpRequest request = MockServerHttpRequest.method(HttpMethod.POST, "/api/v1/auth/billing/superadmin/tenants/1/status")
                .remoteAddress(new InetSocketAddress("127.0.0.1", 8080))
                .header("X-User-ID", "admin-1")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exchange.getResponse().getStatusCode());
        Mockito.verify(filterChain, Mockito.never()).filter(any());
        Mockito.verify(zSetOps).add(argThat(key -> key.contains("superadmin_mutation")), anyString(), anyDouble());
    }

    @Test
    @DisplayName("10. SuperAdmin Read routes enforce read limit (30 req/60s)")
    void superAdminReadEnforcesReadLimit() {
        when(zSetOps.add(anyString(), anyString(), anyDouble())).thenReturn(Mono.just(true));
        when(zSetOps.removeRangeByScore(anyString(), any(Range.class))).thenReturn(Mono.just(0L));
        when(zSetOps.size(anyString())).thenReturn(Mono.just(15L)); // 15 req: allowed under 30 limit for READ
        when(redisTemplate.expire(anyString(), any(Duration.class))).thenReturn(Mono.just(true));

        MockServerHttpRequest request = MockServerHttpRequest.method(HttpMethod.GET, "/api/v1/auth/billing/superadmin/tenants")
                .remoteAddress(new InetSocketAddress("127.0.0.1", 8080))
                .header("X-User-ID", "admin-1")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        assertNull(exchange.getResponse().getStatusCode());
        Mockito.verify(filterChain).filter(exchange);
        Mockito.verify(zSetOps).add(argThat(key -> key.contains("superadmin_read")), anyString(), anyDouble());
    }

    @Test
    @DisplayName("11. Outage Policy: Production Redis outage on sensitive endpoint fails closed with HTTP 503")
    void productionRedisOutageFailsClosedForSensitiveEndpoint() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
        when(zSetOps.add(anyString(), anyString(), anyDouble()))
                .thenReturn(Mono.error(new RuntimeException("Redis connection pool exhausted")));

        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login")
                .remoteAddress(new InetSocketAddress("198.51.100.10", 12345))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        // Must fail closed with 503 Service Unavailable and Retry-After header
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exchange.getResponse().getStatusCode());
        assertNotNull(exchange.getResponse().getHeaders().getFirst("Retry-After"));
        Mockito.verify(filterChain, Mockito.never()).filter(any());
    }

    @Test
    @DisplayName("12. Outage Policy: Production Redis outage on general API fails open")
    void productionRedisOutageFailsOpenForGeneralApi() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});
        when(zSetOps.add(anyString(), anyString(), anyDouble()))
                .thenReturn(Mono.error(new RuntimeException("Redis connection pool exhausted")));

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/gallery/share/public/album123")
                .remoteAddress(new InetSocketAddress("198.51.100.10", 12345))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        // Must fail open and pass downstream
        assertNull(exchange.getResponse().getStatusCode());
        Mockito.verify(filterChain).filter(exchange);
    }

    @Test
    @DisplayName("13. Outage Policy: Development Redis outage on sensitive endpoint fails open")
    void devRedisOutageFailsOpen() {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});
        when(zSetOps.add(anyString(), anyString(), anyDouble()))
                .thenReturn(Mono.error(new RuntimeException("Local Redis not running")));

        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login")
                .remoteAddress(new InetSocketAddress("198.51.100.10", 12345))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        // In dev, fail open so developers are not blocked
        assertNull(exchange.getResponse().getStatusCode());
        Mockito.verify(filterChain).filter(exchange);
    }
}
