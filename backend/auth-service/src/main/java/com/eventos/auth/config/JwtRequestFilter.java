package com.eventos.auth.config;

import com.eventos.auth.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.beans.factory.annotation.Value;


import org.springframework.lang.NonNull;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Value("${app.gateway.secret:}")
    private String gatewaySecret;

    public JwtRequestFilter(JwtService jwtService) {
        this.jwtService = jwtService;
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
        final String userEmailHeader = request.getHeader("X-User-Email");
        final String gatewaySecretHeader = request.getHeader("X-Gateway-Secret");

        if (tenantIdHeader != null && userIdHeader != null) {
            // Verify gateway secret to prevent header spoofing
            if (gatewaySecret == null || gatewaySecret.trim().isEmpty() || !gatewaySecret.equals(gatewaySecretHeader)) {
                logger.warn("Blocked direct access attempt with spoofed user headers (missing or invalid gateway secret).");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"UNAUTHORIZED\",\"message\":\"Invalid Gateway Trust Secret\"}}");
                return;
            }
            try {
                UUID tenantId = UUID.fromString(tenantIdHeader);
                UUID userId = UUID.fromString(userIdHeader);
                String email = userEmailHeader != null ? userEmailHeader : "";
                String rolesStr = userRolesHeader != null ? userRolesHeader : "";

                List<SimpleGrantedAuthority> authorities = Collections.emptyList();
                if (!rolesStr.isEmpty()) {
                    authorities = Stream.of(rolesStr.split(","))
                            .map(r -> new SimpleGrantedAuthority("ROLE_" + r.trim().toUpperCase()))
                            .collect(Collectors.toList());
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
            try {
                filterChain.doFilter(request, response);
            } finally {
                TenantContext.clear();
            }
            return;
        }

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);
        try {
            if (jwtService.validateToken(token)) {
                Claims claims = jwtService.getClaims(token);

                String tenantIdStr = claims.get("tenantId", String.class);
                String userIdStr = claims.get("userId", String.class);
                String email = claims.getSubject();
                String rolesStr = claims.get("roles", String.class);

                if (tenantIdStr != null && userIdStr != null) {
                    UUID tenantId = UUID.fromString(tenantIdStr);
                    UUID userId = UUID.fromString(userIdStr);

                    List<SimpleGrantedAuthority> authorities = Collections.emptyList();
                    if (rolesStr != null && !rolesStr.isEmpty()) {
                        authorities = Stream.of(rolesStr.split(","))
                                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.trim().toUpperCase()))
                                .collect(Collectors.toList());
                    }

                    UserPrincipal principal = new UserPrincipal(userId, tenantId, email, rolesStr);
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            principal, null, authorities);
                    
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    TenantContext.setTenantId(tenantId);
                }
            }
        } catch (Exception e) {
            logger.warn("JWT validation failed: " + e.getMessage());
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }}
