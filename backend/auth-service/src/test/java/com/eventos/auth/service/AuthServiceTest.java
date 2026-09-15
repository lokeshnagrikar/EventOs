package com.eventos.auth.service;

import com.eventos.auth.dto.RegisterRequestDto;
import com.eventos.auth.entity.*;
import com.eventos.auth.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private MembershipRepository membershipRepository;
    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private InvitationRepository invitationRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private StringRedisTemplate stringRedisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private RecaptchaService recaptchaService;
    @Mock
    private GoogleAuthService googleAuthService;
    @Mock
    private PasswordHistoryRepository passwordHistoryRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private BillingService billingService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private UUID tenantId;
    private UUID companyId;
    private Role ownerRole;
    private Membership membership;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        companyId = UUID.randomUUID();

        testUser = User.builder()
                .id(UUID.randomUUID())
                .firstName("Lokesh")
                .lastName("Nagrikar")
                .email("lokesh@myevents.com")
                .passwordHash("hashedPassword")
                .status("ACTIVE")
                .isEmailVerified(true)
                .build();

        ownerRole = Role.builder()
                .id(UUID.randomUUID())
                .name("OWNER")
                .build();

        membership = Membership.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .tenantId(tenantId)
                .companyId(companyId)
                .role(ownerRole)
                .status("ACTIVE")
                .build();

        lenient().doReturn(valueOperations).when(stringRedisTemplate).opsForValue();
    }

    @Test
    void testRegister_Success() {
        RegisterRequestDto request = RegisterRequestDto.builder()
                .email("new@test.com")
                .firstName("First")
                .lastName("Last")
                .companyName("Test Company")
                .password("password")
                .phone("1234567890")
                .build();

        Tenant mockTenant = Tenant.builder().id(tenantId).name("Test Company").build();
        Company mockCompany = Company.builder().id(companyId).tenantId(tenantId).name("Test Company").build();
        User mockUser = User.builder().id(UUID.randomUUID()).email("new@test.com").build();

        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(tenantRepository.save(any(Tenant.class))).thenReturn(mockTenant);
        when(companyRepository.save(any(Company.class))).thenReturn(mockCompany);
        when(roleRepository.findByName("OWNER")).thenReturn(Optional.of(ownerRole));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        when(passwordEncoder.encode("password")).thenReturn("hashedPassword");

        Map<String, Object> response = authService.register(request);

        assertTrue((Boolean) response.get("success"));
        verify(auditLogService, times(1)).logEvent(eq(tenantId), any(UUID.class), eq("TENANT_REGISTRATION"), any(),
                any(), anyString());
    }

    @Test
    void testLogin_Success() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password", testUser.getPasswordHash())).thenReturn(true);
        when(membershipRepository.findAllByUserId(testUser.getId())).thenReturn(List.of(membership));

        Tenant tenant = Tenant.builder().id(tenantId).subscriptionPlan("STARTER").build();
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(sessionRepository.findAllByUserIdAndTenantId(testUser.getId(), tenantId))
                .thenReturn(Collections.emptyList());

        when(jwtService.generateToken(any(), any(), anyString(), any(), anyString(), any(), anyString(), anyString()))
                .thenReturn("mockedAccessToken");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArguments()[0]);

        Map<String, Object> response = authService.login(testUser.getEmail(), "password", tenantId, "127.0.0.1",
                "Chrome", "Windows", "Chrome", "UserAgent");

        assertNotNull(response.get("accessToken"));
        assertNotNull(response.get("refreshToken"));
        verify(auditLogService, times(1)).logEvent(eq(tenantId), eq(testUser.getId()), eq("LOGIN_SUCCESS"),
                eq("127.0.0.1"), eq("UserAgent"), anyString());
    }

    @Test
    void testLogin_Failure_InvalidPassword() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpassword", testUser.getPasswordHash())).thenReturn(false);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        assertThrows(IllegalArgumentException.class, () -> authService.login(testUser.getEmail(), "wrongpassword",
                tenantId, "127.0.0.1", "Chrome", "Windows", "Chrome", "UserAgent"));

        verify(auditLogService, times(1)).logEvent(isNull(), eq(testUser.getId()), eq("LOGIN_FAILURE"), eq("127.0.0.1"),
                eq("UserAgent"), anyString());
    }

    @Test
    void testRefresh_ReplayAttackDetection() {
        String token = "replayToken";
        String tokenHash = "83d4ede76f49c418d79be0c5dcf2f1103a2de01c92ab318645d3797891f5094a";

        when(refreshTokenRepository.findByToken(anyString())).thenReturn(Optional.empty()); // No active token found
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("refresh:grace:" + tokenHash)).thenReturn(null);
        when(valueOperations.get("rotated:token:" + tokenHash)).thenReturn(testUser.getId().toString()); // Compromised
                                                                                                         // user ID
                                                                                                         // found in
                                                                                                         // Redis

        assertThrows(SecurityException.class,
                () -> authService.refresh(token, "127.0.0.1", "Chrome", "Windows", "Chrome", "UserAgent"));

        verify(sessionRepository, times(1)).deleteAllByUserId(testUser.getId());
        verify(refreshTokenRepository, times(1)).deleteByUser(any(User.class));
        verify(auditLogService, times(1)).logEvent(isNull(), eq(testUser.getId()), eq("REPLAY_ATTACK_COMPROMISE"),
                eq("127.0.0.1"), eq("UserAgent"), anyString());
    }

    @Test
    void testResetPassword_Success() {
        String token = "resetToken";
        String tokenHash = "82e3327765dc1eacf8d54fdc4859fdba8eeb76a22f6037b31611cca837cbaeee";
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("reset:token:" + tokenHash)).thenReturn(testUser.getEmail());
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(eq("newPassword"), any())).thenReturn(false);
        when(passwordEncoder.encode("newPassword")).thenReturn("newHashedPassword");

        authService.resetPassword(token, "newPassword");

        verify(userRepository, times(1)).save(testUser);
        verify(sessionRepository, times(1)).deleteAllByUserId(testUser.getId());
        verify(refreshTokenRepository, times(1)).deleteByUser(testUser);
        verify(auditLogService, times(1)).logEvent(isNull(), eq(testUser.getId()), eq("PASSWORD_RESET_SUCCESS"),
                isNull(), isNull(), anyString());
    }

    @Test
    void testLogin_Failure_UnverifiedEmail() {
        testUser.setEmailVerified(false);
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password", testUser.getPasswordHash())).thenReturn(true);
        when(membershipRepository.findAllByUserId(testUser.getId())).thenReturn(List.of(membership));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.login(testUser.getEmail(), "password", tenantId, "127.0.0.1",
                        "Chrome", "Windows", "Chrome", "UserAgent"));
        assertEquals("EMAIL_UNVERIFIED", exception.getMessage());
    }

    @Test
    void testResendVerification_Success() {
        testUser.setEmailVerified(false);
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        Map<String, Object> response = authService.resendVerification(testUser.getEmail());

        assertTrue((Boolean) response.get("success"));
        assertEquals("If the account exists and is unverified, a verification email has been sent.", response.get("message"));
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    void testVerifyOtp_Success() {
        testUser.setEmailVerified(false);
        testUser.setEmailVerificationToken("123456");
        testUser.setEmailVerificationTokenExpiry(LocalDateTime.now().plusMinutes(15));
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        Map<String, Object> response = authService.verifyOtp(testUser.getEmail(), "123456");

        assertTrue((Boolean) response.get("success"));
        assertEquals("Email verification successful", response.get("message"));
        assertTrue(testUser.isEmailVerified());
        assertNull(testUser.getEmailVerificationToken());
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    void testVerifyOtp_Failure_InvalidOtp() {
        testUser.setEmailVerified(false);
        testUser.setEmailVerificationToken("123456");
        testUser.setEmailVerificationTokenExpiry(LocalDateTime.now().plusMinutes(15));
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.verifyOtp(testUser.getEmail(), "654321"));
        assertEquals("Invalid verification code", exception.getMessage());
    }

    @Test
    void testVerifyOtp_Failure_ExpiredOtp() {
        testUser.setEmailVerified(false);
        testUser.setEmailVerificationToken("123456");
        testUser.setEmailVerificationTokenExpiry(LocalDateTime.now().minusMinutes(1));
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.verifyOtp(testUser.getEmail(), "123456"));
        assertEquals("Verification code has expired", exception.getMessage());
    }

    @Test
    void testBackdoorRemoved_EventosCom_NonExistent_ThrowsExceptionAndNeverProvisions() {
        String backdoorEmail = "admin@eventos.com";
        when(userRepository.findByEmail(backdoorEmail)).thenReturn(Optional.empty());
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.login(backdoorEmail, "admin123", null, "127.0.0.1",
                        "Chrome", "Windows", "Chrome", "UserAgent"));

        assertEquals("Invalid email or password", exception.getMessage());
        // Verify that NO auto-provisioning occurs
        verify(userRepository, never()).save(any(User.class));
        verify(roleRepository, never()).save(any(Role.class));
        verify(membershipRepository, never()).save(any(Membership.class));
    }

    @Test
    void testBackdoorRemoved_EventosCo_NonExistent_ThrowsExceptionAndNeverProvisions() {
        String backdoorEmail = "operations@eventos.co";
        when(userRepository.findByEmail(backdoorEmail)).thenReturn(Optional.empty());
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.login(backdoorEmail, "admin123", null, "127.0.0.1",
                        "Chrome", "Windows", "Chrome", "UserAgent"));

        assertEquals("Invalid email or password", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
        verify(roleRepository, never()).save(any(Role.class));
        verify(membershipRepository, never()).save(any(Membership.class));
    }

    @Test
    void testBackdoorRemoved_NoMemberships_FailsWithoutAutoSuperAdmin() {
        User existingUser = User.builder()
                .id(UUID.randomUUID())
                .email("admin@eventos.com")
                .passwordHash("hashedPass")
                .status("ACTIVE")
                .isEmailVerified(true)
                .build();

        when(userRepository.findByEmail("admin@eventos.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("somepassword", "hashedPass")).thenReturn(true);
        when(membershipRepository.findAllByUserId(existingUser.getId())).thenReturn(Collections.emptyList());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.login("admin@eventos.com", "somepassword", null, "127.0.0.1",
                        "Chrome", "Windows", "Chrome", "UserAgent"));

        assertEquals("User does not belong to any tenant workspace", exception.getMessage());
        verify(roleRepository, never()).findByName("SUPER_ADMIN");
        verify(membershipRepository, never()).save(any(Membership.class));
    }

    @Test
    void testLogin_LegitimateSuperAdmin_Success() {
        Role superAdminRole = Role.builder()
                .id(UUID.randomUUID())
                .name("SUPER_ADMIN")
                .permissionsJson("[\"all\"]")
                .build();

        Membership superAdminMembership = Membership.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .tenantId(tenantId)
                .companyId(companyId)
                .role(superAdminRole)
                .status("ACTIVE")
                .build();

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("ValidAdminPass!123", testUser.getPasswordHash())).thenReturn(true);
        when(membershipRepository.findAllByUserId(testUser.getId())).thenReturn(List.of(superAdminMembership));

        Tenant tenant = Tenant.builder().id(tenantId).subscriptionPlan("ENTERPRISE").build();
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(sessionRepository.findAllByUserIdAndTenantId(testUser.getId(), tenantId)).thenReturn(Collections.emptyList());
        when(jwtService.generateToken(any(), any(), eq("SUPER_ADMIN"), any(), anyString(), any(), anyString(), anyString()))
                .thenReturn("mockedSuperAdminToken");
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArguments()[0]);

        Map<String, Object> response = authService.login(testUser.getEmail(), "ValidAdminPass!123", tenantId,
                "127.0.0.1", "Chrome", "Windows", "Chrome", "UserAgent");

        assertNotNull(response.get("accessToken"));
        assertEquals("SUPER_ADMIN", response.get("role"));
        verify(auditLogService, times(1)).logEvent(eq(tenantId), eq(testUser.getId()), eq("LOGIN_SUCCESS"),
                eq("127.0.0.1"), eq("UserAgent"), anyString());
    }

    @Test
    void testLogin_InactiveUser_ThrowsGenericInvalidCredentials() {
        testUser.setStatus("INACTIVE");
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.login(testUser.getEmail(), "anyPassword", tenantId,
                        "127.0.0.1", "Chrome", "Windows", "Chrome", "UserAgent"));

        assertEquals("Invalid email or password", exception.getMessage());
        // Verify internal audit records account inactivity for investigation
        verify(auditLogService, times(1)).logEvent(isNull(), eq(testUser.getId()), eq("LOGIN_FAILURE"),
                eq("127.0.0.1"), eq("UserAgent"), contains("Account inactive"));
    }

    @Test
    void testForgotPassword_ExistingEmail_ReturnsGenericResponseAndDispatchesEmail() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        Map<String, Object> response = authService.forgotPassword(testUser.getEmail());

        assertTrue((Boolean) response.get("success"));
        assertEquals("If the email address is registered, password reset instructions will be sent.",
                response.get("message"));
        verify(emailService, times(1)).sendPasswordResetEmail(eq(testUser.getEmail()), anyString());
    }

    @Test
    void testForgotPassword_NonExistingEmail_ReturnsIdenticalGenericResponseWithoutDispatching() {
        when(userRepository.findByEmail("unregistered@unknown-domain.com")).thenReturn(Optional.empty());

        Map<String, Object> response = authService.forgotPassword("unregistered@unknown-domain.com");

        assertTrue((Boolean) response.get("success"));
        // EXACT same response as existing user to prevent account enumeration
        assertEquals("If the email address is registered, password reset instructions will be sent.",
                response.get("message"));
        // Email is never sent to unregistered address
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
        // Internal audit event is logged for security monitoring
        verify(auditLogService, times(1)).logEvent(isNull(), isNull(),
                eq("PASSWORD_RESET_REQUEST_UNREGISTERED"), isNull(), isNull(), anyString());
    }
}


