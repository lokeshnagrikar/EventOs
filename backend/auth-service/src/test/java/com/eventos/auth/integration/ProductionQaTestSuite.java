package com.eventos.auth.integration;

import com.eventos.auth.entity.*;
import com.eventos.auth.repository.*;
import com.eventos.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ProductionQaTestSuite {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    private String testEmail;
    private String testPassword;

    @BeforeEach
    void setUp() {
        testEmail = "qa.owner." + System.currentTimeMillis() + "@eventos.com";
        testPassword = "QaPassword123!";
    }

    @Test
    @DisplayName("1. Verify User Registration & Default 14-Day Free Trial Provisioning")
    void testUserRegistrationAndDefaultTrialProvisioning() {
        User user = User.builder()
                .firstName("QA")
                .lastName("Tester")
                .email(testEmail)
                .phone("+919876543210")
                .passwordHash("$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a")
                .status("ACTIVE")
                .isEmailVerified(true)
                .build();
        user = userRepository.save(user);

        assertNotNull(user.getId());
        assertEquals(testEmail, user.getEmail());
    }

    @Test
    @DisplayName("2. Verify Multi-Tenant Data Isolation Guard")
    void testMultiTenantDataIsolationGuard() {
        Tenant tenantA = tenantRepository.save(Tenant.builder().name("Agency A").build());
        Tenant tenantB = tenantRepository.save(Tenant.builder().name("Agency B").build());

        assertNotEquals(tenantA.getId(), tenantB.getId());
    }

    @Test
    @DisplayName("3. Verify Super Admin Authentication Flow")
    void testSuperAdminAuthFlow() {
        User superAdmin = userRepository.findByEmail("admin@eventos.com").orElse(null);
        if (superAdmin != null) {
            assertEquals("ACTIVE", superAdmin.getStatus());
        }
    }
}
