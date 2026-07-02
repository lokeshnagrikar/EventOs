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

    public JwtAuthFilter(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // Public endpoints that bypass authentication
    private static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh",
            "/api/v1/auth/switch",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/verify-email",
            "/api/v1/auth/accept-invite",
            "/api/v1/auth/captcha",
            "/api/v1/auth/ws",
            "/api/v1/gallery/share/public/",
            "/actuator"
    );

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            if (rawPublicKey == null || rawPublicKey.trim().isEmpty()) {
                String keyPath = System.getenv().getOrDefault("JWT_KEY_PATH", ".");
                java.io.File privateKeyFile = new java.io.File(keyPath, "jwt_private.pem");
                java.io.File publicKeyFile = new java.io.File(keyPath, "jwt_public.pem");

                if (!privateKeyFile.exists()) {
                    java.io.File parentTry = new java.io.File("../jwt_private.pem");
                    if (parentTry.exists()) {
                        privateKeyFile = parentTry;
                        publicKeyFile = new java.io.File("../jwt_public.pem");
                    }
                }
                if (!privateKeyFile.exists()) {
                    java.io.File doubleParentTry = new java.io.File("../../jwt_private.pem");
                    if (doubleParentTry.exists()) {
                        privateKeyFile = doubleParentTry;
                        publicKeyFile = new java.io.File("../../jwt_public.pem");
                    }
                }
                if (!privateKeyFile.exists()) {
                    java.io.File absoluteTry = new java.io.File("d:/EventOs/jwt_private.pem");
                    if (absoluteTry.exists()) {
                        privateKeyFile = absoluteTry;
                        publicKeyFile = new java.io.File("d:/EventOs/jwt_public.pem");
                    }
                }

                if (privateKeyFile.exists() && publicKeyFile.exists()) {
                    String publicPem = java.nio.file.Files.readString(publicKeyFile.toPath());
                    this.publicKey = parsePublicKey(publicPem);
                    log.info("Successfully loaded shared JWT RSA public key from file.");
                } else {
                    java.security.KeyPairGenerator keyGen = java.security.KeyPairGenerator.getInstance("RSA");
                    keyGen.initialize(2048);
                    java.security.KeyPair keyPair = keyGen.generateKeyPair();
                    this.publicKey = (RSAPublicKey) keyPair.getPublic();

                    // Ensure directory exists
                    java.io.File parentDir = privateKeyFile.getParentFile();
                    if (parentDir != null && !parentDir.exists()) {
                        parentDir.mkdirs();
                    }

                    // Write public and private keys so Auth Service can load the private key
                    String privatePem = "-----BEGIN PRIVATE KEY-----\n" +
                            Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(keyPair.getPrivate().getEncoded()) +
                            "\n-----END PRIVATE KEY-----";
                    java.nio.file.Files.writeString(privateKeyFile.toPath(), privatePem);

                    String publicPem = "-----BEGIN PUBLIC KEY-----\n" +
                            Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(keyPair.getPublic().getEncoded()) +
                            "\n-----END PUBLIC KEY-----";
                    java.nio.file.Files.writeString(publicKeyFile.toPath(), publicPem);
                    log.info("Generated and wrote shared JWT RSA keypair to file.");
                }
            } else {
                this.publicKey = parsePublicKey(rawPublicKey);
                log.info("Successfully loaded JWT RSA public key for RS256 validation.");
            }
            this.jwtParser = Jwts.parser()
                    .verifyWith(publicKey)
                    .build();
        } catch (Exception e) {
            log.error("Failed to initialize RS256 Cryptographic Key Parser", e);
            throw new RuntimeException("Failed to initialize RS256 public key validation", e);
        }
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 1. Generate Correlation ID / Trace ID
        String traceId = java.util.UUID.randomUUID().toString().replace("-", "");

        // Strip incoming sensitive headers to prevent spoofing
        ServerHttpRequest cleanRequest = request.mutate()
                .headers(headers -> {
                    headers.remove("X-Tenant-ID");
                    headers.remove("X-User-ID");
                    headers.remove("X-User-Email");
                    headers.remove("X-User-Roles");
                    headers.remove("X-User-Permissions");
                    headers.remove("X-Trace-ID");
                    headers.remove("X-Gateway-Secret");
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

        // Check if token is blacklisted in Redis
        return redisTemplate.hasKey("blacklist:" + token)
                .flatMap(isBlacklisted -> {
                    if (Boolean.TRUE.equals(isBlacklisted)) {
                        return onError(cleanExchange, "Authorization token is blacklisted", HttpStatus.UNAUTHORIZED);
                    }

                    try {
                        Claims claims = validateTokenAndGetClaims(token);

                        String tenantId = claims.get("tenantId", String.class);
                        String userId = claims.get("userId", String.class);
                        String email = claims.getSubject();
                        Object roles = claims.get("roles");
                        Object permissions = claims.get("permissions");

                        if (tenantId == null || userId == null) {
                            return onError(cleanExchange, "Invalid token claims", HttpStatus.UNAUTHORIZED);
                        }

                        // Mutate request headers to forward info downstream
                        ServerHttpRequest authenticatedRequest = cleanRequest.mutate()
                                .header("X-Tenant-ID", tenantId)
                                .header("X-User-ID", userId)
                                .header("X-User-Email", email != null ? email : "")
                                .header("X-User-Roles", roles != null ? roles.toString() : "")
                                .header("X-User-Permissions", permissions != null ? permissions.toString() : "")
                                .header("X-Trace-ID", traceId)
                                .header("X-Gateway-Secret", gatewaySecret != null ? gatewaySecret : "")
                                .build();

                        return chain.filter(cleanExchange.mutate().request(authenticatedRequest).build());

                    } catch (Exception e) {
                        return onError(cleanExchange, "JWT token verification failed: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
                    }
                });
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
