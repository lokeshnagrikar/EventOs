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

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtRequestFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
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
                }
            }
        } catch (Exception e) {
            logger.warn("JWT validation failed: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
