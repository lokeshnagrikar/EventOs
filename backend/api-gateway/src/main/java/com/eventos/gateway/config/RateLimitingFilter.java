package com.eventos.gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Range;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.UUID;

@Component
@SuppressWarnings("null")
public class RateLimitingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    private final ReactiveStringRedisTemplate redisTemplate;

    @Value("${app.rate-limiting.enabled:true}")
    private boolean enabled;

    @Value("${app.rate-limiting.default-limit:100}")
    private int defaultLimit;

    @Value("${app.rate-limiting.default-window-seconds:60}")
    private int defaultWindowSeconds;

    @Value("${app.rate-limiting.auth-login-limit:5}")
    private int authLoginLimit;

    @Value("${app.rate-limiting.auth-login-window-seconds:10}")
    private int authLoginWindowSeconds;

    @Value("${app.rate-limiting.auth-register-limit:5}")
    private int authRegisterLimit;

    @Value("${app.rate-limiting.auth-register-window-seconds:10}")
    private int authRegisterWindowSeconds;

    @Value("${app.rate-limiting.password-reset-limit:3}")
    private int passwordResetLimit;

    @Value("${app.rate-limiting.password-reset-window-seconds:60}")
    private int passwordResetWindowSeconds;

    public RateLimitingFilter(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!enabled) {
            return chain.filter(exchange);
        }

        String path = exchange.getRequest().getPath().toString();

        // 1. Determine the rate limits based on the request path
        int limit = defaultLimit;
        int windowSeconds = defaultWindowSeconds;

        if (path.contains("/auth/login")) {
            limit = authLoginLimit;
            windowSeconds = authLoginWindowSeconds;
        } else if (path.contains("/auth/register")) {
            limit = authRegisterLimit;
            windowSeconds = authRegisterWindowSeconds;
        } else if (path.contains("/auth/forgot-password") || path.contains("/auth/reset-password")) {
            limit = passwordResetLimit;
            windowSeconds = passwordResetWindowSeconds;
        }

        // 2. Identify the rate limit key (User ID -> Tenant ID -> Client IP)
        String userId = exchange.getRequest().getHeaders().getFirst("X-User-ID");
        String tenantId = exchange.getRequest().getHeaders().getFirst("X-Tenant-ID");
        String clientIp = "unknown";
        java.net.InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            clientIp = remoteAddress.getAddress().getHostAddress();
        }

        String identifierKey;
        if (userId != null && !userId.trim().isEmpty()) {
            identifierKey = "user:" + userId;
        } else if (tenantId != null && !tenantId.trim().isEmpty()) {
            identifierKey = "tenant:" + tenantId;
        } else {
            identifierKey = "ip:" + clientIp;
        }

        String redisKey = "gateway:rate:limit:" + identifierKey + ":" + path;

        // 3. Sliding Window Algorithm using Redis Sorted Set (ZSET)
        long now = System.currentTimeMillis();
        long windowStart = now - (windowSeconds * 1000L);
        String member = UUID.randomUUID().toString() + ":" + now;

        final int finalLimit = limit;
        final int finalWindowSeconds = windowSeconds;

        return redisTemplate.opsForZSet().add(redisKey, member, (double) now)
                .flatMap(added -> redisTemplate.opsForZSet().removeRangeByScore(redisKey, Range.closed(0.0, (double) windowStart)))
                .flatMap(removed -> redisTemplate.opsForZSet().size(redisKey))
                .flatMap(count -> {
                    if (count > finalLimit) {
                        log.warn("[RATE LIMIT EXCEEDED] Key: {}, Path: {}, Limit: {}, Current Count: {}, Window: {}s",
                                redisKey, path, finalLimit, count, finalWindowSeconds);

                        // Calculate Retry-After based on oldest timestamp
                        return redisTemplate.opsForZSet().range(redisKey, Range.closed(0L, 0L))
                                .next() // Get first (oldest) member
                                .flatMap(oldestMember -> {
                                    long retryAfter = finalWindowSeconds;
                                    try {
                                        String[] parts = oldestMember.split(":");
                                        if (parts.length > 1) {
                                            long oldestTimestamp = Long.parseLong(parts[1]);
                                            retryAfter = Math.max(1L, (oldestTimestamp + (finalWindowSeconds * 1000L) - now) / 1000L);
                                        }
                                    } catch (Exception e) {
                                        // Fallback to full window
                                    }
                                    return buildTooManyRequestsResponse(exchange, retryAfter);
                                })
                                .switchIfEmpty(Mono.defer(() -> buildTooManyRequestsResponse(exchange, (long) finalWindowSeconds)));
                    }

                    // Set TTL to clean up unused keys
                    return redisTemplate.expire(redisKey, Duration.ofSeconds(finalWindowSeconds))
                            .then(chain.filter(exchange));
                })
                .onErrorResume(e -> {
                    // Fail-secure: Log error and allow request to bypass if Redis has issues
                    log.error("[RATE LIMIT ERROR] Redis operation failed, allowing request downstream: {}", e.getMessage());
                    return chain.filter(exchange);
                });
    }

    private Mono<Void> buildTooManyRequestsResponse(ServerWebExchange exchange, long retryAfter) {
        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        exchange.getResponse().getHeaders().add("Retry-After", String.valueOf(retryAfter));

        String body = String.format("{\"success\":false,\"error\":{\"code\":\"TOO_MANY_REQUESTS\",\"message\":\"Rate limit exceeded. Please try again in %d seconds.\"}}", retryAfter);
        byte[] bytes = body.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
    }

    @Override
    public int getOrder() {
        return 1; // Executes AFTER JwtAuthFilter (which is -1) to access X-User-ID and X-Tenant-ID
    }
}
