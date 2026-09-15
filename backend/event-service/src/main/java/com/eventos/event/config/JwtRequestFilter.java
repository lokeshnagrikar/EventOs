package com.eventos.event.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import org.springframework.lang.NonNull;
import java.io.IOException;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Value("${app.jwt.public-key:}")
    private String rawPublicKey;

    @Value("${app.gateway.secret:}")
    private String gatewaySecret;

    private RSAPublicKey publicKey;
    private io.jsonwebtoken.JwtParser jwtParser;

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            if (rawPublicKey != null && !rawPublicKey.trim().isEmpty()) {
                this.publicKey = parsePublicKey(rawPublicKey);
                this.jwtParser = Jwts.parser().verifyWith(this.publicKey).build();
                logger.info("Event-Service: Loaded RS256 public key from environment.");
                return;
            }

            if (System.getenv("JWT_KEY_PATH") != null) {
                String keyPath = System.getenv("JWT_KEY_PATH");
                java.io.File publicKeyFile = new java.io.File(keyPath, "jwt_public.pem");
                if (publicKeyFile.exists()) {
                    String publicPem = java.nio.file.Files.readString(publicKeyFile.toPath());
                    this.publicKey = parsePublicKey(publicPem);
                    this.jwtParser = Jwts.parser().verifyWith(this.publicKey).build();
                    logger.info("Event-Service: RSA public key loaded for RS256 JWT validation from " + publicKeyFile.getAbsolutePath());
                    return;
                } else {
                    logger.warn("Event-Service: JWT_KEY_PATH configured but jwt_public.pem missing in: " + keyPath);
                }
            } else {
                logger.info("Event-Service: No explicit JWT_PUBLIC_KEY or JWT_KEY_PATH configured. Direct Bearer token validation will be unavailable (Gateway headers used).");
            }
        } catch (Exception e) {
            throw new RuntimeException("Event-Service: Failed to initialise RSA public key for JWT validation", e);
        }
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        final String tenantIdHeader = request.getHeader("X-Tenant-ID");
        final String userIdHeader = request.getHeader("X-User-ID");
        final String userRolesHeader = request.getHeader("X-User-Roles");
        final String userPermissionsHeader = request.getHeader("X-User-Permissions");
        final String userEmailHeader = request.getHeader("X-User-Email");
        final String gatewaySecretHeader = request.getHeader("X-Gateway-Secret");

        final boolean hasIdentityHeaders = tenantIdHeader != null || userIdHeader != null 
                || userRolesHeader != null || userPermissionsHeader != null || userEmailHeader != null;

        // ── Path 1: Trusted Gateway Headers ────────────────────────────────────
        if (hasIdentityHeaders) {
            // Verify gateway secret to prevent header spoofing
            if (gatewaySecret == null || gatewaySecret.trim().isEmpty() || !gatewaySecret.equals(gatewaySecretHeader)) {
                logger.warn("Blocked direct access attempt with spoofed user headers (missing or invalid gateway secret).");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"UNAUTHORIZED\",\"message\":\"Invalid Gateway Trust Secret\"}}");
                return;
            }
            if (tenantIdHeader != null && userIdHeader != null) {
                try {
                    UUID tenantId = UUID.fromString(tenantIdHeader);
                    UUID userId = UUID.fromString(userIdHeader);
                    String email = userEmailHeader != null ? userEmailHeader : "";
                    String rolesStr = userRolesHeader != null ? userRolesHeader : "";

                    List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
                    if (!rolesStr.isEmpty()) {
                        for (String r : rolesStr.split(",")) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_" + r.trim().toUpperCase()));
                        }
                    }
                    if (userPermissionsHeader != null && !userPermissionsHeader.trim().isEmpty()) {
                        String cleaned = userPermissionsHeader.replace("[", "").replace("]", "");
                        for (String p : cleaned.split(",")) {
                            if (!p.trim().isEmpty()) {
                                authorities.add(new SimpleGrantedAuthority(p.trim()));
                            }
                        }
                    }

                    UserPrincipal principal = new UserPrincipal(userId, tenantId, email, rolesStr);
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            principal, null, authorities);

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    TenantContext.setTenantId(tenantId);
                } catch (Exception e) {
                    logger.warn("Failed to authenticate via Gateway headers: " + e.getMessage());
                }
            }
            try {
                filterChain.doFilter(request, response);
            } finally {
                TenantContext.clear();
            }
            return;
        }

        // ── Path 2: Direct Bearer Token (RS256) — service-to-service calls ─────
        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);
        try {
            if (jwtParser == null) {
                logger.warn("JWT parser not initialised (RSA key not found); skipping Bearer token validation.");
                filterChain.doFilter(request, response);
                return;
            }

            try {
                Claims claims = jwtParser
                        .parseSignedClaims(token)
                        .getPayload();

                String tenantIdStr = claims.get("tenantId", String.class);
                String userIdStr = claims.get("userId", String.class);
                String email = claims.getSubject();
                String rolesStr = claims.get("roles", String.class);
                Object permissionsObj = claims.get("permissions");

                if (tenantIdStr != null && userIdStr != null) {
                    UUID tenantId = UUID.fromString(tenantIdStr);
                    UUID userId = UUID.fromString(userIdStr);

                    List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
                    if (rolesStr != null && !rolesStr.isEmpty()) {
                        for (String r : rolesStr.split(",")) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_" + r.trim().toUpperCase()));
                        }
                    }
                    if (permissionsObj != null) {
                        String cleaned = permissionsObj.toString().replace("[", "").replace("]", "");
                        for (String p : cleaned.split(",")) {
                            if (!p.trim().isEmpty()) {
                                authorities.add(new SimpleGrantedAuthority(p.trim()));
                            }
                        }
                    }

                    UserPrincipal principal = new UserPrincipal(userId, tenantId, email, rolesStr);
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            principal, null, authorities);

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    // Set active tenant context
                    TenantContext.setTenantId(tenantId);
                }
            } catch (Exception e) {
                logger.warn("JWT (RS256) validation failed: " + e.getMessage());
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
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
}
