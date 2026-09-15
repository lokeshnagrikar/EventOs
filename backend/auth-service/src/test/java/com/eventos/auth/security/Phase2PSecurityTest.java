package com.eventos.auth.security;

import com.eventos.auth.dto.CreateRoleDto;
import com.eventos.auth.dto.UpdateRoleDto;
import com.eventos.auth.entity.*;
import com.eventos.auth.repository.*;
import com.eventos.auth.service.AuthService;
import com.eventos.auth.service.BillingService;
import com.eventos.auth.service.JwtService;
import com.eventos.auth.service.RoleService;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class Phase2PSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private BillingService billingService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @MockBean
    private com.eventos.auth.service.EmailService emailService;

    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    private Tenant tenantA;
    private Tenant tenantB;
    private User ownerA;
    private User adminA;
    private User ownerB;
    private String ownerAToken;
    private String adminAToken;
    private String ownerBToken;
    private Role ownerRole;
    private Role adminRole;
    private Role staffRole;

    @BeforeEach
    void setUp() {
        ValueOperations<String, String> valueOps = mock(ValueOperations.class);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get(anyString())).thenReturn(null);

        ownerRole = roleRepository.findByName("OWNER").orElseGet(() ->
                roleRepository.save(Role.builder().name("OWNER").isSystemRole(true).description("Owner").build()));
        adminRole = roleRepository.findByName("ADMIN").orElseGet(() ->
                roleRepository.save(Role.builder().name("ADMIN").isSystemRole(true).description("Admin").build()));
        staffRole = roleRepository.findByName("STAFF").orElseGet(() ->
                roleRepository.save(Role.builder().name("STAFF").isSystemRole(true).description("Staff").build()));

        // Tenant A
        tenantA = tenantRepository.save(Tenant.builder()
                .name("Tenant A Workspace")
                .subscriptionPlan("STARTER")
                .subscriptionStatus("ACTIVE")
                .build());

        companyRepository.save(Company.builder().tenantId(tenantA.getId()).name("Tenant A Co").build());

        ownerA = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Owner")
                .email("alice.owner@tenant-a.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .status("ACTIVE")
                .build());
        membershipRepository.save(Membership.builder()
                .user(ownerA).tenantId(tenantA.getId()).companyId(tenantA.getId()).role(ownerRole).status("ACTIVE").build());
        ownerAToken = jwtService.generateToken(ownerA, tenantA.getId(), "OWNER", List.of("role:manage", "team:manage"), "Tenant A", tenantA.getId(), "dev1", UUID.randomUUID().toString(), false, null);

        adminA = userRepository.save(User.builder()
                .firstName("Adam")
                .lastName("Admin")
                .email("adam.admin@tenant-a.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .status("ACTIVE")
                .build());
        membershipRepository.save(Membership.builder()
                .user(adminA).tenantId(tenantA.getId()).companyId(tenantA.getId()).role(adminRole).status("ACTIVE").build());
        adminAToken = jwtService.generateToken(adminA, tenantA.getId(), "ADMIN", List.of("role:manage", "team:manage"), "Tenant A", tenantA.getId(), "dev2", UUID.randomUUID().toString(), false, null);

        // Tenant B
        tenantB = tenantRepository.save(Tenant.builder()
                .name("Tenant B Workspace")
                .subscriptionPlan("STARTER")
                .subscriptionStatus("ACTIVE")
                .build());
        companyRepository.save(Company.builder().tenantId(tenantB.getId()).name("Tenant B Co").build());

        ownerB = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("Owner")
                .email("bob.owner@tenant-b.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .status("ACTIVE")
                .build());
        membershipRepository.save(Membership.builder()
                .user(ownerB).tenantId(tenantB.getId()).companyId(tenantB.getId()).role(ownerRole).status("ACTIVE").build());
        ownerBToken = jwtService.generateToken(ownerB, tenantB.getId(), "OWNER", List.of("role:manage", "team:manage"), "Tenant B", tenantB.getId(), "dev3", UUID.randomUUID().toString(), false, null);
    }

    // =========================================================================
    // PART A: 2O-01 Role Authorization & System Role Immutability
    // =========================================================================

    @Test
    @DisplayName("2P-A1: Tenant A cannot mutate Tenant B custom role (404 without leaking)")
    void testTenantACannotMutateTenantBCustomRole() throws Exception {
        Role customRoleB = roleService.createCustomRole(tenantB.getId(),
                CreateRoleDto.builder().name("COORDINATOR").description("Tenant B Coordinator").build());

        UpdateRoleDto updateDto = UpdateRoleDto.builder()
                .description("Hacked description")
                .build();

        mockMvc.perform(put("/settings/roles/" + customRoleB.getId())
                        .header("Authorization", "Bearer " + ownerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("2P-A2: Tenant Admin cannot mutate built-in system role (403 Forbidden)")
    void testTenantAdminCannotMutateSystemRole() throws Exception {
        UpdateRoleDto updateDto = UpdateRoleDto.builder()
                .description("Tampered Staff Role")
                .build();

        mockMvc.perform(put("/settings/roles/" + staffRole.getId())
                        .header("Authorization", "Bearer " + ownerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("2P-A3: Tenant Admin cannot delete built-in system role (403 Forbidden)")
    void testTenantAdminCannotDeleteSystemRole() throws Exception {
        mockMvc.perform(delete("/settings/roles/" + staffRole.getId())
                        .header("Authorization", "Bearer " + ownerAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("2P-A4: Tenant Admin cannot create role granting platform authorities (403 Forbidden)")
    void testTenantAdminCannotGrantPlatformAuthorities() throws Exception {
        CreateRoleDto dto = CreateRoleDto.builder()
                .name("ESCALATED_ROLE")
                .permissions(List.of("admin:all", "tenant:impersonate"))
                .build();

        mockMvc.perform(post("/settings/roles")
                        .header("Authorization", "Bearer " + ownerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("2P-A5: Tenant Admin cannot create role with reserved system name (400 Bad Request)")
    void testTenantAdminCannotCreateReservedRole() throws Exception {
        CreateRoleDto dto = CreateRoleDto.builder()
                .name("SUPER_ADMIN")
                .description("Fake superadmin")
                .build();

        mockMvc.perform(post("/settings/roles")
                        .header("Authorization", "Bearer " + ownerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("2P-A6: Valid custom role creation is strictly tenant-scoped")
    void testValidCustomRoleCreationIsTenantScoped() throws Exception {
        CreateRoleDto dto = CreateRoleDto.builder()
                .name("LEAD_PHOTOGRAPHER")
                .description("Lead photographer role")
                .permissions(List.of("gallery:upload", "gallery:view"))
                .build();

        MvcResult result = mockMvc.perform(post("/settings/roles")
                        .header("Authorization", "Bearer " + ownerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        Map<String, Object> map = objectMapper.readValue(body, Map.class);
        Map<String, Object> data = (Map<String, Object>) map.get("data");

        assertEquals("LEAD_PHOTOGRAPHER", data.get("name"));
        assertEquals(tenantA.getId().toString(), data.get("tenantId"));
        assertEquals(false, data.get("isSystemRole"));

        // Tenant B cannot see this custom role
        List<Role> visibleToB = roleService.getRolesVisibleToTenant(tenantB.getId());
        assertFalse(visibleToB.stream().anyMatch(r -> "LEAD_PHOTOGRAPHER".equals(r.getName())));
    }

    // =========================================================================
    // PART B: 2O-02 Role Hierarchy & Team Invitations
    // =========================================================================

    @Test
    @DisplayName("2P-B1: ADMIN cannot invite OWNER (403 Forbidden)")
    void testAdminCannotInviteOwner() throws Exception {
        Map<String, String> req = Map.of(
                "email", "new.owner@example.com",
                "firstName", "New",
                "lastName", "Owner",
                "role", "OWNER"
        );

        mockMvc.perform(post("/settings/team")
                        .header("Authorization", "Bearer " + adminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("2P-B2: ADMIN cannot invite another ADMIN (403 Forbidden)")
    void testAdminCannotInviteAdmin() throws Exception {
        Map<String, String> req = Map.of(
                "email", "peer.admin@example.com",
                "firstName", "Peer",
                "lastName", "Admin",
                "role", "ADMIN"
        );

        mockMvc.perform(post("/settings/team")
                        .header("Authorization", "Bearer " + adminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("2P-B3: Neither ADMIN nor OWNER can invite SUPER_ADMIN (403 Forbidden)")
    void testCannotInviteSuperAdmin() throws Exception {
        Map<String, String> req = Map.of(
                "email", "fake.super@example.com",
                "firstName", "Fake",
                "lastName", "Super",
                "role", "SUPER_ADMIN"
        );

        mockMvc.perform(post("/settings/team")
                        .header("Authorization", "Bearer " + ownerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("2P-B4: ADMIN can invite STAFF (strictly below their tier)")
    void testAdminCanInviteStaff() throws Exception {
        Map<String, String> req = Map.of(
                "email", "new.staff@example.com",
                "firstName", "New",
                "lastName", "Staff",
                "role", "STAFF"
        );

        mockMvc.perform(post("/settings/team")
                        .header("Authorization", "Bearer " + adminAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("2P-B5: OWNER can invite ADMIN")
    void testOwnerCanInviteAdmin() throws Exception {
        Map<String, String> req = Map.of(
                "email", "subordinate.admin@example.com",
                "firstName", "Subordinate",
                "lastName", "Admin",
                "role", "ADMIN"
        );

        mockMvc.perform(post("/settings/team")
                        .header("Authorization", "Bearer " + ownerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    // =========================================================================
    // PART C: 2O-03 Billing Direct Upgrade Hardening
    // =========================================================================

    @Test
    @DisplayName("2P-C1: Direct upgrade to paid plan is rejected (400 Bad Request)")
    void testDirectPaidPlanUpgradeIsRejected() throws Exception {
        // Ensure paid plan exists
        planRepository.findByCode("enterprise").orElseGet(() ->
                planRepository.save(Plan.builder()
                        .name("Enterprise")
                        .code("enterprise")
                        .price(new BigDecimal("999.00"))
                        .currency("USD")
                        .billingInterval("MONTHLY")
                        .build()));

        Map<String, String> body = Map.of("planCode", "enterprise");

        mockMvc.perform(post("/billing/subscription/upgrade")
                .header("Authorization", "Bearer " + ownerAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("planCode", "enterprise"))))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // PART G: 2O-07 Impersonation Security
    // =========================================================================

    @Test
    @DisplayName("2P-G1: Impersonated session cannot generate permanent API keys (403 Forbidden)")
    void testImpersonatedSessionCannotGenerateApiKey() throws Exception {
        UUID adminId = UUID.randomUUID();
        // Generate token with impersonated = true
        String impersonatedToken = jwtService.generateToken(
                ownerA, tenantA.getId(), "OWNER", List.of("apikey:manage"),
                "Tenant A", tenantA.getId(), "dev1", UUID.randomUUID().toString(),
                true, adminId
        );

        Map<String, String> req = Map.of("name", "Malicious Key");

        mockMvc.perform(post("/settings/apikeys")
                        .header("Authorization", "Bearer " + impersonatedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }
}
