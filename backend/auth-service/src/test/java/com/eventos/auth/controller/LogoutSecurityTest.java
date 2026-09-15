package com.eventos.auth.controller;

import com.eventos.auth.entity.*;
import com.eventos.auth.repository.*;
import com.eventos.auth.service.EmailService;
import com.eventos.auth.service.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
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
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class LogoutSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    @MockBean
    private ValueOperations<String, String> valueOperations;

    @MockBean
    private EmailService emailService;

    private User userA;
    private Tenant tenantA;
    private RefreshToken rtA;
    private String rawTokenA;
    private String tokenHashA;
    private String jwtA;

    private User userB;
    private Tenant tenantB;
    private RefreshToken rtB;
    private String rawTokenB;
    private String tokenHashB;
    private String jwtB;

    private Role ownerRole;

    private String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    @BeforeEach
    void setUp() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);

        // Role
        ownerRole = roleRepository.findByName("OWNER").orElseGet(() ->
                roleRepository.save(Role.builder().name("OWNER").description("Owner").build())
        );

        // User & Tenant A
        tenantA = tenantRepository.save(Tenant.builder()
                .name("Tenant A Corp")
                .subscriptionPlan("professional")
                .subscriptionStatus("ACTIVE")
                .maxUsers(10)
                .maxStorage(1000000L)
                .build());

        Company companyA = companyRepository.save(Company.builder()
                .name("Tenant A Corp")
                .tenantId(tenantA.getId())
                .build());

        userA = userRepository.save(User.builder()
                .email("user.a." + UUID.randomUUID() + "@eventos.com")
                .firstName("Alice")
                .lastName("User")
                .passwordHash("$2a$12$DummyHashForTestingAliceAliceAliceAliceAliceAliceAliceAlice")
                .status("ACTIVE")
                .isEmailVerified(true)
                .build());

        membershipRepository.save(Membership.builder()
                .user(userA)
                .tenantId(tenantA.getId())
                .companyId(companyA.getId())
                .role(ownerRole)
                .status("ACTIVE")
                .build());

        rawTokenA = UUID.randomUUID().toString();
        tokenHashA = sha256(rawTokenA);
        rtA = refreshTokenRepository.save(RefreshToken.builder()
                .user(userA)
                .tenantId(tenantA.getId())
                .token(tokenHashA)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build());

        Session sessionA = sessionRepository.save(Session.builder()
                .user(userA)
                .tenantId(tenantA.getId())
                .refreshToken(rtA)
                .ipAddress("127.0.0.1")
                .browser("Chrome")
                .osName("Windows")
                .build());

        jwtA = jwtService.generateToken(userA, tenantA.getId(), "OWNER",
                Collections.emptyList(), "Tenant A Corp", tenantA.getId(), "deviceA", sessionA.getId().toString());

        // User & Tenant B
        tenantB = tenantRepository.save(Tenant.builder()
                .name("Tenant B Corp")
                .subscriptionPlan("professional")
                .subscriptionStatus("ACTIVE")
                .maxUsers(10)
                .maxStorage(1000000L)
                .build());

        Company companyB = companyRepository.save(Company.builder()
                .name("Tenant B Corp")
                .tenantId(tenantB.getId())
                .build());

        userB = userRepository.save(User.builder()
                .email("user.b." + UUID.randomUUID() + "@eventos.com")
                .firstName("Bob")
                .lastName("User")
                .passwordHash("$2a$12$DummyHashForTestingBobBobBobBobBobBobBobBobBobBobBobBob")
                .status("ACTIVE")
                .isEmailVerified(true)
                .build());

        membershipRepository.save(Membership.builder()
                .user(userB)
                .tenantId(tenantB.getId())
                .companyId(companyB.getId())
                .role(ownerRole)
                .status("ACTIVE")
                .build());

        rawTokenB = UUID.randomUUID().toString();
        tokenHashB = sha256(rawTokenB);
        rtB = refreshTokenRepository.save(RefreshToken.builder()
                .user(userB)
                .tenantId(tenantB.getId())
                .token(tokenHashB)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build());

        Session sessionB = sessionRepository.save(Session.builder()
                .user(userB)
                .tenantId(tenantB.getId())
                .refreshToken(rtB)
                .ipAddress("127.0.0.1")
                .browser("Firefox")
                .osName("Linux")
                .build());

        jwtB = jwtService.generateToken(userB, tenantB.getId(), "OWNER",
                Collections.emptyList(), "Tenant B Corp", tenantB.getId(), "deviceB", sessionB.getId().toString());
    }

    // ==========================================
    // 1. Unauthenticated Logout Blocked (401)
    // ==========================================
    @Test
    @DisplayName("Unauthenticated logout is rejected with 401 and does NOT invalidate session")
    void testUnauthenticatedLogoutBlocked() throws Exception {
        mockMvc.perform(post("/logout"))
                .andExpect(status().isUnauthorized());

        // Sessions & tokens remain intact
        assertTrue(refreshTokenRepository.findByToken(tokenHashA).isPresent());
        assertTrue(sessionRepository.findByRefreshTokenId(rtA.getId()).isPresent());
    }

    // ==========================================
    // 2. Arbitrary Email Attack Blocked (401)
    // ==========================================
    @Test
    @DisplayName("Unauthenticated logout with arbitrary victim email is rejected with 401")
    void testArbitraryEmailAttackBlocked() throws Exception {
        mockMvc.perform(post("/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", userA.getEmail()))))
                .andExpect(status().isUnauthorized());

        // Alice's session was NOT terminated
        assertTrue(refreshTokenRepository.findByToken(tokenHashA).isPresent());
        assertTrue(sessionRepository.findByRefreshTokenId(rtA.getId()).isPresent());
    }

    // ==========================================
    // 3. Forged Bearer Token Blocked (401)
    // ==========================================
    @Test
    @DisplayName("Invalid/forged bearer token cannot access logout or mutate sessions")
    void testInvalidTokenCannotLogout() throws Exception {
        mockMvc.perform(post("/logout")
                        .header("Authorization", "Bearer invalid.forged.jwt.token"))
                .andExpect(status().isUnauthorized());

        assertTrue(refreshTokenRepository.findByToken(tokenHashA).isPresent());
    }

    // ==========================================
    // 4. Authenticated Logout Revokes Session & Cookie
    // ==========================================
    @Test
    @DisplayName("Authenticated user logout revokes current session, refresh token, and clears cookie")
    void testAuthenticatedLogoutSuccess() throws Exception {
        mockMvc.perform(post("/logout")
                        .header("Authorization", "Bearer " + jwtA)
                        .cookie(new Cookie("refreshToken", rawTokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        // Alice's refresh token and session are deleted
        assertFalse(refreshTokenRepository.findByToken(tokenHashA).isPresent());
        assertFalse(sessionRepository.findByRefreshTokenId(rtA.getId()).isPresent());
    }

    // ==========================================
    // 5. Post-Logout Refresh Token Reuse Fails
    // ==========================================
    @Test
    @DisplayName("Revoked refresh token cannot be used to obtain a new access token")
    void testPostLogoutRefreshTokenReuseFails() throws Exception {
        // Alice logs out
        mockMvc.perform(post("/logout")
                        .header("Authorization", "Bearer " + jwtA)
                        .cookie(new Cookie("refreshToken", rawTokenA)))
                .andExpect(status().isOk());

        // Attempting refresh with Alice's old token MUST FAIL
        mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawTokenA)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    // ==========================================
    // 6. Cross-User Session Isolation Maintained
    // ==========================================
    @Test
    @DisplayName("User A logout does NOT invalidate User B's independent session even if User B's email/token is passed")
    void testCrossUserSessionIsolation() throws Exception {
        // User A logs out, maliciously providing User B's email and User B's refresh token
        mockMvc.perform(post("/logout")
                        .header("Authorization", "Bearer " + jwtA)
                        .cookie(new Cookie("refreshToken", rawTokenB))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", userB.getEmail()))))
                .andExpect(status().isOk());

        // User B's refresh token and session MUST REMAIN ACTIVE
        assertTrue(refreshTokenRepository.findByToken(tokenHashB).isPresent());
        assertTrue(sessionRepository.findByRefreshTokenId(rtB.getId()).isPresent());

        // User B can still successfully refresh their session
        mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawTokenB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()));
    }
}
