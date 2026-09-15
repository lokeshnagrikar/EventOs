package com.eventos.auth.security;

import com.eventos.auth.config.UserPrincipal;
import com.eventos.auth.dto.LoginRequestDto;
import com.eventos.auth.entity.*;
import com.eventos.auth.repository.*;
import com.eventos.auth.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
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

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class Phase2NSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TotpService totpService;

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
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private User2FaRepository user2FaRepository;

    @Autowired
    private PasswordHistoryRepository passwordHistoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private BillingService billingService;

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @MockBean
    private EmailService emailService;

    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    @MockBean
    private ValueOperations<String, String> valueOperations;

    private final Map<String, String> inMemoryRedis = new HashMap<>();

    private User testUserA;
    private Tenant testTenantA;
    private Tenant testTenantB;
    private Role ownerRole;
    private Role adminRole;
    private String originalPasswordHash;

    @BeforeEach
    void setUp() {
        inMemoryRedis.clear();
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            String val = invocation.getArgument(1);
            inMemoryRedis.put(key, val);
            return null;
        }).when(valueOperations).set(anyString(), anyString());

        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            String val = invocation.getArgument(1);
            inMemoryRedis.put(key, val);
            return null;
        }).when(valueOperations).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));

        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            return inMemoryRedis.get(key);
        }).when(valueOperations).get(anyString());

        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            return inMemoryRedis.containsKey(key);
        }).when(stringRedisTemplate).hasKey(anyString());

        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            inMemoryRedis.remove(key);
            return true;
        }).when(stringRedisTemplate).delete(anyString());

        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            long count = 1L;
            if (inMemoryRedis.containsKey(key)) {
                try {
                    count = Long.parseLong(inMemoryRedis.get(key)) + 1L;
                } catch (Exception ignored) {}
            }
            inMemoryRedis.put(key, String.valueOf(count));
            return count;
        }).when(valueOperations).increment(anyString());

        // Set up roles
        ownerRole = roleRepository.findByName("OWNER").orElseGet(() ->
                roleRepository.save(Role.builder().name("OWNER").permissionsJson("[\"all\"]").build()));
        adminRole = roleRepository.findByName("ADMIN").orElseGet(() ->
                roleRepository.save(Role.builder().name("ADMIN").permissionsJson("[\"all\"]").build()));

        // Create Tenant A
        testTenantA = tenantRepository.save(Tenant.builder().name("Tenant A").build());
        companyRepository.save(Company.builder().name("Company A").tenantId(testTenantA.getId()).build());

        // Create Tenant B
        testTenantB = tenantRepository.save(Tenant.builder().name("Tenant B").build());
        companyRepository.save(Company.builder().name("Company B").tenantId(testTenantB.getId()).build());

        // Create User A in Tenant A
        originalPasswordHash = passwordEncoder.encode("OriginalSecretPassword123!");
        testUserA = userRepository.save(User.builder()
                .email("alice." + UUID.randomUUID() + "@eventos.security")
                .firstName("Alice")
                .lastName("Smith")
                .passwordHash(originalPasswordHash)
                .status("ACTIVE")
                .build());
        testUserA.setEmailVerified(true);
        testUserA = userRepository.save(testUserA);

        membershipRepository.save(Membership.builder()
                .user(testUserA)
                .tenantId(testTenantA.getId())
                .companyId(testTenantA.getId())
                .role(ownerRole)
                .status("ACTIVE")
                .build());
    }

    // =========================================================================
    // 2N-A & 2N-G: MAGIC LINK & RESEND VERIFICATION NO LEAKS & ACCOUNT ENUMERATION
    // =========================================================================

    @Test
    @DisplayName("2N-A / 2N-G: Magic Link response contains generic message and NEVER leaks magicToken/magicLinkUrl")
    void testMagicLinkNoTokenInResponseAndAccountEnumeration() throws Exception {
        // 1. Existing user
        MvcResult existingResult = mockMvc.perform(post("/magic-link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", testUserA.getEmail()))))
                .andExpect(status().isOk())
                .andReturn();

        String existingBody = existingResult.getResponse().getContentAsString();
        assertFalse(existingBody.contains("magicToken"), "Response body must NEVER contain magicToken");
        assertFalse(existingBody.contains("magicLinkUrl"), "Response body must NEVER contain magicLinkUrl");
        assertTrue(existingBody.contains("If the account exists, a sign-in link has been sent."));

        // 2. Non-existent user
        MvcResult nonExistentResult = mockMvc.perform(post("/magic-link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "nonexistent." + UUID.randomUUID() + "@eventos.security"))))
                .andExpect(status().isOk())
                .andReturn();

        String nonExistentBody = nonExistentResult.getResponse().getContentAsString();
        assertEquals(existingBody, nonExistentBody, "Responses for existing and nonexistent emails must be identical");
    }

    @Test
    @DisplayName("2N-G: Resend verification normalizes responses between existing and nonexistent accounts")
    void testResendVerificationAccountEnumeration() throws Exception {
        // 1. Existing unverified user
        User unverifiedUser = userRepository.save(User.builder()
                .email("unverified." + UUID.randomUUID() + "@eventos.security")
                .firstName("Unverified")
                .lastName("User")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .status("ACTIVE")
                .isEmailVerified(false)
                .build());

        MvcResult res1 = mockMvc.perform(post("/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", unverifiedUser.getEmail()))))
                .andExpect(status().isOk())
                .andReturn();

        // 2. Nonexistent user
        MvcResult res2 = mockMvc.perform(post("/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "nonexistent." + UUID.randomUUID() + "@eventos.security"))))
                .andExpect(status().isOk())
                .andReturn();

        String body1 = res1.getResponse().getContentAsString();
        String body2 = res2.getResponse().getContentAsString();
        assertEquals(body1, body2, "Resend verification responses must be indistinguishable");
        assertFalse(body1.contains("verificationToken"), "Response must NEVER return verificationToken");
    }

    // =========================================================================
    // 2N-B: EXISTING USER INVITATION PASSWORD TAKEOVER & NO TOKEN LEAK
    // =========================================================================

    @Test
    @DisplayName("2N-B: Team invitation does NOT return inviteToken in response payload")
    void testTeamInvitationDoesNotLeakToken() {
        Map<String, Object> result = authService.inviteTeamMember(
                testTenantA.getId(),
                "newinvite." + UUID.randomUUID() + "@eventos.security",
                "Invited",
                "Person",
                "ADMIN",
                null,
                testUserA.getId());

        assertNotNull(result);
        assertTrue((Boolean) result.get("success"));
        assertNull(result.get("inviteToken"), "inviteToken must NEVER be returned in response");
    }

    @Test
    @DisplayName("2N-B: Accepting cross-tenant invitation does NOT overwrite existing user's global password")
    void testExistingUserInvitationDoesNotOverwritePassword() {
        // Tenant B invites Alice (existing user of Tenant A)
        Map<String, Object> inviteResult = authService.inviteTeamMember(
                testTenantB.getId(),
                testUserA.getEmail(),
                "Alice",
                "Smith",
                "ADMIN",
                null,
                null);

        assertTrue((Boolean) inviteResult.get("success"));
        assertNull(inviteResult.get("inviteToken"), "Raw token not in response");

        // Obtain the invitation entity from repository to simulate token receipt from email
        List<Invitation> invitations = invitationRepository.findAll();
        Invitation invitation = invitations.stream()
                .filter(i -> i.getEmail().equalsIgnoreCase(testUserA.getEmail()) && i.getTenantId().equals(testTenantB.getId()))
                .findFirst()
                .orElseThrow();

        // Verify invitation stores hashed token, not plain token
        assertNotNull(invitation.getTokenHash());

        // In email flow, raw token is generated; simulate token matching invitation
        // Generate a new invitation with a known rawToken
        String rawToken = UUID.randomUUID().toString();
        invitation.setTokenHash(AuthService.sha256(rawToken));
        invitationRepository.save(invitation);

        // Attacker or admin attempts to accept invitation with a NEW password "MaliciousPassword999!"
        Map<String, Object> acceptResult = authService.acceptInvitation(rawToken, "MaliciousPassword999!");
        assertTrue((Boolean) acceptResult.get("success"));

        // Verify User A state in database
        User reloadedUser = userRepository.findById(testUserA.getId()).orElseThrow();

        // CRITICAL CHECK: Password hash must remain byte-for-byte UNCHANGED!
        assertEquals(originalPasswordHash, reloadedUser.getPasswordHash(),
                "CRITICAL: Existing user's password hash MUST NOT be altered by cross-tenant invitation acceptance!");

        // Verify original password still authenticates
        assertTrue(passwordEncoder.matches("OriginalSecretPassword123!", reloadedUser.getPasswordHash()));
        assertFalse(passwordEncoder.matches("MaliciousPassword999!", reloadedUser.getPasswordHash()));

        // Verify Tenant A membership remains ACTIVE
        Membership memA = membershipRepository.findByUserIdAndTenantId(testUserA.getId(), testTenantA.getId()).orElseThrow();
        assertEquals("ACTIVE", memA.getStatus());

        // Verify Tenant B membership is now ACTIVE
        Membership memB = membershipRepository.findByUserIdAndTenantId(testUserA.getId(), testTenantB.getId()).orElseThrow();
        assertEquals("ACTIVE", memB.getStatus());

        // Verify invitation replay fails
        assertThrows(IllegalArgumentException.class, () -> authService.acceptInvitation(rawToken, "AnyPassword"));
    }

    // =========================================================================
    // 2N-C: IMMEDIATE SESSION REVOCATION REDIS STATE
    // =========================================================================

    @Test
    @DisplayName("2N-C: Explicit session revocation and password reset set Redis revocation keys")
    void testImmediateSessionRevocationRedisKeys() {
        UUID sessionId = UUID.randomUUID();

        // Revoke single session
        authService.revokeSingleSession(sessionId);
        assertTrue(inMemoryRedis.containsKey("session:revoked:" + sessionId));

        // Revoke all user sessions (password reset / account delete)
        authService.revokeAllUserSessions(testUserA.getId());
        assertTrue(inMemoryRedis.containsKey("user:revoked_before:" + testUserA.getId()));
        long revokedBefore = Long.parseLong(inMemoryRedis.get("user:revoked_before:" + testUserA.getId()));
        assertTrue(revokedBefore > 0);
    }

    // =========================================================================
    // 2N-D: WHATSAPP OTP SESSION PERSISTENCE
    // =========================================================================

    @Test
    @DisplayName("2N-D: verifyWhatsAppOtp creates Session and persists hashed RefreshToken")
    void testWhatsAppOtpPersistsSessionAndHashedToken() {
        String testPhone = "+919876543210";
        testUserA.setPhone(testPhone);
        userRepository.save(testUserA);

        inMemoryRedis.put("WA_OTP:" + testPhone, "123456");

        Map<String, Object> result = authService.verifyWhatsAppOtp(testPhone, "123456");

        assertNotNull(result);
        assertNotNull(result.get("accessToken"));
        String rawRefreshToken = (String) result.get("refreshToken");
        assertNotNull(rawRefreshToken);

        // Verify RefreshToken exists in database with hashed token
        String expectedHash = AuthService.sha256(rawRefreshToken);
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(expectedHash);
        assertTrue(tokenOpt.isPresent(), "Hashed refresh token must be persisted in database");

        // Verify Session exists in database
        Optional<Session> sessionOpt = sessionRepository.findByRefreshTokenId(tokenOpt.get().getId());
        assertTrue(sessionOpt.isPresent(), "Session entity must be persisted in database");
        assertEquals(testUserA.getId(), sessionOpt.get().getUser().getId());
    }

    // =========================================================================
    // 2N-E: REAL 2FA / TOTP ENFORCEMENT
    // =========================================================================

    @Test
    @DisplayName("2N-E: Real RFC 6238 TOTP enforcement on login")
    void testRealTwoFactorTotpEnforcement() throws Exception {
        // Setup 2FA for testUserA
        String secret = totpService.generateSecret();
        User2Fa user2Fa = user2FaRepository.save(User2Fa.builder()
                .userId(testUserA.getId())
                .secret(secret)
                .backupCodes("BACKUP01,BACKUP02")
                .build());
        user2Fa.setEnabled(true);
        user2FaRepository.save(user2Fa);

        // 1. Password-only login must NOT return final tokens; must return 2FA challenge
        LoginRequestDto loginRequest = new LoginRequestDto();
        loginRequest.setEmail(testUserA.getEmail());
        loginRequest.setPassword("OriginalSecretPassword123!");
        loginRequest.setTenantId(testTenantA.getId());

        MvcResult loginResult = mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String loginBody = loginResult.getResponse().getContentAsString();
        assertTrue(loginBody.contains("requires2fa"), "Response must indicate 2FA is required");
        assertFalse(loginBody.contains("accessToken"), "Access token must NOT be issued on password alone");

        String challengeToken = objectMapper.readTree(loginBody).path("challengeToken").asText();
        assertNotNull(challengeToken);
        assertFalse(challengeToken.isEmpty());

        // 2. Submitting invalid TOTP code fails
        mockMvc.perform(post("/2fa/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "challengeToken", challengeToken,
                                "code", "000000"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_2FA_CODE"));

        // 3. Submitting valid RFC 6238 TOTP code succeeds
        long currentWindow = System.currentTimeMillis() / 1000L / 30L;
        byte[] keyBytes = TotpService.decodeBase32(secret);
        int validCodeInt = totpService.generateTotp(keyBytes, currentWindow);
        String validCode = String.format("%06d", validCodeInt);

        MvcResult verifyResult = mockMvc.perform(post("/2fa/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "challengeToken", challengeToken,
                                "code", validCode))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andReturn();

        // 4. Verify challenge token cannot be replayed
        mockMvc.perform(post("/2fa/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "challengeToken", challengeToken,
                                "code", validCode))))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // 2N-F: SUPERADMIN IMPERSONATION AUDIT ATTRIBUTION
    // =========================================================================

    @Test
    @DisplayName("2N-F: Impersonation token contains adminUserId and impersonated=true claims")
    void testSuperAdminImpersonationAttribution() {
        UUID adminUserId = UUID.randomUUID();
        String impersonatedToken = billingService.impersonateTenant(testTenantA.getId(), adminUserId, "127.0.0.1");

        assertNotNull(impersonatedToken);
        Claims claims = jwtService.getClaims(impersonatedToken);

        assertEquals(true, claims.get("impersonated"));
        assertEquals(adminUserId.toString(), claims.get("adminUserId"));
        assertEquals(testTenantA.getId().toString(), claims.get("tenantId"));
    }

    // =========================================================================
    // 2N-H: CONCURRENT REFRESH SAFETY & REPLAY DETECTION
    // =========================================================================

    @Test
    @DisplayName("2N-H: Concurrent refresh within 30s grace window succeeds idempotently; replay outside window fails")
    void testConcurrentRefreshGraceWindowAndReplayDetection() {
        String rawToken = "initial_refresh_token_" + UUID.randomUUID();
        String tokenHash = AuthService.sha256(rawToken);

        RefreshToken refreshToken = refreshTokenRepository.save(RefreshToken.builder()
                .user(testUserA)
                .token(tokenHash)
                .tenantId(testTenantA.getId())
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build());

        sessionRepository.save(Session.builder()
                .id(UUID.randomUUID())
                .user(testUserA)
                .tenantId(testTenantA.getId())
                .refreshToken(refreshToken)
                .ipAddress("127.0.0.1")
                .lastActiveAt(LocalDateTime.now())
                .build());

        // First refresh: rotates the token
        Map<String, Object> firstRefresh = authService.refresh(rawToken, "127.0.0.1", "Browser", "Windows", "Chrome", "UserAgent");
        assertNotNull(firstRefresh);
        String newRawToken = (String) firstRefresh.get("refreshToken");
        assertNotNull(newRawToken);

        // Verify grace key was written to Redis
        assertTrue(inMemoryRedis.containsKey("refresh:grace:" + tokenHash));

        // Second near-simultaneous refresh with old token (within grace window) must SUCCEED idempotently
        Map<String, Object> duplicateRefresh = authService.refresh(rawToken, "127.0.0.1", "Browser", "Windows", "Chrome", "UserAgent");
        assertNotNull(duplicateRefresh);
        assertEquals(firstRefresh.get("accessToken"), duplicateRefresh.get("accessToken"));
        assertEquals(firstRefresh.get("refreshToken"), duplicateRefresh.get("refreshToken"));

        // Simulate expiration of grace window (remove from grace, leaving only rotated:token)
        inMemoryRedis.remove("refresh:grace:" + tokenHash);
        assertTrue(inMemoryRedis.containsKey("rotated:token:" + tokenHash));

        // Genuine replay attempt after grace window must trigger security exception and invalidate sessions
        assertThrows(SecurityException.class, () ->
                authService.refresh(rawToken, "127.0.0.1", "Browser", "Windows", "Chrome", "UserAgent"));

        // Verify user sessions were revoked
        assertTrue(inMemoryRedis.containsKey("user:revoked_before:" + testUserA.getId()));
    }

    // =========================================================================
    // 2N-I: PASSWORD HISTORY ENFORCED ON RESET
    // =========================================================================

    @Test
    @DisplayName("2N-I: Password history is checked and saved during resetPassword")
    void testPasswordHistoryEnforcedOnReset() {
        // Save initial password in history
        passwordHistoryRepository.save(PasswordHistory.builder()
                .user(testUserA)
                .passwordHash(originalPasswordHash)
                .build());

        String resetToken = UUID.randomUUID().toString();
        inMemoryRedis.put("reset:token:" + AuthService.sha256(resetToken), testUserA.getEmail());

        // Attempting to reset to the same password must be rejected
        assertThrows(IllegalArgumentException.class, () ->
                authService.resetPassword(resetToken, "OriginalSecretPassword123!"));

        // Resetting to a fresh password succeeds
        inMemoryRedis.put("reset:token:" + AuthService.sha256(resetToken), testUserA.getEmail());
        Map<String, Object> resetResult = authService.resetPassword(resetToken, "BrandNewSecurePassword456!");
        assertTrue((Boolean) resetResult.get("success"));

        // Verify new password was saved to history
        List<PasswordHistory> history = passwordHistoryRepository.findTop3ByUserIdOrderByCreatedAtDesc(testUserA.getId());
        assertTrue(history.size() >= 2);
    }

    // =========================================================================
    // 2N-J: JWT ISSUER & AUDIENCE
    // =========================================================================

    @Test
    @DisplayName("2N-J: JWT generation includes iss = eventos-auth-service and aud = eventos-platform")
    void testJwtIssuerAndAudienceClaims() {
        String token = jwtService.generateToken(testUserA, testTenantA.getId(), "OWNER");
        Claims claims = jwtService.getClaims(token);

        assertEquals("eventos-auth-service", claims.getIssuer());
        assertTrue(claims.getAudience().contains("eventos-platform"));
    }

    // =========================================================================
    // 2N-K: RESTRICT TEST EMAIL ENDPOINT
    // =========================================================================

    @Test
    @DisplayName("2N-K: Anonymous request to /test-email is rejected with 401/403")
    void testTestEmailAnonymousBlocked() throws Exception {
        mockMvc.perform(get("/test-email").param("to", "victim@external.com"))
                .andExpect(status().isUnauthorized());
    }
}
