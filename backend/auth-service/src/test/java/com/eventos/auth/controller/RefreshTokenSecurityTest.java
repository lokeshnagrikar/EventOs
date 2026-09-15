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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class RefreshTokenSecurityTest {

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

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    @MockBean
    private ValueOperations<String, String> valueOperations;

    @MockBean
    private EmailService emailService;

    private final Map<String, String> redisMockStorage = new ConcurrentHashMap<>();

    private User userA;
    private Tenant tenantA;
    private Membership membershipA;
    private String userAPassword = "StrongSecurePassword123!";

    private User userB;
    private Tenant tenantB;
    private Membership membershipB;
    private String userBPassword = "StrongSecurePassword456!";

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

    private String extractCookieValue(String setCookieHeader, String cookieName) {
        if (setCookieHeader == null) return null;
        for (String part : setCookieHeader.split(";")) {
            String trimmed = part.trim();
            if (trimmed.startsWith(cookieName + "=")) {
                return trimmed.substring((cookieName + "=").length());
            }
        }
        return null;
    }

    @BeforeEach
    void setUp() {
        redisMockStorage.clear();
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        when(valueOperations.get(anyString())).thenAnswer(inv -> redisMockStorage.get(inv.getArgument(0)));
        doAnswer(inv -> {
            redisMockStorage.put(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(valueOperations).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));

        // Role
        ownerRole = roleRepository.findByName("OWNER").orElseGet(() ->
                roleRepository.save(Role.builder().name("OWNER").description("Owner").build())
        );

        // User & Tenant A
        tenantA = tenantRepository.save(Tenant.builder()
                .name("Tenant Alpha Corp")
                .subscriptionPlan("professional")
                .subscriptionStatus("ACTIVE")
                .maxUsers(10)
                .maxStorage(1000000L)
                .build());

        companyRepository.save(Company.builder()
                .name("Tenant Alpha Corp")
                .tenantId(tenantA.getId())
                .build());

        userA = userRepository.save(User.builder()
                .email("user.alpha." + UUID.randomUUID() + "@eventos.com")
                .firstName("Alice")
                .lastName("Alpha")
                .passwordHash(passwordEncoder.encode(userAPassword))
                .status("ACTIVE")
                .build());
        userA.setEmailVerified(true);
        userA = userRepository.save(userA);

        membershipA = membershipRepository.save(Membership.builder()
                .user(userA)
                .tenantId(tenantA.getId())
                .companyId(companyRepository.findAll().get(0).getId())
                .role(ownerRole)
                .status("ACTIVE")
                .build());

        // User & Tenant B
        tenantB = tenantRepository.save(Tenant.builder()
                .name("Tenant Beta Corp")
                .subscriptionPlan("enterprise")
                .subscriptionStatus("ACTIVE")
                .maxUsers(50)
                .maxStorage(5000000L)
                .build());

        companyRepository.save(Company.builder()
                .name("Tenant Beta Corp")
                .tenantId(tenantB.getId())
                .build());

        userB = userRepository.save(User.builder()
                .email("user.beta." + UUID.randomUUID() + "@eventos.com")
                .firstName("Bob")
                .lastName("Beta")
                .passwordHash(passwordEncoder.encode(userBPassword))
                .status("ACTIVE")
                .build());
        userB.setEmailVerified(true);
        userB = userRepository.save(userB);

        membershipB = membershipRepository.save(Membership.builder()
                .user(userB)
                .tenantId(tenantB.getId())
                .companyId(companyRepository.findAll().get(0).getId())
                .role(ownerRole)
                .status("ACTIVE")
                .build());
    }

    // =========================================================================
    // Case A & B: Login returns accessToken, NO refreshToken in JSON, sets HttpOnly cookie
    // =========================================================================
    @Test
    @DisplayName("Case A & B: Login returns access token in JSON, no refreshToken in JSON, sets HttpOnly cookie")
    void testCaseA_B_LoginNoRefreshTokenInJson_SetsHttpOnlyCookie() throws Exception {
        Map<String, Object> loginBody = Map.of(
                "email", userA.getEmail(),
                "password", userAPassword,
                "tenantId", tenantA.getId().toString()
        );

        MvcResult result = mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken").doesNotExist()) // Case A: ZERO refreshToken in JSON!
                .andExpect(header().exists("Set-Cookie"))
                .andReturn();

        String setCookieHeader = result.getResponse().getHeader("Set-Cookie");
        assertNotNull(setCookieHeader);
        assertTrue(setCookieHeader.contains("refreshToken="), "Set-Cookie must contain refreshToken");
        assertTrue(setCookieHeader.contains("HttpOnly"), "Set-Cookie must be HttpOnly");
        assertTrue(setCookieHeader.contains("Path=/"), "Set-Cookie must have Path=/");
        assertTrue(setCookieHeader.contains("Max-Age="), "Set-Cookie must have Max-Age");
    }

    // =========================================================================
    // Case C, D, E: Refresh with valid token succeeds, rotates Token A -> Token B, rejects Token A reuse
    // =========================================================================
    @Test
    @DisplayName("Case C, D, E: Refresh rotates Token A to Token B; Token A cannot be reused")
    void testCaseC_D_E_RefreshRotationAndReplayRejection() throws Exception {
        // 1. Perform login to get Token A
        Map<String, Object> loginBody = Map.of(
                "email", userA.getEmail(),
                "password", userAPassword,
                "tenantId", tenantA.getId().toString()
        );

        MvcResult loginResult = mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBody)))
                .andExpect(status().isOk())
                .andReturn();

        String setCookieA = loginResult.getResponse().getHeader("Set-Cookie");
        String rawTokenA = extractCookieValue(setCookieA, "refreshToken");
        assertNotNull(rawTokenA);
        assertTrue(rawTokenA.length() >= 40, "Token must be high-entropy (>256 bits Base64URL)");

        // 2. Perform refresh with Token A -> must succeed and yield Token B
        MvcResult refreshResult = mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawTokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken").doesNotExist()) // NO refreshToken in JSON!
                .andExpect(header().exists("Set-Cookie"))
                .andReturn();

        String setCookieB = refreshResult.getResponse().getHeader("Set-Cookie");
        String rawTokenB = extractCookieValue(setCookieB, "refreshToken");
        assertNotNull(rawTokenB);
        assertNotEquals(rawTokenA, rawTokenB, "Case D: Refresh MUST rotate Token A to a distinct Token B");

        // 3. Case E: Expire 30s concurrent refresh grace window, then attempt to reuse Token A -> MUST BE REJECTED WITH 401 UNAUTHORIZED!
        redisMockStorage.remove("refresh:grace:" + sha256(rawTokenA));
        mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawTokenA)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_REFRESH_TOKEN")))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    // =========================================================================
    // Case F & G: Token B works once, rotates to Token C
    // =========================================================================
    @Test
    @DisplayName("Case F & G: Token B works once and rotates to Token C")
    void testCaseF_G_TokenBRotatesToTokenC() throws Exception {
        // Login to get Token A
        Map<String, Object> loginBody = Map.of(
                "email", userA.getEmail(),
                "password", userAPassword,
                "tenantId", tenantA.getId().toString()
        );
        MvcResult loginResult = mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBody)))
                .andExpect(status().isOk())
                .andReturn();
        String rawTokenA = extractCookieValue(loginResult.getResponse().getHeader("Set-Cookie"), "refreshToken");

        // Rotate Token A -> Token B
        MvcResult refresh1 = mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawTokenA)))
                .andExpect(status().isOk())
                .andReturn();
        String rawTokenB = extractCookieValue(refresh1.getResponse().getHeader("Set-Cookie"), "refreshToken");

        // Rotate Token B -> Token C
        MvcResult refresh2 = mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawTokenB)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andReturn();
        String rawTokenC = extractCookieValue(refresh2.getResponse().getHeader("Set-Cookie"), "refreshToken");
        assertNotNull(rawTokenC);
        assertNotEquals(rawTokenB, rawTokenC);

        // Expire 30s concurrent refresh grace window
        redisMockStorage.remove("refresh:grace:" + sha256(rawTokenB));

        // Token B cannot be reused
        mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawTokenB)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_REFRESH_TOKEN")));
    }

    // =========================================================================
    // Case H: Expired refresh token returns 401
    // =========================================================================
    @Test
    @DisplayName("Case H: Expired refresh token returns generic 401")
    void testCaseH_ExpiredRefreshTokenReturns401() throws Exception {
        String rawToken = "expired_token_value_sample_12345678901234567890";
        String tokenHash = sha256(rawToken);

        refreshTokenRepository.save(RefreshToken.builder()
                .user(userA)
                .tenantId(tenantA.getId())
                .token(tokenHash)
                .expiryDate(LocalDateTime.now().minusDays(1)) // Expired!
                .build());

        mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawToken)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_REFRESH_TOKEN")))
                .andExpect(jsonPath("$.error.message", is("Invalid or expired refresh token")));
    }

    // =========================================================================
    // Case I: Unknown refresh token returns 401
    // =========================================================================
    @Test
    @DisplayName("Case I: Unknown refresh token returns generic 401")
    void testCaseI_UnknownRefreshTokenReturns401() throws Exception {
        mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", "totally_unknown_unregistered_token_value_xyz")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_REFRESH_TOKEN")))
                .andExpect(jsonPath("$.error.message", is("Invalid or expired refresh token")));
    }

    // =========================================================================
    // Case J: Revoked refresh token returns 401
    // =========================================================================
    @Test
    @DisplayName("Case J: Revoked refresh token returns generic 401")
    void testCaseJ_RevokedRefreshTokenReturns401() throws Exception {
        String rawToken = "revoked_token_sample_12345678901234567890";
        String tokenHash = sha256(rawToken);

        RefreshToken rt = refreshTokenRepository.save(RefreshToken.builder()
                .user(userA)
                .tenantId(tenantA.getId())
                .token(tokenHash)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build());

        // Revoke token by deleting it
        refreshTokenRepository.delete(rt);

        mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawToken)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_REFRESH_TOKEN")));
    }

    // =========================================================================
    // Case K: Missing refresh cookie returns 401
    // =========================================================================
    @Test
    @DisplayName("Case K: Missing refresh cookie returns generic 401")
    void testCaseK_MissingRefreshCookieReturns401() throws Exception {
        mockMvc.perform(post("/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_REFRESH_TOKEN")));
    }

    // =========================================================================
    // Case L: Inactive user or suspended membership returns 401
    // =========================================================================
    @Test
    @DisplayName("Case L: Inactive user membership returns generic 401")
    void testCaseL_InactiveUserMembershipReturns401() throws Exception {
        String rawToken = "user_suspended_token_12345678901234567890";
        String tokenHash = sha256(rawToken);

        refreshTokenRepository.save(RefreshToken.builder()
                .user(userA)
                .tenantId(tenantA.getId())
                .token(tokenHash)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build());

        // Suspend membership
        membershipA.setStatus("SUSPENDED");
        membershipRepository.save(membershipA);

        mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawToken)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_REFRESH_TOKEN")));
    }

    // =========================================================================
    // Case M & N: Logout revokes refresh token; post-logout refresh returns 401
    // =========================================================================
    @Test
    @DisplayName("Case M & N: Logout revokes current refresh token; subsequent refresh returns 401")
    void testCaseM_N_LogoutRevocationAndSubsequentRefresh() throws Exception {
        // Login Alice
        Map<String, Object> loginBody = Map.of(
                "email", userA.getEmail(),
                "password", userAPassword,
                "tenantId", tenantA.getId().toString()
        );
        MvcResult loginResult = mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBody)))
                .andExpect(status().isOk())
                .andReturn();

        String rawTokenA = extractCookieValue(loginResult.getResponse().getHeader("Set-Cookie"), "refreshToken");
        String jwtA = objectMapper.readTree(loginResult.getResponse().getContentAsString()).path("data").path("accessToken").asText();

        // Logout Alice
        mockMvc.perform(post("/logout")
                        .header("Authorization", "Bearer " + jwtA)
                        .cookie(new Cookie("refreshToken", rawTokenA)))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        // Attempt refresh with Alice's token -> 401
        mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawTokenA)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_REFRESH_TOKEN")));
    }

    // =========================================================================
    // Case Q: Raw refresh token is not stored in DB or Redis
    // =========================================================================
    @Test
    @DisplayName("Case Q: Raw refresh token is NEVER stored in database or Redis")
    void testCaseQ_RawTokenNeverStoredInDbOrRedis() throws Exception {
        Map<String, Object> loginBody = Map.of(
                "email", userA.getEmail(),
                "password", userAPassword,
                "tenantId", tenantA.getId().toString()
        );
        MvcResult loginResult = mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBody)))
                .andExpect(status().isOk())
                .andReturn();

        String rawTokenA = extractCookieValue(loginResult.getResponse().getHeader("Set-Cookie"), "refreshToken");
        assertNotNull(rawTokenA);

        // Verify DB only contains hashes
        List<RefreshToken> allTokens = refreshTokenRepository.findAll();
        for (RefreshToken rt : allTokens) {
            assertNotEquals(rawTokenA, rt.getToken(), "Raw token must NEVER match database stored token");
            assertEquals(64, rt.getToken().length(), "Stored token must be a 64-char SHA-256 hash");
        }

        // Rotate
        mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawTokenA)))
                .andExpect(status().isOk());

        // Verify Redis never contains raw tokens
        for (Map.Entry<String, String> entry : redisMockStorage.entrySet()) {
            assertFalse(entry.getValue().contains(rawTokenA), "Redis must NEVER store raw refresh token");
        }
    }

    // =========================================================================
    // Case R & V: Replay attack invalidates the entire session family for that user
    // =========================================================================
    @Test
    @DisplayName("Case R & V: Replay attack on rotated token wipes user sessions and refresh tokens")
    void testCaseR_V_ReplayAttackWipesSessionFamily() throws Exception {
        // 1. Login Alice
        Map<String, Object> loginBody = Map.of(
                "email", userA.getEmail(),
                "password", userAPassword,
                "tenantId", tenantA.getId().toString()
        );
        MvcResult loginResult = mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBody)))
                .andExpect(status().isOk())
                .andReturn();
        String rawTokenA = extractCookieValue(loginResult.getResponse().getHeader("Set-Cookie"), "refreshToken");

        // 2. Rotate Token A -> Token B
        MvcResult refreshResult = mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawTokenA)))
                .andExpect(status().isOk())
                .andReturn();
        String rawTokenB = extractCookieValue(refreshResult.getResponse().getHeader("Set-Cookie"), "refreshToken");

        // 3. Expire 30s concurrent refresh grace window, then attacker replays Token A!
        redisMockStorage.remove("refresh:grace:" + sha256(rawTokenA));
        mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawTokenA)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code", is("INVALID_REFRESH_TOKEN")));

        // 4. Case V: Verify that the replay detection revoked all sessions and tokens for Alice
        List<Session> aliceSessions = sessionRepository.findAllByUserId(userA.getId());
        assertTrue(aliceSessions.isEmpty(), "Replay attack must invalidate all sessions for affected user");

        // 5. Even Token B should no longer work because the session family was invalidated
        mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawTokenB)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code", is("INVALID_REFRESH_TOKEN")));
    }
}
