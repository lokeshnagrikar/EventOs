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

        when(jwtService.generateToken(any(), any(), anyString())).thenReturn("mockedAccessToken");
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
        when(passwordEncoder.encode("newPassword")).thenReturn("newHashedPassword");

        authService.resetPassword(token, "newPassword");

        verify(userRepository, times(1)).save(testUser);
        verify(sessionRepository, times(1)).deleteAllByUserId(testUser.getId());
        verify(refreshTokenRepository, times(1)).deleteByUser(testUser);
        verify(auditLogService, times(1)).logEvent(isNull(), eq(testUser.getId()), eq("PASSWORD_RESET_SUCCESS"),
                isNull(), isNull(), anyString());
    }
}
