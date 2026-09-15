package com.eventos.auth.security;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.eventos.auth.dto.AuditEvent;
import com.eventos.auth.dto.LoginRequestDto;
import com.eventos.auth.dto.RegisterRequestDto;
import com.eventos.auth.entity.*;
import com.eventos.auth.repository.*;
import com.eventos.auth.service.AuthService;
import com.eventos.auth.service.EmailService;
import com.eventos.auth.service.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class LoggingSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

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
    private CompanyRepository companyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @MockBean
    private EmailService emailService;

    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    @MockBean
    private ValueOperations<String, String> valueOperations;

    private ListAppender<ILoggingEvent> logAppender;
    private Logger rootLogger;
    private Logger authLogger;

    private final ByteArrayOutputStream stdoutCaptor = new ByteArrayOutputStream();
    private final ByteArrayOutputStream stderrCaptor = new ByteArrayOutputStream();
    private PrintStream originalStdout;
    private PrintStream originalStderr;

    private final Map<String, String> mockRedisStore = new ConcurrentHashMap<>();

    private User testUser;
    private Tenant testTenant;
    private Role ownerRole;
    private final String rawSecretPassword = "SuperSecretPassword123!#Special";

    @BeforeEach
    public void setup() {
        // Setup in-memory Redis mock
        mockRedisStore.clear();
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            String val = invocation.getArgument(1);
            mockRedisStore.put(key, val);
            return null;
        }).when(valueOperations).set(anyString(), anyString(), anyLong(), any(TimeUnit.class));

        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            String val = invocation.getArgument(1);
            mockRedisStore.put(key, val);
            return null;
        }).when(valueOperations).set(anyString(), anyString());

        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            return mockRedisStore.get(key);
        }).when(valueOperations).get(anyString());

        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            mockRedisStore.remove(key);
            return Boolean.TRUE;
        }).when(stringRedisTemplate).delete(anyString());

        // Setup Logback ListAppender
        logAppender = new ListAppender<>();
        logAppender.start();

        rootLogger = (Logger) LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
        authLogger = (Logger) LoggerFactory.getLogger("com.eventos");

        rootLogger.addAppender(logAppender);
        authLogger.addAppender(logAppender);

        // Capture stdout / stderr
        originalStdout = System.out;
        originalStderr = System.err;
        System.setOut(new PrintStream(stdoutCaptor));
        System.setErr(new PrintStream(stderrCaptor));

        // Create baseline user
        testTenant = tenantRepository.save(Tenant.builder()
                .name("Security Audit Workspace")
                .build());

        Company testCompany = companyRepository.save(Company.builder()
                .name("Security Audit Corp")
                .tenantId(testTenant.getId())
                .build());

        ownerRole = roleRepository.findByName("OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("OWNER").build()));

        roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ADMIN").build()));

        testUser = userRepository.save(User.builder()
                .email("audit-user-" + UUID.randomUUID() + "@eventos.security")
                .passwordHash(passwordEncoder.encode(rawSecretPassword))
                .firstName("Security")
                .lastName("Auditor")
                .status("ACTIVE")
                .build());
        testUser.setEmailVerified(true);
        testUser = userRepository.save(testUser);

        membershipRepository.save(Membership.builder()
                .user(testUser)
                .tenantId(testTenant.getId())
                .companyId(testCompany.getId())
                .role(ownerRole)
                .status("ACTIVE")
                .build());
    }

    @AfterEach
    public void tearDown() {
        if (rootLogger != null && logAppender != null) {
            rootLogger.detachAppender(logAppender);
        }
        if (authLogger != null && logAppender != null) {
            authLogger.detachAppender(logAppender);
        }
        System.setOut(originalStdout);
        System.setErr(originalStderr);
    }

    private String getCapturedLogs() {
        return logAppender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .collect(Collectors.joining("\n"));
    }

    private String getCapturedStdout() {
        return stdoutCaptor.toString(StandardCharsets.UTF_8);
    }

    private String getCapturedStderr() {
        return stderrCaptor.toString(StandardCharsets.UTF_8);
    }

    @Test
    @DisplayName("Phase 2H - Test 1: Successful login logs must NEVER contain password, raw access token, or raw refresh token")
    public void testLoginLogsDoNotContainPasswordOrTokens() throws Exception {
        LoginRequestDto loginRequest = LoginRequestDto.builder()
                .email(testUser.getEmail())
                .password(rawSecretPassword)
                .tenantId(testTenant.getId())
                .build();

        MvcResult result = mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(responseBody).path("data").path("accessToken").asText();
        jakarta.servlet.http.Cookie refreshCookie = result.getResponse().getCookie("refreshToken");
        assertNotNull(refreshCookie, "Refresh cookie must be present");
        String rawRefreshToken = refreshCookie.getValue();

        String logs = getCapturedLogs();
        String stdout = getCapturedStdout();
        String combined = logs + "\n" + stdout;

        assertFalse(combined.contains(rawSecretPassword), "Raw password must NEVER appear in logs or stdout");
        assertFalse(combined.contains(accessToken), "Raw JWT access token must NEVER appear in logs or stdout");
        assertFalse(combined.contains(rawRefreshToken), "Raw refresh token must NEVER appear in logs or stdout");
    }

    @Test
    @DisplayName("Phase 2H - Test 2: Failed login logs must NEVER contain candidate password")
    public void testFailedLoginLogsDoNotContainPassword() throws Exception {
        String badPassword = "AttackerGuessedPassword#999!";
        LoginRequestDto loginRequest = LoginRequestDto.builder()
                .email(testUser.getEmail())
                .password(badPassword)
                .tenantId(testTenant.getId())
                .build();

        mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());

        String logs = getCapturedLogs();
        String stdout = getCapturedStdout();
        String combined = logs + "\n" + stdout;

        assertFalse(combined.contains(badPassword), "Candidate password must NEVER appear in logs or stdout on failed login");
    }

    @Test
    @DisplayName("Phase 2H - Test 3: Token refresh logs must NEVER contain raw refresh tokens or new access tokens")
    public void testRefreshTokenLogsDoNotContainRawTokens() throws Exception {
        String rawRefreshToken = UUID.randomUUID().toString() + UUID.randomUUID().toString();
        String tokenHash = sha256(rawRefreshToken);

        refreshTokenRepository.save(RefreshToken.builder()
                .user(testUser)
                .token(tokenHash)
                .tenantId(testTenant.getId())
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build());

        MvcResult result = mockMvc.perform(post("/refresh")
                        .cookie(new Cookie("refreshToken", rawRefreshToken)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String newAccessToken = objectMapper.readTree(responseBody).path("data").path("accessToken").asText();
        Cookie newRefreshCookie = result.getResponse().getCookie("refreshToken");
        String newRawRefreshToken = newRefreshCookie != null ? newRefreshCookie.getValue() : "";

        String logs = getCapturedLogs();
        String stdout = getCapturedStdout();
        String combined = logs + "\n" + stdout;

        assertFalse(combined.contains(rawRefreshToken), "Original raw refresh token must NEVER appear in logs or stdout");
        if (!newRawRefreshToken.isEmpty()) {
            assertFalse(combined.contains(newRawRefreshToken), "Rotated raw refresh token must NEVER appear in logs or stdout");
        }
        assertFalse(combined.contains(newAccessToken), "New access token must NEVER appear in logs or stdout");
    }

    @Test
    @DisplayName("Phase 2H - Test 4: Magic-link generation logs must NEVER contain raw magic token or direct link")
    public void testMagicLinkLogsDoNotContainMagicToken() throws Exception {
        Map<String, String> request = Map.of("email", testUser.getEmail());

        MvcResult result = mockMvc.perform(post("/magic-link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertFalse(responseBody.contains("magicToken"), "Response body must NEVER contain magicToken (SEC-2N-A)");
        assertFalse(responseBody.contains("magicLinkUrl"), "Response body must NEVER contain magicLinkUrl (SEC-2N-A)");

        String logs = getCapturedLogs();
        String stdout = getCapturedStdout();
        String combined = logs + "\n" + stdout;

        assertFalse(combined.contains("magicToken="), "Full magic link URL with token must NEVER appear in logs or stdout");
    }

    @Test
    @DisplayName("Phase 2H - Test 5: WhatsApp OTP generation logs must NEVER contain 6-digit OTP code")
    public void testWhatsAppOtpLogsDoNotContainOtpCode() throws Exception {
        String testPhone = "+15551234567";
        Map<String, String> request = Map.of("phone", testPhone);

        mockMvc.perform(post("/send-whatsapp-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        String cachedOtp = mockRedisStore.get("WA_OTP:" + testPhone);
        assertNotNull(cachedOtp, "OTP must have been saved into Redis mock");

        String logs = getCapturedLogs();
        String stdout = getCapturedStdout();
        String combined = logs + "\n" + stdout;

        assertFalse(combined.contains(cachedOtp), "Generated 6-digit OTP must NEVER appear in logs or stdout");
    }

    @Test
    @DisplayName("Phase 2H - Test 6: Registration logs must NEVER contain password or raw email verification token")
    public void testRegistrationLogsDoNotContainSensitiveData() throws Exception {
        String rawPassword = "UniquePassword2026#Secure!";
        RegisterRequestDto registerDto = RegisterRequestDto.builder()
                .email("audit-new-" + UUID.randomUUID() + "@eventos.security")
                .password(rawPassword)
                .firstName("New")
                .lastName("Auditor")
                .companyName("Audit Corp")
                .build();

        MvcResult result = mockMvc.perform(post("/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerDto)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String verificationToken = objectMapper.readTree(responseBody).path("verificationToken").asText();

        String logs = getCapturedLogs();
        String stdout = getCapturedStdout();
        String combined = logs + "\n" + stdout;

        assertFalse(combined.contains(rawPassword), "Registration password must NEVER appear in logs or stdout");
        if (!verificationToken.isEmpty()) {
            assertFalse(combined.contains("VERIFICATION TOKEN: " + verificationToken), 
                    "System.out.println VERIFICATION TOKEN must be completely eradicated");
        }
    }

    @Test
    @DisplayName("Phase 2H - Test 7: Team member invitation logs must NEVER print invitation token to stdout/logs")
    public void testInvitationLogsDoNotContainInvitationToken() {
        Map<String, Object> inviteResult = authService.inviteTeamMember(
                testTenant.getId(),
                "invited-audit-" + UUID.randomUUID() + "@eventos.security",
                "Invited",
                "Person",
                "ADMIN",
                null,
                testUser.getId());

        assertNotNull(inviteResult);
        assertNull(inviteResult.get("inviteToken"), "Invitation raw token must NEVER be returned in response payload (SEC-2N-B)");

        String logs = getCapturedLogs();
        String stdout = getCapturedStdout();
        String combined = logs + "\n" + stdout;

        assertFalse(combined.contains("INVITATION TOKEN:"), "Invitation token banner must NEVER be printed to stdout");
    }

    @Test
    @DisplayName("Phase 2H - Test 8: Authorization header and Cookie header values are never logged")
    public void testAuthorizationAndCookieHeadersNeverLogged() throws Exception {
        String dummyBearerToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.dummyPayloadForLoggingAuditTest.dummySig";
        String dummyCookieToken = "secretRefreshTokenValue123456789";

        mockMvc.perform(post("/refresh")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + dummyBearerToken)
                        .cookie(new Cookie("refreshToken", dummyCookieToken)))
                .andExpect(status().isUnauthorized()); // dummy token fails closed safely

        String logs = getCapturedLogs();
        String stdout = getCapturedStdout();
        String combined = logs + "\n" + stdout;

        assertFalse(combined.contains("Bearer " + dummyBearerToken), "Authorization Bearer token header must NEVER be logged");
        assertFalse(combined.contains(dummyCookieToken), "Cookie secret value must NEVER be logged");
    }

    @Test
    @DisplayName("Phase 2H - Test 9: Audit events retain safe metadata but contain ZERO raw secrets/tokens")
    public void testAuditEventsPreserveSafeMetadataWithoutSecrets() throws Exception {
        LoginRequestDto loginRequest = LoginRequestDto.builder()
                .email(testUser.getEmail())
                .password(rawSecretPassword)
                .tenantId(testTenant.getId())
                .build();

        mockMvc.perform(post("/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());

        ArgumentCaptor<AuditEvent> eventCaptor = ArgumentCaptor.forClass(AuditEvent.class);
        verify(rabbitTemplate, atLeastOnce()).convertAndSend(anyString(), anyString(), eventCaptor.capture());

        List<AuditEvent> capturedEvents = eventCaptor.getAllValues();
        assertFalse(capturedEvents.isEmpty(), "Audit events must be recorded");

        for (AuditEvent event : capturedEvents) {
            assertNotNull(event.getAction(), "Audit event must have an action");
            String details = event.getDetails();
            if (details != null) {
                assertFalse(details.contains(rawSecretPassword), "Audit event details must NEVER contain passwords");
                assertFalse(details.contains("eyJ"), "Audit event details must NEVER contain raw JWTs");
            }
        }
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
