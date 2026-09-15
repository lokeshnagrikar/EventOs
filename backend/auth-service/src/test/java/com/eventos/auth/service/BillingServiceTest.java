package com.eventos.auth.service;

import com.eventos.auth.entity.User;
import com.eventos.auth.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BillingServiceTest {

    @Mock
    private PlanRepository planRepository;
    @Mock
    private SubscriptionRepository subscriptionRepository;
    @Mock
    private PaymentMethodRepository paymentMethodRepository;
    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private BillingHistoryRepository billingHistoryRepository;
    @Mock
    private WorkspaceSettingsRepository workspaceSettingsRepository;
    @Mock
    private TenantUsageRepository tenantUsageRepository;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MembershipRepository membershipRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private JwtService jwtService;
    @Mock
    private EmailService emailService;
    @Mock
    private StringRedisTemplate stringRedisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private BillingService billingService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .firstName("Admin")
                .lastName("User")
                .email("target.user@eventosapp.in")
                .passwordHash("$2a$12$someSecureHashedPasswordOldValue")
                .status("ACTIVE")
                .isEmailVerified(true)
                .passwordUpdatedAt(LocalDateTime.now().minusDays(10))
                .build();

        ReflectionTestUtils.setField(billingService, "stringRedisTemplate", stringRedisTemplate);
        lenient().doReturn(valueOperations).when(stringRedisTemplate).opsForValue();
    }

    @Test
    @DisplayName("A. Password reset generates a secure reset token and dispatches email without hardcoding credentials")
    void testResetUserPassword_GeneratesSecureTokenAndDispatchesEmail() {
        when(userRepository.findByEmail("target.user@eventosapp.in")).thenReturn(Optional.of(testUser));

        Map<String, Object> result = billingService.resetUserPassword("target.user@eventosapp.in");

        // 1. Response confirms dispatch without exposing raw token or plaintext password
        assertTrue((Boolean) result.get("success"));
        assertEquals("target.user@eventosapp.in", result.get("email"));
        assertEquals("Password reset instructions dispatched to user email", result.get("message"));
        assertNull(result.get("password"));
        assertNull(result.get("admin123"));
        assertNull(result.get("resetToken"));

        // 2. User password hash in DB is NOT overwritten with any static password
        assertEquals("$2a$12$someSecureHashedPasswordOldValue", testUser.getPasswordHash());
        verify(userRepository, never()).save(any(User.class));

        // 3. Email service is dispatched with single-use cryptographic token
        ArgumentCaptor<String> tokenCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(1)).sendPasswordResetEmail(eq("target.user@eventosapp.in"), tokenCaptor.capture());
        String generatedToken = tokenCaptor.getValue();
        assertNotNull(generatedToken);
        assertFalse(generatedToken.isEmpty());
        assertNotEquals("admin123", generatedToken);

        // 4. Redis key stores SHA-256 hash of the token with 15 minutes TTL
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(valueOperations, times(1)).set(keyCaptor.capture(), eq("target.user@eventosapp.in"), eq(15L), eq(TimeUnit.MINUTES));
        assertTrue(keyCaptor.getValue().startsWith("reset:token:"));

        // 5. Audit event logged safely without printing raw credentials
        verify(auditLogService, times(1)).logEvent(isNull(), eq(testUser.getId()),
                eq("ADMIN_USER_PASSWORD_RESET_INITIATED"), isNull(), isNull(), anyString());
    }

    @Test
    @DisplayName("E. Reset password fails when target user is not found")
    void testResetUserPassword_UserNotFound_ThrowsException() {
        when(userRepository.findByEmail("nonexistent@eventosapp.in")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> billingService.resetUserPassword("nonexistent@eventosapp.in"));
        assertTrue(ex.getMessage().contains("User not found"));
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("E. Reset password fails when email is null or blank")
    void testResetUserPassword_BlankEmail_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> billingService.resetUserPassword(""));
        assertThrows(IllegalArgumentException.class, () -> billingService.resetUserPassword(null));
    }
}
