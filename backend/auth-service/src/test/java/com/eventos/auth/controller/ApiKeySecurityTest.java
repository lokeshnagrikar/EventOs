package com.eventos.auth.controller;

import com.eventos.auth.entity.ApiKey;
import com.eventos.auth.entity.User;
import com.eventos.auth.repository.ApiKeyRepository;
import com.eventos.auth.repository.AuditLogRepository;
import com.eventos.auth.service.EmailService;
import com.eventos.auth.service.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ApiKeySecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private ApiKeyRepository apiKeyRepository;

    @MockBean
    private AuditLogRepository auditLogRepository;

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    @MockBean
    private ValueOperations<String, String> valueOperations;

    @MockBean
    private EmailService emailService;

    private final UUID tenantA = UUID.randomUUID();
    private final UUID tenantB = UUID.randomUUID();
    private final UUID apiKeyId = UUID.randomUUID();

    private ApiKey keyTenantA;
    private ApiKey keyTenantB;

    @BeforeEach
    void setUp() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);

        keyTenantA = ApiKey.builder()
                .id(apiKeyId)
                .tenantId(tenantA)
                .name("Tenant A Key")
                .prefix("ev_tenantA1")
                .keyHash("hashA")
                .scopes("crm:read")
                .expiresAt(LocalDateTime.now().plusDays(30))
                .isRevoked(false)
                .build();

        keyTenantB = ApiKey.builder()
                .id(apiKeyId)
                .tenantId(tenantB)
                .name("Tenant B Key")
                .prefix("ev_tenantB2")
                .keyHash("hashB")
                .scopes("crm:read")
                .expiresAt(LocalDateTime.now().plusDays(30))
                .isRevoked(false)
                .build();
    }

    private String tokenFor(UUID tenantId, String role) {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("admin@" + tenantId + ".com")
                .firstName("Tenant")
                .lastName("Admin")
                .build();
        return jwtService.generateToken(user, tenantId, role);
    }

    @Test
    @DisplayName("SEC-2M-02: Tenant A Admin can revoke its own API key")
    void testTenantA_CanRevokeOwnKey() throws Exception {
        String tokenA = tokenFor(tenantA, "ADMIN");
        when(apiKeyRepository.findByIdAndTenantId(apiKeyId, tenantA)).thenReturn(Optional.of(keyTenantA));
        when(apiKeyRepository.save(any(ApiKey.class))).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(delete("/settings/apikeys/" + apiKeyId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("API Key revoked successfully"));

        verify(apiKeyRepository, times(1)).findByIdAndTenantId(apiKeyId, tenantA);
        verify(apiKeyRepository, times(1)).save(keyTenantA);
    }

    @Test
    @DisplayName("SEC-2M-02: Cross-tenant revocation blocked — Tenant A Admin cannot revoke Tenant B API key")
    void testTenantA_CannotRevokeTenantBKey() throws Exception {
        String tokenA = tokenFor(tenantA, "ADMIN");
        // Tenant A searching for key owned by Tenant B returns empty (404)
        when(apiKeyRepository.findByIdAndTenantId(apiKeyId, tenantA)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/settings/apikeys/" + apiKeyId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());

        verify(apiKeyRepository, times(1)).findByIdAndTenantId(apiKeyId, tenantA);
        verify(apiKeyRepository, never()).save(any());
    }

    @Test
    @DisplayName("SEC-2M-02: Tenant A Admin can rotate its own API key and receives newly generated rawKey")
    void testTenantA_CanRotateOwnKey() throws Exception {
        String tokenA = tokenFor(tenantA, "ADMIN");
        when(apiKeyRepository.findByIdAndTenantId(apiKeyId, tenantA)).thenReturn(Optional.of(keyTenantA));
        when(apiKeyRepository.save(any(ApiKey.class))).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(post("/settings/apikeys/" + apiKeyId + "/rotate")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.rawKey").exists());

        verify(apiKeyRepository, times(1)).findByIdAndTenantId(apiKeyId, tenantA);
        verify(apiKeyRepository, times(1)).save(keyTenantA);
    }

    @Test
    @DisplayName("SEC-2M-02: Cross-tenant rotation blocked — Tenant A Admin cannot rotate Tenant B key or steal its rawKey")
    void testTenantA_CannotRotateTenantBKey() throws Exception {
        String tokenA = tokenFor(tenantA, "ADMIN");
        // Tenant A searching for key owned by Tenant B returns empty (404)
        when(apiKeyRepository.findByIdAndTenantId(apiKeyId, tenantA)).thenReturn(Optional.empty());

        mockMvc.perform(post("/settings/apikeys/" + apiKeyId + "/rotate")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());

        verify(apiKeyRepository, times(1)).findByIdAndTenantId(apiKeyId, tenantA);
        verify(apiKeyRepository, never()).save(any());
    }

    @Test
    @DisplayName("SEC-2M-03 / SEC-2M-04: Untrusted client-supplied X-Tenant-ID header is rejected without gateway secret")
    void testDirectUntrustedTenantHeader_Rejected() throws Exception {
        String tokenA = tokenFor(tenantA, "ADMIN");

        mockMvc.perform(delete("/settings/apikeys/" + apiKeyId)
                        .header("Authorization", "Bearer " + tokenA)
                        .header("X-Tenant-ID", tenantB.toString()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.message").value("Invalid Gateway Trust Secret"));

        verify(apiKeyRepository, never()).findByIdAndTenantId(any(), any());
    }

    @Test
    @DisplayName("SEC-2M-03: UserPrincipal tenantId is authoritative for API key operations")
    void testUserPrincipalTenantId_IsAuthoritative() throws Exception {
        String tokenA = tokenFor(tenantA, "ADMIN");
        when(apiKeyRepository.findByIdAndTenantId(apiKeyId, tenantA)).thenReturn(Optional.of(keyTenantA));
        when(apiKeyRepository.save(any(ApiKey.class))).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(delete("/settings/apikeys/" + apiKeyId)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        // Verifies tenant context was strictly derived from UserPrincipal (tenantA), not any header
        verify(apiKeyRepository, times(1)).findByIdAndTenantId(apiKeyId, tenantA);
        verify(apiKeyRepository, never()).findByIdAndTenantId(apiKeyId, tenantB);
    }
}
