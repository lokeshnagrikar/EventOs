package com.eventos.auth.security;

import com.eventos.auth.entity.Membership;
import com.eventos.auth.entity.Role;
import com.eventos.auth.entity.User;
import com.eventos.auth.repository.*;
import com.eventos.auth.service.AuditLogService;
import com.eventos.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Phase 2R-FIX-01 — Administrative Account & Bootstrap Security Verification")
class AdminBootstrapSecurityTest {

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
    private PasswordHistoryRepository passwordHistoryRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private StringRedisTemplate stringRedisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuthService authService;

    private PasswordEncoder passwordEncoder;

    private static final String TEST_BOOTSTRAP_SECRET = "production_superadmin_bootstrap_secret_32bytes_min!";
    private static final String KNOWN_ADMIN123_HASH = "$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O";

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(12);
        ReflectionTestUtils.setField(authService, "passwordEncoder", passwordEncoder);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("1. Seeded admin in PENDING_SETUP state fails authentication with admin123")
    void seeded_admin_pending_setup_fails_login() {
        User seededAdmin = User.builder()
                .id(UUID.randomUUID())
                .email("admin@eventosapp.in")
                .passwordHash("!LOCKED_PENDING_BOOTSTRAP_123456789")
                .status("PENDING_SETUP")
                .isEmailVerified(true)
                .build();

        when(userRepository.findByEmail("admin@eventosapp.in")).thenReturn(Optional.of(seededAdmin));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            authService.login("admin@eventosapp.in", "admin123", null, "127.0.0.1", "device", "os", "browser", "ua");
        });

        assertEquals("Invalid email or password", ex.getMessage());
    }

    @Test
    @DisplayName("2. Even if an account had the historical admin123 bcrypt hash, PENDING_SETUP blocks authentication")
    void account_with_admin123_hash_blocked_in_pending_setup() {
        User seededAdmin = User.builder()
                .id(UUID.randomUUID())
                .email("operations@eventosapp.in")
                .passwordHash(KNOWN_ADMIN123_HASH)
                .status("PENDING_SETUP")
                .isEmailVerified(true)
                .build();

        when(userRepository.findByEmail("operations@eventosapp.in")).thenReturn(Optional.of(seededAdmin));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            authService.login("operations@eventosapp.in", "admin123", null, "127.0.0.1", "device", "os", "browser", "ua");
        });

        assertEquals("Invalid email or password", ex.getMessage());
    }

    @Test
    @DisplayName("3. Bootstrap SuperAdmin fails if BOOTSTRAP_SECRET is missing or too short in environment")
    void bootstrap_fails_closed_when_env_secret_missing() {
        SecurityException ex = assertThrows(SecurityException.class, () -> {
            authService.bootstrapSuperAdmin("admin@eventosapp.in", "SecureP@ssw0rd2026!", TEST_BOOTSTRAP_SECRET, "127.0.0.1", "ua");
        });
        assertTrue(ex.getMessage().contains("BOOTSTRAP_SECRET is missing") || ex.getMessage().contains("not enabled"));
    }

    @Test
    @DisplayName("4. Bootstrap fails when invalid bootstrap secret is presented")
    void bootstrap_fails_with_invalid_secret() {
        ReflectionTestUtils.setField(authService, "configuredBootstrapSecret", TEST_BOOTSTRAP_SECRET);
        assertThrows(SecurityException.class, () -> {
            authService.bootstrapSuperAdmin("admin@eventosapp.in", "SecureP@ssw0rd2026!", "wrong-secret", "127.0.0.1", "ua");
        });
    }

    @Test
    @DisplayName("5. Non-admin tenant users cannot be bootstrapped via SuperAdmin bootstrap")
    void ordinary_tenant_user_cannot_be_bootstrapped() {
        ReflectionTestUtils.setField(authService, "configuredBootstrapSecret", TEST_BOOTSTRAP_SECRET);

        User tenantUser = User.builder()
                .id(UUID.randomUUID())
                .email("client@tenant.com")
                .passwordHash("!LOCKED_PENDING_BOOTSTRAP_abc")
                .status("PENDING_SETUP")
                .build();

        Role staffRole = Role.builder().name("STAFF").build();
        Membership membership = Membership.builder().user(tenantUser).role(staffRole).status("ACTIVE").build();

        when(userRepository.findByEmail("client@tenant.com")).thenReturn(Optional.of(tenantUser));
        when(membershipRepository.findAllByUserId(tenantUser.getId())).thenReturn(List.of(membership));

        // Attempting bootstrap will fail because target is not an admin
        assertThrows(SecurityException.class, () -> {
            authService.bootstrapSuperAdmin("client@tenant.com", "NewPassword123!", TEST_BOOTSTRAP_SECRET, "127.0.0.1", "ua");
        });
    }

    @Test
    @DisplayName("6. Successful bootstrap activates account, stores BCrypt hash, and revokes sessions")
    void bootstrap_superadmin_success() {
        ReflectionTestUtils.setField(authService, "configuredBootstrapSecret", TEST_BOOTSTRAP_SECRET);

        User superAdmin = User.builder()
                .id(UUID.randomUUID())
                .email("admin@eventosapp.in")
                .passwordHash("!LOCKED_PENDING_BOOTSTRAP_123")
                .status("PENDING_SETUP")
                .build();

        Role adminRole = Role.builder().name("SUPER_ADMIN").build();
        Membership membership = Membership.builder().user(superAdmin).role(adminRole).status("ACTIVE").build();

        when(userRepository.findByEmail("admin@eventosapp.in")).thenReturn(Optional.of(superAdmin));
        when(membershipRepository.findAllByUserId(superAdmin.getId())).thenReturn(List.of(membership));

        Map<String, Object> result = authService.bootstrapSuperAdmin(
                "admin@eventosapp.in",
                "NewSecurePassword2026!",
                TEST_BOOTSTRAP_SECRET,
                "127.0.0.1",
                "ua");

        assertTrue((Boolean) result.get("success"));
        assertEquals("ACTIVE", superAdmin.getStatus());
        assertTrue(passwordEncoder.matches("NewSecurePassword2026!", superAdmin.getPasswordHash()));

        // Verify session and refresh tokens revoked
        verify(sessionRepository).deleteAllByUserId(superAdmin.getId());
        verify(refreshTokenRepository).deleteByUser(superAdmin);
    }

    @Test
    @DisplayName("7. Bootstrap SuperAdmin is single-use: cannot overwrite an already active superadmin")
    void bootstrap_single_use_guard() {
        ReflectionTestUtils.setField(authService, "configuredBootstrapSecret", TEST_BOOTSTRAP_SECRET);

        User activeAdmin = User.builder()
                .id(UUID.randomUUID())
                .email("admin@eventosapp.in")
                .passwordHash(passwordEncoder.encode("ExistingPassword123!"))
                .status("ACTIVE")
                .build();

        Role adminRole = Role.builder().name("SUPER_ADMIN").build();
        Membership membership = Membership.builder().user(activeAdmin).role(adminRole).status("ACTIVE").build();

        when(userRepository.findByEmail("admin@eventosapp.in")).thenReturn(Optional.of(activeAdmin));
        when(membershipRepository.findAllByUserId(activeAdmin.getId())).thenReturn(List.of(membership));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            authService.bootstrapSuperAdmin(
                    "admin@eventosapp.in",
                    "NewPasswordOverwritingAdmin!",
                    TEST_BOOTSTRAP_SECRET,
                    "127.0.0.1",
                    "ua");
        });
        assertTrue(ex.getMessage().contains("already been bootstrapped"));
    }

    @Test
    @DisplayName("8. Password reset activates PENDING_SETUP user and revokes active sessions")
    void password_reset_activates_pending_setup_user() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("admin@eventosapp.in")
                .passwordHash("!LOCKED_PENDING_BOOTSTRAP_123")
                .status("PENDING_SETUP")
                .passwordUpdatedAt(LocalDateTime.now().minusDays(10))
                .build();

        when(userRepository.findByEmail("admin@eventosapp.in")).thenReturn(Optional.of(user));

        // Inject token into local token store via reflection
        @SuppressWarnings("unchecked")
        Map<String, String> localStore = (Map<String, String>) ReflectionTestUtils.getField(authService, "localTokenStore");
        @SuppressWarnings("unchecked")
        Map<String, Long> expiryStore = (Map<String, Long>) ReflectionTestUtils.getField(authService, "localTokenExpiry");

        String rawToken = "valid-reset-token-xyz123";
        String tokenHash = (String) ReflectionTestUtils.invokeMethod(authService, "sha256", rawToken);
        String redisKey = "reset:token:" + tokenHash;
        localStore.put(redisKey, "admin@eventosapp.in");
        expiryStore.put(redisKey, System.currentTimeMillis() + 600000);

        Map<String, Object> result = authService.resetPassword(rawToken, "NewSecurePassword2026!");

        assertTrue((Boolean) result.get("success"));
        assertEquals("ACTIVE", user.getStatus(), "User must transition from PENDING_SETUP to ACTIVE on password reset");
        assertTrue(passwordEncoder.matches("NewSecurePassword2026!", user.getPasswordHash()));

        // Sessions must be revoked
        verify(sessionRepository).deleteAllByUserId(user.getId());
        verify(refreshTokenRepository).deleteByUser(user);
    }
}
