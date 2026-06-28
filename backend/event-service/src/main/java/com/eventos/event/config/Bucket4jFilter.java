package com.eventos.event.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class Bucket4jFilter implements Filter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket resolveBucket(String ip) {
        return cache.computeIfAbsent(ip, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1))))
                .build());
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Rate limit anonymous POST requests to /calculator
        if (path != null && path.endsWith("/calculator") && "POST".equalsIgnoreCase(method)) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAnonymous = auth == null || !auth.isAuthenticated() || 
                    auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken;

            if (isAnonymous) {
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty()) {
                    ip = request.getRemoteAddr();
                }
                Bucket bucket = resolveBucket(ip);
                if (!bucket.tryConsume(1)) {
                    response.setStatus(429);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"TOO_MANY_REQUESTS\",\"message\":\"Rate limit exceeded. Try again in a minute.\"}}");
                    return;
                }
            }
        }

        filterChain.doFilter(servletRequest, servletResponse);
    }
}
