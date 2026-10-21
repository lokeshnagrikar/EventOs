package com.eventos.auth.security;

import com.eventos.auth.config.UserPrincipal;
import com.eventos.auth.config.WebSocketConfig;
import com.eventos.auth.service.JwtService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("WebSocket Security Hardening & Tenant Isolation Tests")
class WebSocketSecurityTest {

    private JwtService jwtService;
    private WebSocketConfig webSocketConfig;
    private ChannelInterceptor interceptor;
    private MessageChannel dummyChannel;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        jwtService = mock(JwtService.class);
        webSocketConfig = new WebSocketConfig(jwtService);
        dummyChannel = mock(MessageChannel.class);

        ChannelRegistration registration = new ChannelRegistration();
        webSocketConfig.configureClientInboundChannel(registration);

        List<ChannelInterceptor> interceptors = (List<ChannelInterceptor>) ReflectionTestUtils.getField(registration, "interceptors");
        assertNotNull(interceptors, "Interceptors list should not be null");
        assertFalse(interceptors.isEmpty(), "At least one interceptor should be registered");
        interceptor = interceptors.get(0);
    }

    @Test
    @DisplayName("CONNECT: Fails when Authorization header is missing")
    void connect_fails_when_authorization_header_missing() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            interceptor.preSend(message, dummyChannel);
        });
        assertTrue(ex.getMessage().contains("Missing Authorization header"));
    }

    @Test
    @DisplayName("CONNECT: Fails when guest-token is supplied (bypass completely eliminated)")
    void connect_fails_when_guest_token_supplied() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer guest-token");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            interceptor.preSend(message, dummyChannel);
        });
        assertTrue(ex.getMessage().contains("Unauthorized: Valid user JWT token required"));
    }

    @Test
    @DisplayName("CONNECT: Fails when JWT is invalid or expired")
    void connect_fails_when_jwt_is_invalid() {
        when(jwtService.validateToken("bad.expired.jwt")).thenReturn(false);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer bad.expired.jwt");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            interceptor.preSend(message, dummyChannel);
        });
        assertTrue(ex.getMessage().contains("Invalid or expired JWT token"));
    }

    @Test
    @DisplayName("CONNECT: Succeeds with valid JWT and populates UserPrincipal")
    void connect_succeeds_with_valid_jwt() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        String token = "valid.user.token";

        when(jwtService.validateToken(token)).thenReturn(true);
        Claims claims = mock(Claims.class);
        when(claims.get("userId", String.class)).thenReturn(userId.toString());
        when(claims.get("tenantId", String.class)).thenReturn(tenantId.toString());
        when(claims.getSubject()).thenReturn("user@eventosapp.in");
        when(claims.get("roles", String.class)).thenReturn("ADMIN");
        when(jwtService.getClaims(token)).thenReturn(claims);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.addNativeHeader("Authorization", "Bearer " + token);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, dummyChannel);
        assertNotNull(result);

        StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
        assertNotNull(resultAccessor.getUser());
        assertTrue(resultAccessor.getUser() instanceof UserPrincipal);
        UserPrincipal principal = (UserPrincipal) resultAccessor.getUser();
        assertEquals(userId, principal.getUserId());
        assertEquals(tenantId, principal.getTenantId());
        assertEquals("user@eventosapp.in", principal.getEmail());
    }

    @Test
    @DisplayName("SUBSCRIBE: Fails when session is unauthenticated")
    void subscribe_fails_when_unauthenticated() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/chat");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            interceptor.preSend(message, dummyChannel);
        });
        assertTrue(ex.getMessage().contains("Unauthenticated STOMP subscription"));
    }

    @Test
    @DisplayName("SUBSCRIBE: Fails when user attempts to subscribe to another tenant's topic")
    void subscribe_fails_on_cross_tenant_topic() {
        UUID myTenantId = UUID.randomUUID();
        UUID otherTenantId = UUID.randomUUID();
        UserPrincipal user = new UserPrincipal(UUID.randomUUID(), myTenantId, "user@tenantA.com", "USER");

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setUser(user);
        accessor.setDestination("/topic/tenant/" + otherTenantId + "/notifications");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            interceptor.preSend(message, dummyChannel);
        });
        assertTrue(ex.getMessage().contains("Cross-tenant destination unauthorized"));
    }

    @Test
    @DisplayName("SUBSCRIBE: Succeeds when user subscribes to own tenant topic")
    void subscribe_succeeds_on_own_tenant_topic() {
        UUID myTenantId = UUID.randomUUID();
        UserPrincipal user = new UserPrincipal(UUID.randomUUID(), myTenantId, "user@tenantA.com", "USER");

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setUser(user);
        accessor.setDestination("/topic/tenant/" + myTenantId + "/notifications");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, dummyChannel);
        assertNotNull(result);
    }

    @Test
    @DisplayName("SUBSCRIBE: SuperAdmin can subscribe across any tenant destination")
    void subscribe_succeeds_for_superadmin_across_tenants() {
        UUID otherTenantId = UUID.randomUUID();
        UserPrincipal superAdmin = new UserPrincipal(UUID.randomUUID(), null, "superadmin@eventosapp.in", "ROLE_SUPER_ADMIN");

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setUser(superAdmin);
        accessor.setDestination("/topic/tenant/" + otherTenantId + "/telemetry");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, dummyChannel);
        assertNotNull(result);
    }

    @Test
    @DisplayName("SEND: Fails when user attempts to send message to another tenant's queue")
    void send_fails_on_cross_tenant_destination() {
        UUID myTenantId = UUID.randomUUID();
        UUID otherTenantId = UUID.randomUUID();
        UserPrincipal user = new UserPrincipal(UUID.randomUUID(), myTenantId, "user@tenantA.com", "USER");

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        accessor.setUser(user);
        accessor.setDestination("/app/tenant/" + otherTenantId + "/events");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            interceptor.preSend(message, dummyChannel);
        });
        assertTrue(ex.getMessage().contains("Cross-tenant destination unauthorized"));
    }
}
