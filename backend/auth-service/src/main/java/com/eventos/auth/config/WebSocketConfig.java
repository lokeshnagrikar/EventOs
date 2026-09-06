package com.eventos.auth.config;

import com.eventos.auth.service.JwtService;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;
import java.util.UUID;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);
    private final JwtService jwtService;

    public WebSocketConfig(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable STOMP simple memory broker
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
        registry.addEndpoint("/ws-sockjs")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    List<String> authorization = accessor.getNativeHeader("Authorization");
                    if (authorization != null && !authorization.isEmpty()) {
                        String rawHeader = authorization.get(0);
                        String token = rawHeader.startsWith("Bearer ") ? rawHeader.substring(7).trim() : rawHeader.trim();

                        if (!token.isEmpty() && !"guest-token".equalsIgnoreCase(token)) {
                            if (!jwtService.validateToken(token)) {
                                log.warn("[STOMP WS] Rejecting connection: Invalid or expired JWT token");
                                throw new AccessDeniedException("Invalid or expired JWT token for WebSocket connection");
                            }

                            try {
                                Claims claims = jwtService.getClaims(token);
                                String userIdStr = claims.get("userId", String.class);
                                String tenantIdStr = claims.get("tenantId", String.class);
                                String email = claims.getSubject();
                                String roles = claims.get("roles", String.class);

                                UUID userId = (userIdStr != null && !userIdStr.isEmpty()) ? UUID.fromString(userIdStr) : null;
                                UUID tenantId = (tenantIdStr != null && !tenantIdStr.isEmpty()) ? UUID.fromString(tenantIdStr) : null;

                                UserPrincipal principal = new UserPrincipal(userId, tenantId, email, roles != null ? roles : "USER");
                                accessor.setUser(principal);
                                log.info("[STOMP WS] Authenticated STOMP user: {} (tenant: {})", email, tenantId);
                            } catch (Exception e) {
                                log.error("[STOMP WS] Failed to parse claims from JWT token: {}", e.getMessage());
                                throw new AccessDeniedException("Failed to extract principal from token: " + e.getMessage());
                            }
                        } else {
                            // Guest connection for public broadcasts
                            UserPrincipal guestPrincipal = new UserPrincipal(null, null, "guest@eventos.com", "ROLE_GUEST");
                            accessor.setUser(guestPrincipal);
                        }
                    } else {
                        // Unauthenticated fallback
                        UserPrincipal guestPrincipal = new UserPrincipal(null, null, "guest@eventos.com", "ROLE_GUEST");
                        accessor.setUser(guestPrincipal);
                    }
                }
                return message;
            }
        });
    }
}
