package com.eventos.auth.controller;

import com.eventos.auth.entity.User;
import com.eventos.auth.repository.AuditLogRepository;
import com.eventos.auth.service.BillingService;
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

import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class BillingControllerRbacTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private BillingService billingService;

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

    private final UUID targetTenantId = UUID.randomUUID();
    private final UUID targetUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);

        when(billingService.getSuperAdminDashboardMetrics()).thenReturn(Collections.emptyMap());
        when(billingService.getSuperAdminTenants()).thenReturn(Collections.emptyList());
        when(billingService.getSuperAdminUsers()).thenReturn(Collections.emptyList());
        when(billingService.impersonateTenant(any())).thenReturn("mock-impersonated-jwt");
        when(billingService.upgradeSubscription(any(), anyString())).thenReturn(null);
        when(billingService.getCohortAnalytics()).thenReturn(Collections.emptyMap());
        when(billingService.getAnnouncements()).thenReturn(Collections.emptyList());
        when(billingService.createAnnouncement(any())).thenReturn(Collections.emptyMap());
        when(billingService.getBlacklistedIps()).thenReturn(Collections.emptyList());
        when(billingService.addBlacklistIp(any())).thenReturn(Collections.emptyMap());
        when(billingService.updateTenantStatus(any(), anyString())).thenReturn(Collections.emptyMap());
        when(billingService.updateUserStatus(any(), anyString())).thenReturn(Collections.emptyMap());
        when(billingService.resetUserPassword(anyString())).thenReturn(Collections.emptyMap());
        when(auditLogRepository.findAll()).thenReturn(new ArrayList<>());
    }

    private String tokenFor(String role) {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test." + role.toLowerCase() + "@eventos.com")
                .firstName("Platform")
                .lastName(role)
                .build();
        return jwtService.generateToken(user, UUID.randomUUID(), role);
    }

    // ==========================================
    // 1. SUPER_ADMIN: Full Platform Authority
    // ==========================================
    @Test
    @DisplayName("SUPER_ADMIN: Has full authority across all platform operations")
    void testSuperAdminAccess() throws Exception {
        String token = tokenFor("SUPER_ADMIN");

        // Dashboard
        mockMvc.perform(get("/billing/superadmin/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Impersonate
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/impersonate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Upgrade
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/upgrade")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("planCode", "enterprise"))))
                .andExpect(status().isOk());

        // Blacklist Write
        mockMvc.perform(post("/billing/superadmin/security/blacklist")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("ip", "10.0.0.1", "reason", "Abuse"))))
                .andExpect(status().isOk());

        // Password Reset
        mockMvc.perform(post("/billing/superadmin/users/reset-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "target@eventos.com"))))
                .andExpect(status().isOk());
    }

    // ==========================================
    // 2. OPERATIONS_LEAD: Tenant/User Lifecycle
    // ==========================================
    @Test
    @DisplayName("OPERATIONS_LEAD: Permitted for tenant/user operations, Denied for billing & impersonate")
    void testOperationsLeadAccess() throws Exception {
        String token = tokenFor("OPERATIONS_LEAD");

        // Allowed: Tenant write
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "ACTIVE"))))
                .andExpect(status().isOk());

        // Allowed: Announcements write
        mockMvc.perform(post("/billing/superadmin/announcements")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("title", "Maintenance", "message", "Tonight"))))
                .andExpect(status().isOk());

        // Denied: Impersonate -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/impersonate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // Denied: Billing upgrade -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/upgrade")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("planCode", "enterprise"))))
                .andExpect(status().isForbidden());

        // Denied: Blacklist write -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/security/blacklist")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("ip", "10.0.0.1", "reason", "Abuse"))))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // 3. SUPPORT_LEAD: User Support & Password Reset
    // ==========================================
    @Test
    @DisplayName("SUPPORT_LEAD: Permitted for password-reset & announcements read, Denied for billing & tenant write")
    void testSupportLeadAccess() throws Exception {
        String token = tokenFor("SUPPORT_LEAD");

        // Allowed: User password-reset
        mockMvc.perform(post("/billing/superadmin/users/reset-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "target@eventos.com"))))
                .andExpect(status().isOk());

        // Allowed: Announcements read
        mockMvc.perform(get("/billing/superadmin/announcements")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Denied: Tenant write -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "ACTIVE"))))
                .andExpect(status().isForbidden());

        // Denied: Impersonate -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/impersonate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // Denied: Billing upgrade -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/upgrade")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("planCode", "enterprise"))))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // 4. FINANCE_OFFICER: Subscription & Billing
    // ==========================================
    @Test
    @DisplayName("FINANCE_OFFICER: Permitted for billing write & dashboard, Denied for tenant write & impersonate")
    void testFinanceOfficerAccess() throws Exception {
        String token = tokenFor("FINANCE_OFFICER");

        // Allowed: Billing upgrade
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/upgrade")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("planCode", "enterprise"))))
                .andExpect(status().isOk());

        // Allowed: Dashboard read
        mockMvc.perform(get("/billing/superadmin/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Denied: Tenant write -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "ACTIVE"))))
                .andExpect(status().isForbidden());

        // Denied: Password reset -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/users/reset-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "target@eventos.com"))))
                .andExpect(status().isForbidden());

        // Denied: Impersonate -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/impersonate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // 5. DEVOPS_ENGINEER: Telemetry & Audit Logs
    // ==========================================
    @Test
    @DisplayName("DEVOPS_ENGINEER: Permitted for telemetry & logs, Denied for billing & tenant write")
    void testDevopsEngineerAccess() throws Exception {
        String token = tokenFor("DEVOPS_ENGINEER");

        // Allowed: Telemetry
        mockMvc.perform(get("/billing/superadmin/analytics/cohorts")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Allowed: Audit logs
        mockMvc.perform(get("/billing/superadmin/logs")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Denied: Billing upgrade -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/upgrade")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("planCode", "enterprise"))))
                .andExpect(status().isForbidden());

        // Denied: Tenant write -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "ACTIVE"))))
                .andExpect(status().isForbidden());

        // Denied: Impersonate -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/impersonate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // 6. COMPLIANCE_AUDITOR: Read-Only Compliance
    // ==========================================
    @Test
    @DisplayName("COMPLIANCE_AUDITOR: Permitted for audit/metrics reads, Denied for ALL write operations")
    void testComplianceAuditorAccess() throws Exception {
        String token = tokenFor("COMPLIANCE_AUDITOR");

        // Allowed: Read Dashboard
        mockMvc.perform(get("/billing/superadmin/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Allowed: Read Tenants
        mockMvc.perform(get("/billing/superadmin/tenants")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Allowed: Read Audit logs
        mockMvc.perform(get("/billing/superadmin/logs")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Allowed: Read Blacklist
        mockMvc.perform(get("/billing/superadmin/security/blacklist")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Denied: Billing write -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/upgrade")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("planCode", "enterprise"))))
                .andExpect(status().isForbidden());

        // Denied: Tenant write -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "ACTIVE"))))
                .andExpect(status().isForbidden());

        // Denied: Announcements write -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/announcements")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("title", "Test", "message", "Test"))))
                .andExpect(status().isForbidden());

        // Denied: Impersonate -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/impersonate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // Denied: Reset password -> 403 Forbidden
        mockMvc.perform(post("/billing/superadmin/users/reset-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "target@eventos.com"))))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // 7. Untrusted / Non-Platform Roles
    // ==========================================
    @Test
    @DisplayName("Non-Platform Roles (e.g. OWNER, STAFF): Strictly Forbidden from accessing superadmin endpoints")
    void testNonPlatformRoleAccess() throws Exception {
        String token = tokenFor("STAFF");

        mockMvc.perform(get("/billing/superadmin/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/upgrade")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("planCode", "enterprise"))))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // 8. Unauthenticated Access -> 401 Unauthorized
    // ==========================================
    @Test
    @DisplayName("No Authentication: Must return 401 Unauthorized")
    void testUnauthenticatedAccessReturns401() throws Exception {
        // Without Authorization header
        mockMvc.perform(get("/billing/superadmin/dashboard"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/upgrade")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("planCode", "enterprise"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/billing/superadmin/logs"))
                .andExpect(status().isUnauthorized());
    }

    // ==========================================
    // 9. Client-Side Forgery / Spoofing Defense
    // ==========================================
    @Test
    @DisplayName("Client Spoofing Defense: Cookies or request body cannot alter server-side authorization")
    void testClientSpoofingDefense() throws Exception {
        // Token for COMPLIANCE_AUDITOR (read-only)
        String auditorToken = tokenFor("COMPLIANCE_AUDITOR");

        // 1. Forged cookie user_role=SUPER_ADMIN must NOT grant billing:write
        jakarta.servlet.http.Cookie forgedRoleCookie = new jakarta.servlet.http.Cookie("user_role", "SUPER_ADMIN");
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/upgrade")
                        .header("Authorization", "Bearer " + auditorToken)
                        .cookie(forgedRoleCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("planCode", "enterprise"))))
                .andExpect(status().isForbidden());

        // 2. Request body containing role="SUPER_ADMIN" must NOT grant tenant:write
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/status")
                        .header("Authorization", "Bearer " + auditorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "ACTIVE",
                                "role", "SUPER_ADMIN",
                                "roles", "SUPER_ADMIN"
                        ))))
                .andExpect(status().isForbidden());

        // 3. Request body containing permissions=["billing:write"] must NOT elevate privilege
        mockMvc.perform(post("/billing/superadmin/tenants/" + targetTenantId + "/upgrade")
                        .header("Authorization", "Bearer " + auditorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "planCode", "enterprise",
                                "permissions", List.of("billing:write", "tenant:write", "admin:all")
                        ))))
                .andExpect(status().isForbidden());
    }
}
