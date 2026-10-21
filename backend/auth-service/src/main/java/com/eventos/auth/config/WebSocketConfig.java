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

import java.security.Principal;
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
                if (accessor == null) {
                    return message;
                }

                StompCommand command = accessor.getCommand();

                // 1. Strict Authentication on CONNECT: No "guest-token" or anonymous bypasses permitted
                if (StompCommand.CONNECT.equals(command)) {
                    List<String> authorization = accessor.getNativeHeader("Authorization");
                    if (authorization == null || authorization.isEmpty()) {
                        log.warn("[STOMP WS] Connection rejected: Missing Authorization header");
                        throw new AccessDeniedException("Missing Authorization header for WebSocket connection");
                    }

                    String rawHeader = authorization.get(0);
                    String token = rawHeader.startsWith("Bearer ") ? rawHeader.substring(7).trim() : rawHeader.trim();

                    if (token.isEmpty() || "guest-token".equalsIgnoreCase(token)) {
                        log.warn("[STOMP WS] Connection rejected: Unauthorized guest token or blank credential");
                        throw new AccessDeniedException("Unauthorized: Valid user JWT token required");
                    }

                    if (!jwtService.validateToken(token)) {
                        log.warn("[STOMP WS] Connection rejected: Invalid or expired JWT token");
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

                        if (userId == null) {
                            throw new AccessDeniedException("Token missing required user identity claim");
                        }

                        UserPrincipal principal = new UserPrincipal(userId, tenantId, email, roles != null ? roles : "USER");
                        if (accessor.isMutable()) {
                            accessor.setUser(principal);
                        } else {
                            StompHeaderAccessor mutableAccessor = StompHeaderAccessor.create(StompCommand.CONNECT);
                            mutableAccessor.copyHeaders(accessor.toMap());
                            mutableAccessor.setUser(principal);
                            return org.springframework.messaging.support.MessageBuilder.createMessage(message.getPayload(), mutableAccessor.getMessageHeaders());
                        }
                        log.info("[STOMP WS] Authenticated STOMP session for user: {} (tenant: {})", email, tenantId);
                    } catch (AccessDeniedException ade) {
                        throw ade;
                    } catch (Exception e) {
                        log.error("[STOMP WS] Failed to parse claims from JWT token: {}", e.getMessage());
                        throw new AccessDeniedException("Failed to extract principal from token: " + e.getMessage());
                    }
                }

                // 2. Multi-Tenant Authorization on SUBSCRIBE: Block cross-tenant topic eavesdropping
                else if (StompCommand.SUBSCRIBE.equals(command)) {
                    Principal principal = accessor.getUser();
                    if (!(principal instanceof UserPrincipal user)) {
                        log.warn("[STOMP WS] Subscription rejected: Unauthenticated session");
                        throw new AccessDeniedException("Unauthenticated STOMP subscription attempted");
                    }

                    String destination = accessor.getDestination();
                    authorizeDestination(user, destination, "SUBSCRIBE");
                }

                // 3. Multi-Tenant Authorization on SEND: Block cross-tenant message injection
                else if (StompCommand.SEND.equals(command)) {
                    Principal principal = accessor.getUser();
                    if (!(principal instanceof UserPrincipal user)) {
                        log.warn("[STOMP WS] Message send rejected: Unauthenticated session");
                        throw new AccessDeniedException("Unauthenticated STOMP message send attempted");
                    }

                    String destination = accessor.getDestination();
                    authorizeDestination(user, destination, "SEND");
                }

                return message;
            }

            private void authorizeDestination(UserPrincipal user, String destination, String action) {
                if (destination == null || destination.trim().isEmpty()) {
                    return;
                }

                // SuperAdmin has global visibility across all broadcast topics
                if (user.getRoles() != null && (user.getRoles().contains("SUPER_ADMIN") || user.getRoles().contains("ROLE_SUPER_ADMIN"))) {
                    return;
                }

                // Tenant-scoped topic validation: e.g., /topic/tenant/{tenantId}/** or /queue/tenant/{tenantId}/**
                if (destination.contains("/tenant/")) {
                    String afterTenant = destination.substring(destination.indexOf("/tenant/") + 8);
                    String targetTenantStr = afterTenant.split("/")[0].trim();
                    try {
                        UUID targetTenantId = UUID.fromString(targetTenantStr);
                        if (user.getTenantId() == null || !user.getTenantId().equals(targetTenantId)) {
                            log.warn("[STOMP WS] Cross-tenant {} rejected: User tenant {} tried to access {}",
                                    action, user.getTenantId(), destination);
                            throw new AccessDeniedException("Access denied: Cross-tenant destination unauthorized");
                        }
                    } catch (IllegalArgumentException e) {
                        log.warn("[STOMP WS] Malformed tenant UUID in destination: {}", destination);
                        throw new AccessDeniedException("Invalid tenant identifier in destination path");
                    }
                }
            }
        });
    }
}
