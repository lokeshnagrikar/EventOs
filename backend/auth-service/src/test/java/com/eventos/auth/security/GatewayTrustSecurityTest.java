package com.eventos.auth.security;

import com.eventos.auth.repository.AuditLogRepository;
import com.eventos.auth.service.BillingService;
import com.eventos.auth.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class GatewayTrustSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Value("${app.gateway.secret:eventos_gateway_secure_shared_secret}")
    private String gatewaySecret;

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

    @MockBean
    private BillingService billingService;

    @MockBean
    private com.eventos.auth.service.WorkspaceService workspaceService;

    private final UUID tenantId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);
        when(workspaceService.getWorkspaceSettings(any())).thenReturn(com.eventos.auth.entity.Company.builder().build());
    }

    @Test
    @DisplayName("SEC-2M-04: Identity headers with missing gateway secret are rejected with 401")
    void testIdentityHeaders_MissingGatewaySecret_Rejected() throws Exception {
        mockMvc.perform(get("/settings/workspace")
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-ID", userId.toString())
                        .header("X-User-Roles", "OWNER"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.message").value("Invalid Gateway Trust Secret"));
    }

    @Test
    @DisplayName("SEC-2M-04: Identity headers with invalid gateway secret are rejected with 401")
    void testIdentityHeaders_InvalidGatewaySecret_Rejected() throws Exception {
        mockMvc.perform(get("/settings/workspace")
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-ID", userId.toString())
                        .header("X-User-Roles", "OWNER")
                        .header("X-Gateway-Secret", "wrong_secret_123"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.message").value("Invalid Gateway Trust Secret"));
    }

    @Test
    @DisplayName("SEC-2M-04: Identity header X-User-Roles alone with missing gateway secret is rejected with 401")
    void testOnlyUserRolesHeader_MissingGatewaySecret_Rejected() throws Exception {
        mockMvc.perform(get("/settings/workspace")
                        .header("X-User-Roles", "OWNER"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.message").value("Invalid Gateway Trust Secret"));
    }

    @Test
    @DisplayName("SEC-2M-04: Identity headers with valid gateway secret succeed")
    void testIdentityHeaders_ValidGatewaySecret_Succeeds() throws Exception {
        mockMvc.perform(get("/settings/workspace")
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-ID", userId.toString())
                        .header("X-User-Roles", "OWNER")
                        .header("X-Gateway-Secret", gatewaySecret))
                .andExpect(status().isOk());
    }
}
