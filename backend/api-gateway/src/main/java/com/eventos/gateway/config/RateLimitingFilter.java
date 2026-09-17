package com.eventos.gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Range;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
@SuppressWarnings("null")
public class RateLimitingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    private static final Pattern IPV4_PATTERN = Pattern.compile("^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$");
    private static final Pattern IPV6_PATTERN = Pattern.compile("^[0-9a-fA-F:]+$");

    private final ReactiveStringRedisTemplate redisTemplate;

    @Autowired(required = false)
    private Environment environment;

    @Value("${app.rate-limiting.enabled:true}")
    private boolean enabled;

    @Value("${app.rate-limiting.default-limit:120}")
    private int defaultLimit;

    @Value("${app.rate-limiting.default-window-seconds:60}")
    private int defaultWindowSeconds;

    @Value("${app.rate-limiting.auth-login-limit:10}")
    private int authLoginLimit;

    @Value("${app.rate-limiting.auth-login-window-seconds:60}")
    private int authLoginWindowSeconds;

    @Value("${app.rate-limiting.auth-register-limit:5}")
    private int authRegisterLimit;

    @Value("${app.rate-limiting.auth-register-window-seconds:60}")
    private int authRegisterWindowSeconds;

    @Value("${app.rate-limiting.password-reset-limit:5}")
    private int passwordResetLimit;

    @Value("${app.rate-limiting.password-reset-window-seconds:60}")
    private int passwordResetWindowSeconds;

    @Value("${app.rate-limiting.otp-limit:5}")
    private int otpLimit;

    @Value("${app.rate-limiting.otp-window-seconds:60}")
    private int otpWindowSeconds;

    @Value("${app.rate-limiting.magic-link-limit:5}")
    private int magicLinkLimit;

    @Value("${app.rate-limiting.magic-link-window-seconds:60}")
    private int magicLinkWindowSeconds;

    @Value("${app.rate-limiting.refresh-limit:60}")
    private int refreshLimit;

    @Value("${app.rate-limiting.refresh-window-seconds:60}")
    private int refreshWindowSeconds;

    @Value("${app.rate-limiting.logout-limit:20}")
    private int logoutLimit;

    @Value("${app.rate-limiting.logout-window-seconds:60}")
    private int logoutWindowSeconds;

    @Value("${app.rate-limiting.superadmin-mutation-limit:10}")
    private int superAdminMutationLimit;

    @Value("${app.rate-limiting.superadmin-mutation-window-seconds:60}")
    private int superAdminMutationWindowSeconds;

    @Value("${app.rate-limiting.superadmin-read-limit:30}")
    private int superAdminReadLimit;

    @Value("${app.rate-limiting.superadmin-read-window-seconds:60}")
    private int superAdminReadWindowSeconds;

    @Value("${app.rate-limiting.public-limit:60}")
    private int publicLimit;

    @Value("${app.rate-limiting.public-window-seconds:60}")
    private int publicWindowSeconds;

    @Value("${app.rate-limiting.trusted-proxies:127.0.0.1,::1}")
    private String trustedProxies;

    @org.springframework.beans.factory.annotation.Autowired
    public RateLimitingFilter(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean isProductionProfile() {
        if (environment != null) {
            for (String profile : environment.getActiveProfiles()) {
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

    public boolean isSensitiveEndpoint(RouteCategory category) {
        return category == RouteCategory.AUTH_LOGIN
                || category == RouteCategory.AUTH_REGISTER
                || category == RouteCategory.PASSWORD_RESET
                || category == RouteCategory.OTP
                || category == RouteCategory.MAGIC_LINK
                || category == RouteCategory.SESSION_REFRESH
                || category == RouteCategory.SUPERADMIN_MUTATION;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!enabled) {
            return chain.filter(exchange);
        }

        String path = exchange.getRequest().getPath().toString();
        HttpMethod method = exchange.getRequest().getMethod();

        // 1. Categorize request into discrete protection tiers
        RouteCategory category = categorizeRoute(path, method);
        int limit = getLimitForCategory(category);
        int windowSeconds = getWindowForCategory(category);

        // 2. Identify the rate limit key (User ID -> Tenant ID -> Client IP)
        String userId = exchange.getRequest().getHeaders().getFirst("X-User-ID");
        String tenantId = exchange.getRequest().getHeaders().getFirst("X-Tenant-ID");
        String clientIp = resolveClientIp(exchange);

        String identifierKey;
        if (userId != null && !userId.trim().isEmpty()) {
            identifierKey = "user:" + userId.trim();
        } else if (tenantId != null && !tenantId.trim().isEmpty()) {
            identifierKey = "tenant:" + tenantId.trim();
        } else {
            identifierKey = "ip:" + clientIp;
        }

        String redisKey = "gateway:rate:limit:" + category.name().toLowerCase() + ":" + identifierKey;

        // 3. Sliding Window Algorithm using Redis Sorted Set (ZSET)
        long now = System.currentTimeMillis();
        long windowStart = now - (windowSeconds * 1000L);
        String member = UUID.randomUUID().toString() + ":" + now;

        final int finalLimit = limit;
        final int finalWindowSeconds = windowSeconds;
        final RouteCategory finalCategory = category;
        final String finalIdentifierKey = identifierKey;

        return redisTemplate.opsForZSet().add(redisKey, member, (double) now)
                .flatMap(added -> redisTemplate.opsForZSet().removeRangeByScore(redisKey, Range.closed(0.0, (double) windowStart)))
                .flatMap(removed -> redisTemplate.opsForZSet().size(redisKey))
                .flatMap(count -> {
                    if (count > finalLimit) {
                        log.warn("[RATE_LIMIT_TRIGGERED] Category: {}, Client: {}, Limit: {}, Current: {}, Window: {}s",
                                finalCategory, finalIdentifierKey, finalLimit, count, finalWindowSeconds);

                        // Calculate Retry-After based on oldest timestamp in current window
                        return redisTemplate.opsForZSet().range(redisKey, Range.closed(0L, 0L))
                                .next() // Get first (oldest) member
                                .map(oldestMember -> {
                                    long retryAfter = (long) finalWindowSeconds;
                                    try {
                                        String[] parts = oldestMember.split(":");
                                        if (parts.length > 1) {
                                            long oldestTimestamp = Long.parseLong(parts[1]);
                                            retryAfter = Math.max(1L, (oldestTimestamp + (finalWindowSeconds * 1000L) - now) / 1000L);
                                        }
                                    } catch (Exception ignored) {
                                        // Fallback to full window
                                    }
                                    return retryAfter;
                                })
                                .defaultIfEmpty((long) finalWindowSeconds)
                                .flatMap(retryAfter -> buildTooManyRequestsResponse(exchange, retryAfter));
                    }

                    // Set TTL on key to guarantee unbounded growth prevention
                    return redisTemplate.expire(redisKey, Duration.ofSeconds(finalWindowSeconds))
                            .then(chain.filter(exchange));
                })
                .onErrorResume(e -> {
                    // Outage policy:
                    // Production + Sensitive Endpoint -> Fail Closed (HTTP 503 with generic body, no Redis internals)
                    // General endpoints or non-production -> Fail Open
                    if (isProductionProfile() && isSensitiveEndpoint(finalCategory)) {
                        log.error("[RATE_LIMIT_OUTAGE_FAIL_CLOSED] Sensitive route blocked during Redis outage in production: Category={}, Client={}, Error={}",
                                finalCategory, finalIdentifierKey, e.getMessage());
                        return buildServiceUnavailableResponse(exchange, 60);
                    } else {
                        log.warn("[RATE_LIMIT_OUTAGE_FAIL_OPEN] Request allowed downstream during Redis outage: Category={}, Client={}, Error={}",
                                finalCategory, finalIdentifierKey, e.getMessage());
                        return chain.filter(exchange);
                    }
                });
    }

    public RouteCategory categorizeRoute(String path, HttpMethod method) {
        if (path.contains("/billing/superadmin") || path.contains("/superadmin/")) {
            if (HttpMethod.GET.equals(method) || HttpMethod.HEAD.equals(method)) {
                return RouteCategory.SUPERADMIN_READ;
            } else {
                return RouteCategory.SUPERADMIN_MUTATION;
            }
        } else if (path.contains("/auth/login")) {
            return RouteCategory.AUTH_LOGIN;
        } else if (path.contains("/auth/register")) {
            return RouteCategory.AUTH_REGISTER;
        } else if (path.contains("/auth/forgot-password") || path.contains("/auth/reset-password")) {
            return RouteCategory.PASSWORD_RESET;
        } else if (path.contains("/auth/verify-otp") || path.contains("/auth/send-whatsapp-otp") || path.contains("/auth/verify-whatsapp-otp")) {
            return RouteCategory.OTP;
        } else if (path.contains("/auth/magic-link") || path.contains("/auth/verify-magic-token")) {
            return RouteCategory.MAGIC_LINK;
        } else if (path.contains("/auth/verify-email") || path.contains("/auth/resend-verification") || path.contains("/auth/accept-invite")) {
            return RouteCategory.EMAIL_VERIFY;
        } else if (path.contains("/auth/refresh")) {
            return RouteCategory.SESSION_REFRESH;
        } else if (path.contains("/auth/logout") || path.contains("/auth/switch")) {
            return RouteCategory.SESSION_LOGOUT;
        } else if (path.contains("/gallery/share/public/") || path.contains("/crm/quotes/public/")) {
            return RouteCategory.PUBLIC_CONTENT;
        }
        return RouteCategory.DEFAULT;
    }

    private int getLimitForCategory(RouteCategory category) {
        return switch (category) {
            case AUTH_LOGIN -> authLoginLimit;
            case AUTH_REGISTER -> authRegisterLimit;
            case PASSWORD_RESET -> passwordResetLimit;
            case OTP -> otpLimit;
            case MAGIC_LINK -> magicLinkLimit;
            case EMAIL_VERIFY -> authRegisterLimit * 2;
            case SESSION_REFRESH -> refreshLimit;
            case SESSION_LOGOUT -> logoutLimit;
            case SUPERADMIN_MUTATION -> superAdminMutationLimit;
            case SUPERADMIN_READ -> superAdminReadLimit;
            case PUBLIC_CONTENT -> publicLimit;
            default -> defaultLimit;
        };
    }

    private int getWindowForCategory(RouteCategory category) {
        return switch (category) {
            case AUTH_LOGIN -> authLoginWindowSeconds;
            case AUTH_REGISTER -> authRegisterWindowSeconds;
            case PASSWORD_RESET -> passwordResetWindowSeconds;
            case OTP -> otpWindowSeconds;
            case MAGIC_LINK -> magicLinkWindowSeconds;
            case EMAIL_VERIFY -> authRegisterWindowSeconds;
            case SESSION_REFRESH -> refreshWindowSeconds;
            case SESSION_LOGOUT -> logoutWindowSeconds;
            case SUPERADMIN_MUTATION -> superAdminMutationWindowSeconds;
            case SUPERADMIN_READ -> superAdminReadWindowSeconds;
            case PUBLIC_CONTENT -> publicWindowSeconds;
            default -> defaultWindowSeconds;
        };
    }

    public String resolveClientIp(ServerWebExchange exchange) {
        java.net.InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
        String remoteIp = "unknown";
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            remoteIp = remoteAddress.getAddress().getHostAddress();
        }

        // Only trust forwarded headers if immediate peer is an explicitly trusted proxy
        if (isTrustedProxy(remoteIp)) {
            String xForwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
                String[] ips = xForwardedFor.split(",");
                String candidate = ips[0].trim();
                if (isValidIp(candidate)) {
                    return candidate;
                }
            }
            String xRealIp = exchange.getRequest().getHeaders().getFirst("X-Real-IP");
            if (xRealIp != null && !xRealIp.trim().isEmpty()) {
                String candidate = xRealIp.trim();
                if (isValidIp(candidate)) {
                    return candidate;
                }
            }
        }

        return remoteIp;
    }

    public boolean isTrustedProxy(String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return false;
        }
        String cleanIp = ip.trim();

        // Loopback is trusted
        if (cleanIp.equals("127.0.0.1") || cleanIp.equals("::1") || cleanIp.equals("0:0:0:0:0:0:0:1")) {
            return true;
        }

        // Check explicit trusted proxies configuration
        if (trustedProxies != null && !trustedProxies.trim().isEmpty()) {
            String[] configured = trustedProxies.split(",");
            for (String entry : configured) {
                String trimmed = entry.trim();
                if (trimmed.isEmpty()) continue;
                if (trimmed.equalsIgnoreCase(cleanIp)) {
                    return true;
                }
                // Handle simple CIDR matching if configured (e.g. 10.0.0.0/24)
                if (trimmed.contains("/") && matchesCidr(cleanIp, trimmed)) {
                    return true;
                }
            }
        }

        // Do NOT blindly trust arbitrary RFC 1918 private IPs
        return false;
    }

    private boolean matchesCidr(String ip, String cidr) {
        try {
            String[] parts = cidr.split("/");
            if (parts.length != 2) return false;
            String baseIp = parts[0].trim();
            int prefixLength = Integer.parseInt(parts[1].trim());

            java.net.InetAddress addr = java.net.InetAddress.getByName(ip);
            java.net.InetAddress baseAddr = java.net.InetAddress.getByName(baseIp);

            byte[] addrBytes = addr.getAddress();
            byte[] baseBytes = baseAddr.getAddress();
            if (addrBytes.length != baseBytes.length) return false;

            int bytesToCheck = prefixLength / 8;
            int remainingBits = prefixLength % 8;

            for (int i = 0; i < bytesToCheck; i++) {
                if (addrBytes[i] != baseBytes[i]) return false;
            }

            if (remainingBits > 0 && bytesToCheck < addrBytes.length) {
                int mask = (0xFF << (8 - remainingBits)) & 0xFF;
                if ((addrBytes[bytesToCheck] & mask) != (baseBytes[bytesToCheck] & mask)) {
                    return false;
                }
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isValidIp(String ip) {
        if (ip == null || ip.isEmpty() || ip.length() > 45) {
            return false;
        }
        if (IPV4_PATTERN.matcher(ip).matches()) {
            return true;
        }
        return ip.contains(":") && IPV6_PATTERN.matcher(ip).matches();
    }

    private Mono<Void> buildTooManyRequestsResponse(ServerWebExchange exchange, long retryAfter) {
        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        exchange.getResponse().getHeaders().set("Retry-After", String.valueOf(retryAfter));

        String body = String.format("{\"success\":false,\"code\":\"RATE_LIMITED\",\"message\":\"Too many requests. Please try again later.\",\"error\":{\"code\":\"RATE_LIMITED\",\"message\":\"Too many requests. Please try again later.\"}}");
        byte[] bytes = body.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
    }

    private Mono<Void> buildServiceUnavailableResponse(ServerWebExchange exchange, long retryAfter) {
        exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        exchange.getResponse().getHeaders().set("Retry-After", String.valueOf(retryAfter));

        String body = "{\"success\":false,\"code\":\"SERVICE_UNAVAILABLE\",\"message\":\"Authentication service temporarily unavailable. Please try again later.\",\"error\":{\"code\":\"SERVICE_UNAVAILABLE\",\"message\":\"Authentication service temporarily unavailable. Please try again later.\"}}";
        byte[] bytes = body.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
    }

    @Override
    public int getOrder() {
        return 1; // Executes AFTER JwtAuthFilter (-1) so verified X-User-ID / X-Tenant-ID headers are available
    }

    public enum RouteCategory {
        AUTH_LOGIN,
        AUTH_REGISTER,
        PASSWORD_RESET,
        OTP,
        MAGIC_LINK,
        EMAIL_VERIFY,
        SESSION_REFRESH,
        SESSION_LOGOUT,
        SUPERADMIN_MUTATION,
        SUPERADMIN_READ,
        PUBLIC_CONTENT,
        DEFAULT
    }
}
