package com.eventos.gateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
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
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    // Public endpoints that bypass authentication
    private static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh",
            "/api/v1/gallery/share/public/"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Strip incoming sensitive headers to prevent spoofing
        ServerHttpRequest cleanRequest = request.mutate()
                .headers(headers -> {
                    headers.remove("X-Tenant-ID");
                    headers.remove("X-User-ID");
                    headers.remove("X-User-Email");
                    headers.remove("X-User-Roles");
                })
                .build();
        ServerWebExchange cleanExchange = exchange.mutate().request(cleanRequest).build();

        // Bypass check for public routes
        if (PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith)) {
            return chain.filter(cleanExchange);
        }

        String authHeader = cleanRequest.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return onError(cleanExchange, "Missing or invalid authorization header", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);

        try {
            Claims claims = validateTokenAndGetClaims(token);

            String tenantId = claims.get("tenantId", String.class);
            String userId = claims.get("userId", String.class);
            String email = claims.getSubject();
            Object roles = claims.get("roles");

            if (tenantId == null || userId == null) {
                return onError(cleanExchange, "Invalid token claims", HttpStatus.UNAUTHORIZED);
            }

            // Mutate request headers to forward info downstream
            ServerHttpRequest authenticatedRequest = cleanRequest.mutate()
                    .header("X-Tenant-ID", tenantId)
                    .header("X-User-ID", userId)
                    .header("X-User-Email", email != null ? email : "")
                    .header("X-User-Roles", roles != null ? roles.toString() : "")
                    .build();

            return chain.filter(cleanExchange.mutate().request(authenticatedRequest).build());

        } catch (Exception e) {
            return onError(cleanExchange, "JWT token verification failed: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
        }
    }

    private volatile io.jsonwebtoken.JwtParser jwtParser;

    private io.jsonwebtoken.JwtParser getJwtParser() {
        if (jwtParser == null) {
            synchronized (this) {
                if (jwtParser == null) {
                    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                    jwtParser = Jwts.parser()
                            .verifyWith(key)
                            .build();
                }
            }
        }
        return jwtParser;
    }

    private Claims validateTokenAndGetClaims(String token) {
        return getJwtParser()
                .parseSignedClaims(token)
                .getPayload();
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
