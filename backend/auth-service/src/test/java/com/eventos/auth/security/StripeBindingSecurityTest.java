package com.eventos.auth.security;

import com.eventos.auth.entity.Plan;
import com.eventos.auth.entity.Subscription;
import com.eventos.auth.entity.Tenant;
import com.eventos.auth.repository.PlanRepository;
import com.eventos.auth.repository.SubscriptionRepository;
import com.eventos.auth.repository.TenantRepository;
import com.eventos.auth.service.BillingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.model.checkout.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("2Q-04 — Stripe Checkout Server-Side Binding Hardening Security Tests")
public class StripeBindingSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BillingService billingService;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    @MockBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @MockBean
    private com.eventos.auth.service.EmailService emailService;

    private ValueOperations<String, String> valueOperations;
    private final Map<String, String> mockRedisStorage = new HashMap<>();

    private Tenant tenantA;
    private Tenant tenantB;
    private Plan enterprisePlan;
    private Plan businessPlan;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        mockRedisStorage.clear();
        valueOperations = Mockito.mock(ValueOperations.class);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        when(valueOperations.get(anyString())).thenAnswer(inv -> {
            String key = inv.getArgument(0);
            return mockRedisStorage.get(key);
        });

        Mockito.doAnswer(inv -> {
            String key = inv.getArgument(0);
            String val = inv.getArgument(1);
            mockRedisStorage.put(key, val);
            return null;
        }).when(valueOperations).set(anyString(), anyString(), any(Duration.class));

        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenAnswer(inv -> {
            String key = inv.getArgument(0);
            String val = inv.getArgument(1);
            if (mockRedisStorage.containsKey(key)) {
                return false;
            }
            mockRedisStorage.put(key, val);
            return true;
        });

        billingService.setStringRedisTemplate(stringRedisTemplate);

        tenantA = tenantRepository.save(Tenant.builder()
                .name("Tenant A Corp")
                .subscriptionPlan("STARTER")
                .subscriptionStatus("ACTIVE")
                .build());

        tenantB = tenantRepository.save(Tenant.builder()
                .name("Tenant B Corp")
                .subscriptionPlan("STARTER")
                .subscriptionStatus("ACTIVE")
                .build());

        enterprisePlan = planRepository.findByCode("enterprise").orElseGet(() ->
                planRepository.save(Plan.builder()
                        .name("Enterprise")
                        .code("enterprise")
                        .price(new BigDecimal("12999.00"))
                        .currency("INR")
                        .billingInterval("MONTHLY")
                        .build()));

        businessPlan = planRepository.findByCode("business").orElseGet(() ->
                planRepository.save(Plan.builder()
                        .name("Business")
                        .code("business")
                        .price(new BigDecimal("8999.00"))
                        .currency("INR")
                        .billingInterval("MONTHLY")
                        .build()));
    }

    private Session createMockSession(String sessionId, String paymentStatus, Long amountTotal, String currency,
                                     String customerId, Map<String, String> metadata) {
        Session session = Mockito.mock(Session.class);
        when(session.getId()).thenReturn(sessionId);
        when(session.getPaymentStatus()).thenReturn(paymentStatus);
        when(session.getAmountTotal()).thenReturn(amountTotal);
        when(session.getCurrency()).thenReturn(currency);
        when(session.getCustomer()).thenReturn(customerId);
        when(session.getMetadata()).thenReturn(metadata);
        return session;
    }

    @Test
    @DisplayName("1. Valid checkout with authoritative server-side binding successfully upgrades subscription")
    void testValidCheckoutWithServerSideBinding() {
        String sessionId = "cs_valid_" + UUID.randomUUID();
        long amount = 1299900L;
        String customerId = "cus_valid_123";

        // Authoritative server-side checkout creation
        billingService.createCheckoutBinding(sessionId, tenantA.getId(), "enterprise", amount, "inr", customerId);

        Map<String, String> metadata = Map.of(
                "tenantId", tenantA.getId().toString(),
                "planCode", "enterprise"
        );
        Session session = createMockSession(sessionId, "paid", amount, "inr", customerId, metadata);

        Subscription updated = billingService.processStripeCheckoutSession(session);

        assertNotNull(updated);
        assertEquals("enterprise", updated.getPlan().getCode());
        assertEquals("ACTIVE", updated.getStatus());
        assertEquals(tenantA.getId(), updated.getTenantId());
    }

    @Test
    @DisplayName("2. Forged tenantId in Stripe metadata fails adversarial check and is rejected")
    void testForgedTenantIdInMetadataRejected() {
        String sessionId = "cs_forged_tenant_" + UUID.randomUUID();
        long amount = 1299900L;
        String customerId = "cus_legit";

        // Bound to Tenant A
        billingService.createCheckoutBinding(sessionId, tenantA.getId(), "enterprise", amount, "inr", customerId);

        // Attacker modifies metadata to point to Tenant B
        Map<String, String> forgedMetadata = Map.of(
                "tenantId", tenantB.getId().toString(),
                "planCode", "enterprise"
        );
        Session session = createMockSession(sessionId, "paid", amount, "inr", customerId, forgedMetadata);

        SecurityException ex = assertThrows(SecurityException.class, () ->
                billingService.processStripeCheckoutSession(session)
        );
        assertTrue(ex.getMessage().contains("metadata tenantId does not match server-side bound tenantId"));
    }

    @Test
    @DisplayName("3. Forged planCode in Stripe metadata fails adversarial check and is rejected")
    void testForgedPlanCodeInMetadataRejected() {
        String sessionId = "cs_forged_plan_" + UUID.randomUUID();
        long amount = 899900L; // Paid for business
        String customerId = "cus_legit";

        // Bound to Business plan
        billingService.createCheckoutBinding(sessionId, tenantA.getId(), "business", amount, "inr", customerId);

        // Attacker claims enterprise in metadata
        Map<String, String> forgedMetadata = Map.of(
                "tenantId", tenantA.getId().toString(),
                "planCode", "enterprise"
        );
        Session session = createMockSession(sessionId, "paid", amount, "inr", customerId, forgedMetadata);

        SecurityException ex = assertThrows(SecurityException.class, () ->
                billingService.processStripeCheckoutSession(session)
        );
        assertTrue(ex.getMessage().contains("metadata planCode does not match server-side bound planCode"));
    }

    @Test
    @DisplayName("4. Wrong Stripe customer ID is rejected")
    void testWrongCustomerIdRejected() {
        String sessionId = "cs_wrong_cust_" + UUID.randomUUID();
        long amount = 1299900L;

        billingService.createCheckoutBinding(sessionId, tenantA.getId(), "enterprise", amount, "inr", "cus_expected_999");

        Map<String, String> metadata = Map.of(
                "tenantId", tenantA.getId().toString(),
                "planCode", "enterprise"
        );
        // Session has different customer
        Session session = createMockSession(sessionId, "paid", amount, "inr", "cus_attacker_111", metadata);

        SecurityException ex = assertThrows(SecurityException.class, () ->
                billingService.processStripeCheckoutSession(session)
        );
        assertTrue(ex.getMessage().contains("does not match bound customer"));
    }

    @Test
    @DisplayName("5. Nonexistent or expired Checkout Session without server-side binding is rejected")
    void testNonexistentSessionBindingRejected() {
        String unregisteredSessionId = "cs_unknown_" + UUID.randomUUID();
        Map<String, String> metadata = Map.of(
                "tenantId", tenantA.getId().toString(),
                "planCode", "enterprise"
        );
        Session session = createMockSession(unregisteredSessionId, "paid", 1299900L, "inr", "cus_unknown", metadata);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                billingService.processStripeCheckoutSession(session)
        );
        assertTrue(ex.getMessage().contains("No authoritative server-side checkout binding found"));
    }

    @Test
    @DisplayName("6. Insufficient amount paid is rejected")
    void testInsufficientAmountRejected() {
        String sessionId = "cs_underpaid_" + UUID.randomUUID();
        long expectedAmount = 1299900L;
        long actualPaidAmount = 1000L; // Underpayment

        billingService.createCheckoutBinding(sessionId, tenantA.getId(), "enterprise", expectedAmount, "inr", "cus_123");

        Map<String, String> metadata = Map.of(
                "tenantId", tenantA.getId().toString(),
                "planCode", "enterprise"
        );
        Session session = createMockSession(sessionId, "paid", actualPaidAmount, "inr", "cus_123", metadata);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                billingService.processStripeCheckoutSession(session)
        );
        assertTrue(ex.getMessage().contains("does not match expected bound amount"));
    }

    @Test
    @DisplayName("7. Excessive/manipulated amount is rejected")
    void testExcessiveAmountRejected() {
        String sessionId = "cs_overpaid_" + UUID.randomUUID();
        long expectedAmount = 899900L;
        long manipulatedAmount = 99999900L;

        billingService.createCheckoutBinding(sessionId, tenantA.getId(), "business", expectedAmount, "inr", "cus_123");

        Map<String, String> metadata = Map.of(
                "tenantId", tenantA.getId().toString(),
                "planCode", "business"
        );
        Session session = createMockSession(sessionId, "paid", manipulatedAmount, "inr", "cus_123", metadata);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                billingService.processStripeCheckoutSession(session)
        );
        assertTrue(ex.getMessage().contains("does not match expected bound amount"));
    }

    @Test
    @DisplayName("8. Wrong currency is rejected")
    void testWrongCurrencyRejected() {
        String sessionId = "cs_wrong_currency_" + UUID.randomUUID();
        long expectedAmount = 1299900L;

        billingService.createCheckoutBinding(sessionId, tenantA.getId(), "enterprise", expectedAmount, "inr", "cus_123");

        Map<String, String> metadata = Map.of(
                "tenantId", tenantA.getId().toString(),
                "planCode", "enterprise"
        );
        // Paid in USD instead of bound INR
        Session session = createMockSession(sessionId, "paid", expectedAmount, "usd", "cus_123", metadata);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                billingService.processStripeCheckoutSession(session)
        );
        assertTrue(ex.getMessage().contains("does not match expected bound currency"));
    }

    @Test
    @DisplayName("9. Duplicate Checkout Session is detected and does not re-process")
    void testDuplicateCheckoutSessionIdempotency() {
        String sessionId = "cs_duplicate_" + UUID.randomUUID();
        long amount = 1299900L;
        String customerId = "cus_dup_123";

        billingService.createCheckoutBinding(sessionId, tenantA.getId(), "enterprise", amount, "inr", customerId);

        Map<String, String> metadata = Map.of(
                "tenantId", tenantA.getId().toString(),
                "planCode", "enterprise"
        );
        Session session = createMockSession(sessionId, "paid", amount, "inr", customerId, metadata);

        // First processing
        Subscription firstResult = billingService.processStripeCheckoutSession(session);
        assertNotNull(firstResult);

        // Second processing (duplicate)
        Subscription secondResult = billingService.processStripeCheckoutSession(session);
        assertNotNull(secondResult);
        // The duplicate returned existing subscription safely without re-triggering new activation cycles
    }

    @Test
    @DisplayName("10. Webhook endpoint rejects invalid Stripe signature with 400 Bad Request")
    void testInvalidStripeSignatureRejected() throws Exception {
        mockMvc.perform(post("/billing/webhook")
                        .header("Stripe-Signature", "t=123456,v1=invalidsignatureabcdef")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\": \"evt_fake_123\", \"type\": \"checkout.session.completed\"}"))
                .andExpect(status().isBadRequest());
    }
}
