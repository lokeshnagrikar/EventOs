package com.eventos.gateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Date;
import java.util.List;

@Component
@SuppressWarnings("null")
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final ReactiveStringRedisTemplate redisTemplate;

    @Value("${app.jwt.public-key:}")
    private String rawPublicKey;

    @Value("${app.gateway.secret:}")
    private String gatewaySecret;

    private RSAPublicKey publicKey;
    private volatile io.jsonwebtoken.JwtParser jwtParser;

    @org.springframework.beans.factory.annotation.Autowired
    public JwtAuthFilter(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public JwtAuthFilter() {
        this(null);
    }

    // Public endpoints that bypass authentication
    private static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/inquiries",
            "/api/v1/auth/refresh",
            "/api/v1/auth/switch",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/bootstrap",
            "/api/v1/auth/magic-link",
            "/api/v1/auth/verify-magic-token",
            "/api/v1/auth/verify-email",
            "/api/v1/auth/verify-otp",
            "/api/v1/auth/resend-verification",
            "/api/v1/auth/accept-invite",
            "/api/v1/auth/captcha",
            "/api/v1/auth/2fa/verify",
            "/api/v1/auth/send-whatsapp-otp",
            "/api/v1/auth/verify-whatsapp-otp",
            "/api/v1/auth/ws",
            "/api/v1/auth/billing/webhook",
            "/api/v1/auth/billing/plans",
            "/api/v1/crm/quotes/public/",
            "/api/v1/gallery/share/public/",
            "/actuator"
    );

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    private javax.crypto.SecretKey symmetricKey;
    private boolean useSymmetric = false;
    private boolean isEphemeral = false;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.core.env.Environment env;

    public boolean isRs256Configured() {
        return !useSymmetric && publicKey != null && !isEphemeral;
    }

    public boolean isSymmetric() {
        return useSymmetric;
    }

    public boolean isEphemeral() {
        return isEphemeral;
    }

    private boolean isProductionProfile() {
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

    @jakarta.annotation.PostConstruct
    public void init() {
        boolean isProd = isProductionProfile();
        try {
            if (isProd) {
                if (rawPublicKey != null && !rawPublicKey.trim().isEmpty()) {
                    this.publicKey = parsePublicKey(rawPublicKey);
                    log.info("Successfully loaded JWT RSA public key for RS256 validation in production.");
                } else if (System.getenv("JWT_KEY_PATH") != null) {
                    String keyPath = System.getenv("JWT_KEY_PATH");
                    java.io.File publicKeyFile = new java.io.File(keyPath, "jwt_public.pem");
                    if (publicKeyFile.exists()) {
                        String publicPem = java.nio.file.Files.readString(publicKeyFile.toPath());
                        this.publicKey = parsePublicKey(publicPem);
                        log.info("Successfully loaded JWT RSA public key from JWT_KEY_PATH in production.");
                    } else {
                        throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Production Gateway requires explicit RS256 JWT_PUBLIC_KEY. Public key file not found in JWT_KEY_PATH: " + keyPath);
                    }
                } else {
                    throw new IllegalStateException("CRITICAL SECURITY VIOLATION: Production Gateway requires explicit RS256 JWT_PUBLIC_KEY. Insecure fallbacks and ephemeral keys are prohibited.");
                }
            } else {
                if (rawPublicKey != null && !rawPublicKey.trim().isEmpty()) {
                    this.publicKey = parsePublicKey(rawPublicKey);
                    log.info("Successfully loaded JWT RSA public key for RS256 validation.");
                } else if (System.getenv("JWT_KEY_PATH") != null) {
                    String keyPath = System.getenv("JWT_KEY_PATH");
                    java.io.File publicKeyFile = new java.io.File(keyPath, "jwt_public.pem");

                    if (publicKeyFile.exists()) {
                        String publicPem = java.nio.file.Files.readString(publicKeyFile.toPath());
                        this.publicKey = parsePublicKey(publicPem);
                        log.info("Successfully loaded shared JWT RSA public key from JWT_KEY_PATH.");
                    } else {
                        log.warn("JWT_KEY_PATH configured but jwt_public.pem missing in: {}.", keyPath);
                    }
                } else if (jwtSecret != null && !jwtSecret.trim().isEmpty() && jwtSecret.length() >= 32) {
                    byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
                    this.symmetricKey = io.jsonwebtoken.security.Keys.hmacShaKeyFor(secretBytes);
                    this.useSymmetric = true;
                    log.info("Gateway: Fallback to symmetric HS256 JWT validation enabled in non-production.");
                } else {
                    java.security.KeyPairGenerator keyGen = java.security.KeyPairGenerator.getInstance("RSA");
                    keyGen.initialize(2048);
                    java.security.KeyPair keyPair = keyGen.generateKeyPair();
                    this.publicKey = (RSAPublicKey) keyPair.getPublic();
                    this.isEphemeral = true;
                }
            }

            io.jsonwebtoken.JwtParserBuilder parserBuilder = Jwts.parser();
            if (useSymmetric) {
                parserBuilder.verifyWith(symmetricKey);
            } else {
                parserBuilder.verifyWith(publicKey);
            }
            this.jwtParser = parserBuilder.build();
        } catch (Exception e) {
            if (e instanceof IllegalStateException) {
                throw (IllegalStateException) e;
            }
            log.error("Failed to initialize JWT Cryptographic Key Parser", e);
            throw new RuntimeException("Failed to initialize JWT public key validation", e);
        }
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        
        // Bypass preflight OPTIONS requests to allow CORS filters to execute
        if (org.springframework.http.HttpMethod.OPTIONS.equals(request.getMethod())) {
            return chain.filter(exchange);
        }

        String path = request.getURI().getPath();

        // 1. Generate Correlation ID / Trace ID
        String traceId = java.util.UUID.randomUUID().toString().replace("-", "");

        // Strip incoming sensitive headers to prevent spoofing
        ServerHttpRequest cleanRequest = request.mutate()
                .headers(headers -> {
                    headers.remove("X-Tenant-ID");
                    headers.remove("X-Tenant-Id");
                    headers.remove("X-User-ID");
                    headers.remove("X-User-Id");
                    headers.remove("X-User-Email");
                    headers.remove("X-User-Roles");
                    headers.remove("X-User-Permissions");
                    headers.remove("X-Trace-ID");
                    headers.remove("X-Gateway-Secret");
                    headers.remove("X-Impersonated");
                    headers.remove("X-Admin-User-ID");
                    headers.remove("X-Admin-User-Id");
                    headers.remove("X-Original-Admin-ID");
                    headers.remove("X-Original-Admin-Id");
                    headers.remove("X-Original-User-ID");
                    headers.remove("X-Acting-User-ID");
                    headers.remove("X-User-Tenant");
                    headers.remove("X-User-Role");
                })
                .build();
        ServerWebExchange cleanExchange = exchange.mutate().request(cleanRequest).build();

        // Bypass check for public routes (still forward X-Trace-ID and X-Gateway-Secret)
        if (PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith)) {
            ServerHttpRequest publicForwardRequest = cleanRequest.mutate()
                    .header("X-Trace-ID", traceId)
                    .header("X-Gateway-Secret", gatewaySecret != null ? gatewaySecret : "")
                    .build();
            return chain.filter(cleanExchange.mutate().request(publicForwardRequest).build());
        }

        String authHeader = cleanRequest.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return onError(cleanExchange, "Missing or invalid authorization header", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);

        Claims claims;
        try {
            claims = validateTokenAndGetClaims(token);
        } catch (Exception e) {
            return onError(cleanExchange, "JWT token verification failed: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
        }

        // Issuer & Audience validation (SEC-2N-J)
        String issuer = claims.getIssuer();
        if (issuer != null && !issuer.trim().isEmpty() && !"eventos-auth-service".equals(issuer)) {
            return onError(cleanExchange, "Invalid token issuer", HttpStatus.UNAUTHORIZED);
        }
        java.util.Set<String> audience = claims.getAudience();
        if (audience != null && !audience.isEmpty() && !audience.contains("eventos-platform")) {
            return onError(cleanExchange, "Invalid token audience", HttpStatus.UNAUTHORIZED);
        }

        String tenantId = claims.get("tenantId", String.class);
        String userId = claims.get("userId", String.class);
        String email = claims.getSubject();
        String sessionId = claims.get("sessionId", String.class);
        Object roles = claims.get("roles");
        Object permissions = claims.get("permissions");
        Boolean impersonated = claims.get("impersonated", Boolean.class);
        String adminUserId = claims.get("adminUserId", String.class);

        if (tenantId == null || userId == null) {
            return onError(cleanExchange, "Invalid token claims", HttpStatus.UNAUTHORIZED);
        }

        if (redisTemplate == null) {
            log.warn("[JWT_AUTH] RedisTemplate unavailable, proceeding with cryptographically verified JWT signature");
            return forwardAuthenticatedRequest(cleanExchange, chain, cleanRequest, tenantId, userId, email, roles, permissions, traceId, impersonated, adminUserId);
        }

        // Check 1: Token blacklist in Redis
        return redisTemplate.hasKey("blacklist:" + token)
                .flatMap(isBlacklisted -> {
                    if (Boolean.TRUE.equals(isBlacklisted)) {
                        return onError(cleanExchange, "Authorization token is blacklisted", HttpStatus.UNAUTHORIZED);
                    }

                    // Check 2: Session-level revocation in Redis
                    Mono<Boolean> sessionRevokedMono = (sessionId != null && !sessionId.trim().isEmpty())
                            ? redisTemplate.hasKey("session:revoked:" + sessionId)
                            : Mono.just(false);

                    return sessionRevokedMono.flatMap(isSessionRevoked -> {
                        if (Boolean.TRUE.equals(isSessionRevoked)) {
                            return onError(cleanExchange, "Session has been revoked", HttpStatus.UNAUTHORIZED);
                        }

                        // Check 3: User-level global revocation timestamp in Redis
                        return redisTemplate.opsForValue().get("user:revoked_before:" + userId)
                                .defaultIfEmpty("")
                                .flatMap(revokedBeforeStr -> {
                                    if (!revokedBeforeStr.isEmpty()) {
                                        try {
                                            long revokedBefore = Long.parseLong(revokedBeforeStr);
                                            Date issuedAt = claims.getIssuedAt();
                                            if (issuedAt != null && issuedAt.getTime() <= revokedBefore) {
                                                return onError(cleanExchange, "Token was revoked due to global user session invalidation", HttpStatus.UNAUTHORIZED);
                                            }
                                        } catch (NumberFormatException ignored) {}
                                    }

                                    return forwardAuthenticatedRequest(cleanExchange, chain, cleanRequest, tenantId, userId, email, roles, permissions, traceId, impersonated, adminUserId);
                                });
                    });
                })
                .onErrorResume(e -> {
                    log.error("Redis revocation check encountered an error", e);
                    if (isProductionProfile()) {
                        return onError(cleanExchange, "Revocation verification failed: service error", HttpStatus.UNAUTHORIZED);
                    }
                    return forwardAuthenticatedRequest(cleanExchange, chain, cleanRequest, tenantId, userId, email, roles, permissions, traceId, impersonated, adminUserId);
                });
    }

    private Mono<Void> forwardAuthenticatedRequest(ServerWebExchange cleanExchange, GatewayFilterChain chain,
                                                   ServerHttpRequest cleanRequest, String tenantId, String userId,
                                                   String email, Object roles, Object permissions, String traceId,
                                                   Boolean impersonated, String adminUserId) {
        ServerHttpRequest.Builder reqBuilder = cleanRequest.mutate()
                .header("X-Tenant-ID", tenantId)
                .header("X-User-ID", userId)
                .header("X-User-Email", email != null ? email : "")
                .header("X-User-Roles", roles != null ? roles.toString() : "")
                .header("X-User-Permissions", permissions != null ? permissions.toString() : "")
                .header("X-Trace-ID", traceId)
                .header("X-Gateway-Secret", gatewaySecret != null ? gatewaySecret : "");

        if (Boolean.TRUE.equals(impersonated)) {
            reqBuilder.header("X-Impersonated", "true");
            if (adminUserId != null && !adminUserId.trim().isEmpty()) {
                reqBuilder.header("X-Admin-User-ID", adminUserId);
                reqBuilder.header("X-Original-Admin-ID", adminUserId);
            }
        }

        return chain.filter(cleanExchange.mutate().request(reqBuilder.build()).build());
    }

    private Claims validateTokenAndGetClaims(String token) {
        return jwtParser
                .parseSignedClaims(token)
                .getPayload();
    }

    private RSAPublicKey parsePublicKey(String pem) throws Exception {
        String key = pem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] keyBytes = Base64.getDecoder().decode(key);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(spec);
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");
        
        String responseBody = String.format("{\"success\":false,\"error\":{\"code\":\"UNAUTHORIZED\",\"message\":\"%s\"}}", err);
        byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
        
        return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));
    }

    @Override
    public int getOrder() {
        return -1; // Highest filter priority
    }
}
