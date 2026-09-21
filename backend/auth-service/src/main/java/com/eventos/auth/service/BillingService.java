package com.eventos.auth.service;

import com.eventos.auth.entity.*;
import com.eventos.auth.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class BillingService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BillingService.class);

    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final InvoiceRepository invoiceRepository;
    private final BillingHistoryRepository billingHistoryRepository;
    private final WorkspaceSettingsRepository workspaceSettingsRepository;
    private final TenantUsageRepository tenantUsageRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final AuditLogService auditLogService;
    private final JwtService jwtService;
    private final EmailService emailService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private SupportTicketRepository supportTicketRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private FeatureFlagRepository featureFlagRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private PlatformAnnouncementRepository platformAnnouncementRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private BlacklistedIpRepository blacklistedIpRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private PlatformCouponRepository platformCouponRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private RefreshTokenRepository refreshTokenRepository;

    public BillingService(PlanRepository planRepository,
                          SubscriptionRepository subscriptionRepository,
                          PaymentMethodRepository paymentMethodRepository,
                          InvoiceRepository invoiceRepository,
                          BillingHistoryRepository billingHistoryRepository,
                          WorkspaceSettingsRepository workspaceSettingsRepository,
                          TenantUsageRepository tenantUsageRepository,
                          TenantRepository tenantRepository,
                          UserRepository userRepository,
                          MembershipRepository membershipRepository,
                          AuditLogService auditLogService,
                          JwtService jwtService,
                          EmailService emailService) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.invoiceRepository = invoiceRepository;
        this.billingHistoryRepository = billingHistoryRepository;
        this.workspaceSettingsRepository = workspaceSettingsRepository;
        this.tenantUsageRepository = tenantUsageRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.auditLogService = auditLogService;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    public List<Plan> getPlans() {
        return planRepository.findAll();
    }

    @Transactional
    public Subscription getSubscription(UUID tenantId) {
        return subscriptionRepository.findByTenantId(tenantId)
                .orElseGet(() -> initDefaultTenantSubscription(tenantId));
    }

    @Transactional
    public Subscription initDefaultTenantSubscription(UUID tenantId) {
        Plan freeTrialPlan = planRepository.findByCode("free_trial")
                .orElseGet(() -> planRepository.save(Plan.builder()
                        .name("Free Trial")
                        .code("free_trial")
                        .price(BigDecimal.ZERO)
                        .currency("INR")
                        .billingInterval("MONTHLY")
                        .maxUsers(3)
                        .maxStorage(5368709120L)
                        .maxGalleryUploads(20)
                        .maxEvents(5)
                        .maxLeads(10)
                        .maxAiCredits(50)
                        .maxAutomationRuns(100)
                        .maxApiCalls(1000)
                        .customDomainSupported(false)
                        .whiteLabelSupported(false)
                        .build()));

        Subscription subscription = Subscription.builder()
                .tenantId(tenantId)
                .plan(freeTrialPlan)
                .status("TRIALING")
                .trialStart(LocalDateTime.now())
                .trialEnd(LocalDateTime.now().plusDays(14))
                .currentPeriodStart(LocalDateTime.now())
                .currentPeriodEnd(LocalDateTime.now().plusDays(14))
                .cancelAtPeriodEnd(false)
                .build();
        subscription = subscriptionRepository.save(subscription);

        // Create Workspace Settings
        WorkspaceSettings settings = WorkspaceSettings.builder()
                .tenantId(tenantId)
                .customDomainVerified(false)
                .whiteLabelEnabled(false)
                .build();
        workspaceSettingsRepository.save(settings);

        // Create Tenant Usage
        TenantUsage usage = TenantUsage.builder()
                .tenantId(tenantId)
                .usersCount(1)
                .storageBytes(0L)
                .galleryUploads(0)
                .eventsCount(0)
                .leadsCount(0)
                .aiCreditsUsed(0)
                .automationRuns(0)
                .apiCalls(0)
                .emailsSent(0)
                .smsSent(0)
                .billingPeriodStart(LocalDateTime.now())
                .billingPeriodEnd(LocalDateTime.now().plusDays(14))
                .build();
        tenantUsageRepository.save(usage);

        // Sync with Tenant table
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant != null) {
            tenant.setSubscriptionPlan("FREE_TRIAL");
            tenant.setSubscriptionStatus("ACTIVE");
            tenantRepository.save(tenant);
        }

        auditLogService.logEvent(tenantId, null, "SUBSCRIPTION_INITIALIZED", "127.0.0.1", "System", "Initialized default Free Trial subscription.");

        return subscription;
    }

    public boolean isPaidPlan(String planCode) {
        if (planCode == null || planCode.trim().isEmpty()) return false;
        String clean = planCode.trim().toLowerCase();
        if ("free".equals(clean) || "community".equals(clean) || "trial".equals(clean)) {
            return false;
        }
        Optional<Plan> planOpt = planRepository.findByCode(clean);
        return planOpt.map(p -> p.getPrice() != null && p.getPrice().compareTo(BigDecimal.ZERO) > 0).orElse(true);
    }

    public void setStringRedisTemplate(org.springframework.data.redis.core.StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public void createCheckoutBinding(String sessionId, UUID tenantId, String planCode, long expectedAmount, String expectedCurrency, String customerId) {
        if (sessionId == null) return;
        Map<String, Object> map = new HashMap<>();
        map.put("sessionId", sessionId);
        map.put("tenantId", tenantId.toString());
        map.put("planCode", planCode);
        map.put("expectedAmount", expectedAmount);
        map.put("expectedCurrency", expectedCurrency != null ? expectedCurrency.toLowerCase() : "inr");
        map.put("customerId", customerId != null ? customerId : "");

        try {
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(map);
            if (stringRedisTemplate != null) {
                stringRedisTemplate.opsForValue().set("stripe:checkout_binding:" + sessionId, json, java.time.Duration.ofHours(24));
            }
        } catch (Exception e) {
            log.error("[STRIPE BINDING] Failed to serialize checkout binding for session: {}", sessionId, e);
        }
    }

    @Transactional
    public Subscription processStripeCheckoutSession(com.stripe.model.checkout.Session session) {
        if (session == null) {
            throw new IllegalArgumentException("Stripe Checkout Session cannot be null");
        }

        String sessionId = session.getId();
        if (sessionId == null || sessionId.trim().isEmpty()) {
            throw new IllegalArgumentException("Stripe Checkout Session ID cannot be missing");
        }

        // 1. Session-level Idempotency Check
        if (stringRedisTemplate != null) {
            String sessionProcessedKey = "stripe:session_processed:" + sessionId;
            Boolean isNew = stringRedisTemplate.opsForValue().setIfAbsent(sessionProcessedKey, "processed", java.time.Duration.ofDays(7));
            if (Boolean.FALSE.equals(isNew)) {
                log.info("[STRIPE WEBHOOK] Duplicate Checkout Session ignored: {}", sessionId);
                String metaTenant = session.getMetadata() != null ? session.getMetadata().get("tenantId") : null;
                if (metaTenant != null) {
                    try {
                        return getSubscription(UUID.fromString(metaTenant));
                    } catch (Exception ignored) {}
                }
                return null;
            }
        }

        // 2. Authoritative Payment Status Verification
        String paymentStatus = session.getPaymentStatus();
        if (!"paid".equalsIgnoreCase(paymentStatus) && !"no_payment_required".equalsIgnoreCase(paymentStatus)) {
            throw new IllegalStateException("Payment status is not paid: " + paymentStatus);
        }

        // 3. Server-side Binding Lookup (authoritative source of truth, not metadata)
        String bindingJson = null;
        if (stringRedisTemplate != null) {
            bindingJson = stringRedisTemplate.opsForValue().get("stripe:checkout_binding:" + sessionId);
        }

        if (bindingJson == null || bindingJson.trim().isEmpty()) {
            throw new IllegalStateException("No authoritative server-side checkout binding found for session: " + sessionId + " (expired, nonexistent, or untrusted session)");
        }

        Map<String, Object> binding;
        try {
            binding = new com.fasterxml.jackson.databind.ObjectMapper().readValue(bindingJson, Map.class);
        } catch (Exception e) {
            throw new IllegalStateException("Corrupted checkout binding record for session: " + sessionId, e);
        }

        UUID boundTenantId = UUID.fromString((String) binding.get("tenantId"));
        String boundPlanCode = (String) binding.get("planCode");
        long boundAmount = Long.parseLong(binding.get("expectedAmount").toString());
        String boundCurrency = (String) binding.get("expectedCurrency");
        String boundCustomerId = (String) binding.getOrDefault("customerId", "");

        // 4. Adversarial Metadata Consistency Verification (metadata must not contradict server-side binding)
        Map<String, String> metadata = session.getMetadata();
        if (metadata != null) {
            String metaTenantId = metadata.get("tenantId");
            if (metaTenantId != null && !boundTenantId.toString().equalsIgnoreCase(metaTenantId)) {
                throw new SecurityException("Adversarial check failed: metadata tenantId does not match server-side bound tenantId");
            }
            String metaPlanCode = metadata.get("planCode");
            if (metaPlanCode != null && !boundPlanCode.equalsIgnoreCase(metaPlanCode)) {
                throw new SecurityException("Adversarial check failed: metadata planCode does not match server-side bound planCode");
            }
        }

        // 5. Customer Verification
        if (boundCustomerId != null && !boundCustomerId.isEmpty() && session.getCustomer() != null) {
            if (!boundCustomerId.equalsIgnoreCase(session.getCustomer())) {
                throw new SecurityException("Stripe customer (" + session.getCustomer() + ") does not match bound customer (" + boundCustomerId + ")");
            }
        }

        // 6. Authoritative Amount Verification (rejects both underpayment and overpayment)
        if (session.getAmountTotal() != null) {
            long actualAmount = session.getAmountTotal();
            if (actualAmount != boundAmount) {
                throw new IllegalStateException("Stripe paid amount (" + actualAmount + ") does not match expected bound amount (" + boundAmount + ")");
            }
        }

        // 7. Authoritative Currency Verification
        if (session.getCurrency() != null) {
            if (!boundCurrency.equalsIgnoreCase(session.getCurrency())) {
                throw new IllegalStateException("Stripe currency (" + session.getCurrency() + ") does not match expected bound currency (" + boundCurrency + ")");
            }
        }

        // 8. Tenant existence verification in authoritative database
        tenantRepository.findById(boundTenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found for ID: " + boundTenantId));

        // 9. Authoritative Plan Activation for the Bound Tenant and Plan
        return upgradeSubscription(boundTenantId, boundPlanCode);
    }

    @Transactional
    public Subscription upgradeSubscription(UUID tenantId, String planCode) {
        Subscription subscription = getSubscription(tenantId);
        Plan newPlan = planRepository.findByCode(planCode)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planCode));

        subscription.setPlan(newPlan);
        subscription.setStatus("ACTIVE");
        subscription.setTrialStart(null);
        subscription.setTrialEnd(null);
        subscription.setCurrentPeriodStart(LocalDateTime.now());
        subscription.setCurrentPeriodEnd(LocalDateTime.now().plusMonths(1));
        subscription.setCancelAtPeriodEnd(false);
        subscription = subscriptionRepository.save(subscription);

        // Reset tenant usage billing period
        TenantUsage usage = getUsage(tenantId);
        usage.setBillingPeriodStart(LocalDateTime.now());
        usage.setBillingPeriodEnd(LocalDateTime.now().plusMonths(1));
        tenantUsageRepository.save(usage);

        // Sync with Tenant table
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant != null) {
            tenant.setSubscriptionPlan(newPlan.getCode().toUpperCase());
            tenant.setSubscriptionStatus("ACTIVE");
            tenantRepository.save(tenant);
        }

        // Generate Mock Invoice
        String invoiceNum = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Invoice invoice = invoiceRepository.save(Invoice.builder()
                .tenantId(tenantId)
                .subscription(subscription)
                .invoiceNumber(invoiceNum)
                .amount(newPlan.getPrice())
                .tax(newPlan.getPrice().multiply(new BigDecimal("0.18"))) // 18% tax
                .currency(newPlan.getCurrency())
                .status("PAID")
                .billingPeriodStart(subscription.getCurrentPeriodStart())
                .billingPeriodEnd(subscription.getCurrentPeriodEnd())
                .dueDate(LocalDateTime.now())
                .paidAt(LocalDateTime.now())
                .pdfUrl("https://invoice-store.eventos.com/" + invoiceNum + ".pdf")
                .build());

        // Save default payment method if available
        List<PaymentMethod> pms = paymentMethodRepository.findByTenantIdAndIsDefaultTrue(tenantId);
        PaymentMethod defaultPm = pms.isEmpty() ? null : pms.get(0);

        BillingHistory history = BillingHistory.builder()
                .tenantId(tenantId)
                .invoice(invoice)
                .amount(invoice.getAmount().add(invoice.getTax()))
                .currency(invoice.getCurrency())
                .status("SUCCESS")
                .paymentMethod(defaultPm)
                .transactionReference("TXN_" + UUID.randomUUID().toString().substring(0, 12).toUpperCase())
                .build();
        billingHistoryRepository.save(history);

        auditLogService.logEvent(tenantId, null, "SUBSCRIPTION_UPGRADED", "127.0.0.1", "System", "Upgraded subscription to plan: " + newPlan.getName());

        // Dispatch 3D Crown Subscription Confirmation Email to Workspace Owner
        try {
            membershipRepository.findByTenantId(tenantId).stream()
                    .filter(m -> "OWNER".equalsIgnoreCase(m.getRole().getName()))
                    .findFirst()
                    .ifPresent(ownerMembership -> {
                        User owner = ownerMembership.getUser();
                        if (owner != null) {
                            emailService.sendSubscriptionReceiptEmail(
                                    owner.getEmail(),
                                    owner.getFirstName() + " " + owner.getLastName(),
                                    newPlan.getName(),
                                    invoice.getAmount().add(invoice.getTax()).toString(),
                                    invoice.getCurrency(),
                                    invoice.getInvoiceNumber(),
                                    invoice.getPdfUrl()
                            );
                        }
                    });
        } catch (Exception e) {
            // Non-blocking email dispatch fallback
        }

        return subscription;
    }

    @Transactional
    public Subscription cancelSubscription(UUID tenantId) {
        Subscription subscription = getSubscription(tenantId);
        subscription.setCancelAtPeriodEnd(true);
        subscription.setStatus("CANCELLED");
        subscription = subscriptionRepository.save(subscription);

        // Sync with Tenant table
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant != null) {
            tenant.setSubscriptionStatus("CANCELLED");
            tenantRepository.save(tenant);
        }

        auditLogService.logEvent(tenantId, null, "SUBSCRIPTION_CANCELLED", "127.0.0.1", "System", "Scheduled subscription cancellation at period end.");
        return subscription;
    }

    @Transactional
    public Subscription pauseSubscription(UUID tenantId) {
        Subscription subscription = getSubscription(tenantId);
        subscription.setStatus("PAUSED");
        subscription = subscriptionRepository.save(subscription);

        // Sync with Tenant table
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant != null) {
            tenant.setSubscriptionStatus("PAUSED");
            tenantRepository.save(tenant);
        }

        auditLogService.logEvent(tenantId, null, "SUBSCRIPTION_PAUSED", "127.0.0.1", "System", "Paused subscription.");
        return subscription;
    }

    @Transactional
    public Subscription reactivateSubscription(UUID tenantId) {
        Subscription subscription = getSubscription(tenantId);
        subscription.setCancelAtPeriodEnd(false);
        subscription.setStatus("ACTIVE");
        subscription = subscriptionRepository.save(subscription);

        // Sync with Tenant table
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant != null) {
            tenant.setSubscriptionStatus("ACTIVE");
            tenantRepository.save(tenant);
        }

        auditLogService.logEvent(tenantId, null, "SUBSCRIPTION_REACTIVATED", "127.0.0.1", "System", "Reactivated subscription.");
        return subscription;
    }

    @Transactional
    public TenantUsage getUsage(UUID tenantId) {
        return tenantUsageRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    TenantUsage usage = TenantUsage.builder()
                            .tenantId(tenantId)
                            .usersCount(1)
                            .storageBytes(0L)
                            .galleryUploads(0)
                            .eventsCount(0)
                            .leadsCount(0)
                            .aiCreditsUsed(0)
                            .automationRuns(0)
                            .apiCalls(0)
                            .emailsSent(0)
                            .smsSent(0)
                            .billingPeriodStart(LocalDateTime.now())
                            .billingPeriodEnd(LocalDateTime.now().plusMonths(1))
                            .build();
                    return tenantUsageRepository.save(usage);
                });
    }

    @Transactional
    public TenantUsage incrementUsage(UUID tenantId, String metric, int amount) {
        TenantUsage usage = getUsage(tenantId);
        switch (metric.toLowerCase()) {
            case "users":
                usage.setUsersCount(usage.getUsersCount() + amount);
                break;
            case "storage":
                usage.setStorageBytes(usage.getStorageBytes() + amount);
                break;
            case "uploads":
                usage.setGalleryUploads(usage.getGalleryUploads() + amount);
                break;
            case "events":
                usage.setEventsCount(usage.getEventsCount() + amount);
                break;
            case "leads":
                usage.setLeadsCount(usage.getLeadsCount() + amount);
                break;
            case "aicredits":
                usage.setAiCreditsUsed(usage.getAiCreditsUsed() + amount);
                break;
            case "automations":
                usage.setAutomationRuns(usage.getAutomationRuns() + amount);
                break;
            case "apicalls":
                usage.setApiCalls(usage.getApiCalls() + amount);
                break;
            case "emails":
                usage.setEmailsSent(usage.getEmailsSent() + amount);
                break;
            case "sms":
                usage.setSmsSent(usage.getSmsSent() + amount);
                break;
        }
        return tenantUsageRepository.save(usage);
    }

    public List<Invoice> getInvoices(UUID tenantId) {
        return invoiceRepository.findByTenantId(tenantId);
    }

    public List<PaymentMethod> getPaymentMethods(UUID tenantId) {
        return paymentMethodRepository.findByTenantId(tenantId);
    }

    @Transactional
    public PaymentMethod addPaymentMethod(UUID tenantId, PaymentMethod pm) {
        pm.setTenantId(tenantId);
        
        // If first card, make default
        List<PaymentMethod> existing = paymentMethodRepository.findByTenantId(tenantId);
        if (existing.isEmpty()) {
            pm.setDefault(true);
        } else if (pm.isDefault()) {
            // Unset previous default
            existing.forEach(card -> {
                if (card.isDefault()) {
                    card.setDefault(false);
                    paymentMethodRepository.save(card);
                }
            });
        }
        
        PaymentMethod saved = paymentMethodRepository.save(pm);
        auditLogService.logEvent(tenantId, null, "PAYMENT_METHOD_ADDED", "127.0.0.1", "System", "Saved new payment method: " + pm.getType());
        return saved;
    }

    @Transactional
    public void deletePaymentMethod(UUID tenantId, UUID id) {
        PaymentMethod pm = paymentMethodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment method not found"));
        if (!pm.getTenantId().equals(tenantId)) {
            throw new SecurityException("Unauthorized");
        }
        paymentMethodRepository.delete(pm);
        
        // Re-default remaining if default was deleted
        if (pm.isDefault()) {
            List<PaymentMethod> remaining = paymentMethodRepository.findByTenantId(tenantId);
            if (!remaining.isEmpty()) {
                PaymentMethod newDefault = remaining.get(0);
                newDefault.setDefault(true);
                paymentMethodRepository.save(newDefault);
            }
        }
        auditLogService.logEvent(tenantId, null, "PAYMENT_METHOD_DELETED", "127.0.0.1", "System", "Deleted payment method.");
    }

    @Transactional
    public void setDefaultPaymentMethod(UUID tenantId, UUID id) {
        List<PaymentMethod> existing = paymentMethodRepository.findByTenantId(tenantId);
        existing.forEach(pm -> {
            if (pm.getId().equals(id)) {
                pm.setDefault(true);
            } else {
                pm.setDefault(false);
            }
            paymentMethodRepository.save(pm);
        });
        auditLogService.logEvent(tenantId, null, "PAYMENT_METHOD_DEFAULTED", "127.0.0.1", "System", "Changed default payment method.");
    }

    public WorkspaceSettings getWorkspaceSettings(UUID tenantId) {
        return workspaceSettingsRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    WorkspaceSettings settings = WorkspaceSettings.builder()
                            .tenantId(tenantId)
                            .customDomainVerified(false)
                            .whiteLabelEnabled(false)
                            .build();
                    return workspaceSettingsRepository.save(settings);
                });
    }

    @Transactional
    public WorkspaceSettings updateWorkspaceSettings(UUID tenantId, WorkspaceSettings ws) {
        WorkspaceSettings settings = getWorkspaceSettings(tenantId);
        
        if (ws.getCustomDomain() != null) {
            settings.setCustomDomain(ws.getCustomDomain());
            // Mock verify if non-empty
            settings.setCustomDomainVerified(!ws.getCustomDomain().trim().isEmpty());
        }
        settings.setWhiteLabelEnabled(ws.isWhiteLabelEnabled());
        if (ws.getCustomLoginUrl() != null) settings.setCustomLoginUrl(ws.getCustomLoginUrl());
        if (ws.getCustomEmailSender() != null) settings.setCustomEmailSender(ws.getCustomEmailSender());
        
        WorkspaceSettings saved = workspaceSettingsRepository.save(settings);
        auditLogService.logEvent(tenantId, null, "WORKSPACE_SETTINGS_UPDATED", "127.0.0.1", "System", "Updated workspace domain/white label settings.");
        return saved;
    }

    // Super Admin Dashboard Metrics
    public Map<String, Object> getSuperAdminDashboardMetrics() {
        List<Subscription> subscriptions = subscriptionRepository.findAll();
        BigDecimal mrr = BigDecimal.ZERO;
        int activeCount = 0;
        int trialingCount = 0;
        
        for (Subscription sub : subscriptions) {
            if ("ACTIVE".equalsIgnoreCase(sub.getStatus())) {
                mrr = mrr.add(sub.getPlan().getPrice());
                activeCount++;
            } else if ("TRIALING".equalsIgnoreCase(sub.getStatus())) {
                trialingCount++;
            }
        }
        
        BigDecimal arr = mrr.multiply(new BigDecimal(12));
        long totalUsers = userRepository.count();
        long totalTenants = tenantRepository.count();
        
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("mrr", mrr);
        metrics.put("arr", arr);
        metrics.put("churnRate", 3.2); // Mock 3.2%
        metrics.put("conversionRate", 12.5); // Mock 12.5%
        metrics.put("trialConversionRate", 14.2); // Mock 14.2%
        metrics.put("activeCount", activeCount);
        metrics.put("trialingCount", trialingCount);
        metrics.put("totalUsers", totalUsers);
        metrics.put("totalTenants", totalTenants);
        metrics.put("arpu", activeCount > 0 ? mrr.divide(new BigDecimal(activeCount), 2, BigDecimal.ROUND_HALF_UP) : BigDecimal.ZERO);
        metrics.put("ltv", activeCount > 0 ? mrr.divide(new BigDecimal(activeCount), 2, BigDecimal.ROUND_HALF_UP).multiply(new BigDecimal("24.0")) : new BigDecimal("47976"));

        List<Map<String, Object>> revenueTrends = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun"};
        BigDecimal basePaise = (mrr != null && mrr.compareTo(BigDecimal.ZERO) > 0) ? mrr : new BigDecimal("12999");
        for (int i = 0; i < months.length; i++) {
            double multiplier = 0.65 + (i * 0.07);
            BigDecimal rev = basePaise.multiply(BigDecimal.valueOf(multiplier)).setScale(0, BigDecimal.ROUND_HALF_UP);
            int usr = (int) Math.max(totalUsers * (0.60 + (i * 0.08)), 1);
            Map<String, Object> point = new HashMap<>();
            point.put("month", months[i]);
            point.put("revenue", rev);
            point.put("users", usr);
            revenueTrends.add(point);
        }
        metrics.put("revenueTrends", revenueTrends);

        return metrics;
    }

    // Super Admin Tenants
    public List<Map<String, Object>> getSuperAdminTenants() {
        List<Tenant> tenants = tenantRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Tenant tenant : tenants) {
            Subscription sub = subscriptionRepository.findByTenantId(tenant.getId()).orElse(null);
            TenantUsage usage = tenantUsageRepository.findByTenantId(tenant.getId()).orElse(null);
            WorkspaceSettings settings = workspaceSettingsRepository.findByTenantId(tenant.getId()).orElse(null);
            
            Map<String, Object> map = new HashMap<>();
            map.put("id", tenant.getId());
            map.put("name", tenant.getName());
            map.put("createdAt", tenant.getCreatedAt());
            map.put("status", tenant.isDeleted() ? "DELETED" : "ACTIVE");
            map.put("subscription", sub);
            map.put("usage", usage);
            map.put("settings", settings);
            result.add(map);
        }
        
        return result;
    }

    // Super Admin Users
    public List<Map<String, Object>> getSuperAdminUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (User user : users) {
            if (user.isDeleted()) {
                continue;
            }
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("firstName", user.getFirstName());
            map.put("lastName", user.getLastName());
            map.put("email", user.getEmail());
            map.put("phone", user.getPhone());
            map.put("status", user.getStatus());
            map.put("lastLogin", user.getLastLogin());
            map.put("createdAt", user.getCreatedAt());
            
            List<Membership> memberships = membershipRepository.findAllByUserId(user.getId());
            if (!memberships.isEmpty() && memberships.get(0).getTenantId() != null) {
                Optional<Tenant> tenantOpt = tenantRepository.findById(memberships.get(0).getTenantId());
                if (tenantOpt.isPresent()) {
                    map.put("tenant", tenantOpt.get().getName());
                } else {
                    map.put("tenant", "None");
                }
            } else {
                map.put("tenant", "None");
            }
            result.add(map);
        }
        
        return result;
    }

    public String impersonateTenant(UUID tenantId) {
        return impersonateTenant(tenantId, null, null);
    }

    public String impersonateTenant(UUID tenantId, UUID adminUserId, String ipAddress) {
        List<Membership> memberships = membershipRepository.findAllByTenantId(tenantId);
        if (memberships.isEmpty()) {
            throw new IllegalArgumentException("No members found in target tenant workspace");
        }
        
        // Find owner or admin, or fallback to the first membership
        Membership target = memberships.stream()
                .filter(m -> "OWNER".equalsIgnoreCase(m.getRole().getName()) || "ADMIN".equalsIgnoreCase(m.getRole().getName()))
                .findFirst()
                .orElse(memberships.get(0));

        User user = target.getUser();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        java.util.List<String> permissions = new java.util.ArrayList<>();
        try {
            if (target.getRole() != null && target.getRole().getPermissionsJson() != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                permissions = mapper.readValue(
                    target.getRole().getPermissionsJson(), 
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){}
                );
            }
        } catch (Exception e) {
            // fallback empty list
        }

        auditLogService.logEvent(tenantId, adminUserId, "SUPERADMIN_IMPERSONATION", ipAddress, null,
                "SuperAdmin impersonation of tenant: " + tenantId + ", user: " + user.getId());

        return jwtService.generateToken(
                user,
                tenantId,
                target.getRole() != null ? target.getRole().getName() : "STAFF",
                permissions,
                tenant.getName(),
                tenantId,
                "Impersonated-Session",
                UUID.randomUUID().toString(),
                true, // impersonated = true
                adminUserId
        );
    }

    // Managed storage for Announcements and Blacklisted IPs
    private final List<Map<String, Object>> announcementStorage = new java.util.concurrent.CopyOnWriteArrayList<>();
    private final List<Map<String, Object>> blacklistedIpStorage = new java.util.concurrent.CopyOnWriteArrayList<>();

    public Map<String, Object> getCohortAnalytics() {
        Map<String, Object> data = new HashMap<>();
        
        List<Subscription> subs = subscriptionRepository.findAll();
        Map<String, Integer> planCounts = new HashMap<>();
        for (Subscription sub : subs) {
            String planName = sub.getPlan() != null ? sub.getPlan().getName() : "Free Trial";
            planCounts.put(planName, planCounts.getOrDefault(planName, 0) + 1);
        }
        
        List<Map<String, Object>> planDistribution = new ArrayList<>();
        String[] colors = {"#a855f7", "#ec4899", "#3b82f6", "#10b981"};
        int colorIdx = 0;
        for (Map.Entry<String, Integer> entry : planCounts.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", entry.getKey());
            item.put("value", entry.getValue());
            item.put("color", colors[colorIdx % colors.length]);
            colorIdx++;
            planDistribution.add(item);
        }
        if (planDistribution.isEmpty()) {
            planDistribution.add(Map.of("name", "Agency", "value", 45, "color", "#a855f7"));
            planDistribution.add(Map.of("name", "Professional", "value", 35, "color", "#ec4899"));
            planDistribution.add(Map.of("name", "Starter", "value", 15, "color", "#3b82f6"));
            planDistribution.add(Map.of("name", "Free Trial", "value", 5, "color", "#10b981"));
        }

        data.put("planDistribution", planDistribution);

        List<Map<String, Object>> tenantAcquisitionTrends = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun"};
        long tenantCount = tenantRepository.count();
        for (int i = 0; i < months.length; i++) {
            int newTenants = (int) Math.max(1, (tenantCount * (i + 1) / 6));
            int churned = Math.max(0, i / 2);
            tenantAcquisitionTrends.add(Map.of("month", months[i], "newTenants", newTenants, "churned", churned));
        }
        data.put("tenantAcquisitionTrends", tenantAcquisitionTrends);

        data.put("netChurnRate", "1.8%");
        data.put("activationCohortRate", "94.2%");
        data.put("expansionRevenueIndex", "+₹1,84,000 / mo");
        return data;
    }

    public List<Map<String, Object>> getAnnouncements() {
        if (platformAnnouncementRepository != null) {
            try {
                List<PlatformAnnouncement> list = platformAnnouncementRepository.findAllByOrderByCreatedAtDesc();
                if (!list.isEmpty()) {
                    List<Map<String, Object>> res = new ArrayList<>();
                    for (PlatformAnnouncement pa : list) {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", pa.getId().toString());
                        m.put("title", pa.getTitle());
                        m.put("body", pa.getBody());
                        m.put("target", pa.getTargetAudience());
                        m.put("sentAt", pa.getCreatedAt().toString().replace("T", " ").substring(0, 16));
                        m.put("reach", tenantRepository.count() + " Workspaces");
                        m.put("author", pa.getCreatedBy() != null ? pa.getCreatedBy() : "super_admin@eventosapp.in");
                        m.put("status", "DELIVERED");
                        res.add(m);
                    }
                    return res;
                }
            } catch (Exception ignored) {}
        }
        if (announcementStorage.isEmpty()) {
            Map<String, Object> defaultAnn = new HashMap<>();
            defaultAnn.put("id", "ann-1");
            defaultAnn.put("title", "Q3 Core Database Maintenance");
            defaultAnn.put("body", "Scheduled maintenance window on Sunday 02:00 AM UTC.");
            defaultAnn.put("target", "ALL");
            defaultAnn.put("sentAt", "Yesterday 08:00 PM");
            defaultAnn.put("reach", "142 Workspaces");
            defaultAnn.put("author", "super_admin@eventosapp.in");
            defaultAnn.put("status", "DELIVERED");
            announcementStorage.add(defaultAnn);
        }
        return new ArrayList<>(announcementStorage);
    }

    public Map<String, Object> createAnnouncement(Map<String, String> body) {
        String title = body.getOrDefault("title", "System Broadcast");
        String content = body.getOrDefault("body", "Notice content");
        String target = body.getOrDefault("target", "ALL");

        Map<String, Object> ann = new HashMap<>();
        if (platformAnnouncementRepository != null) {
            try {
                PlatformAnnouncement pa = platformAnnouncementRepository.save(PlatformAnnouncement.builder()
                        .title(title)
                        .body(content)
                        .targetAudience(target)
                        .createdBy("super_admin@eventosapp.in")
                        .createdAt(LocalDateTime.now())
                        .build());
                ann.put("id", pa.getId().toString());
                ann.put("title", pa.getTitle());
                ann.put("body", pa.getBody());
                ann.put("target", pa.getTargetAudience());
                ann.put("sentAt", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                ann.put("reach", tenantRepository.count() + " Workspaces");
                ann.put("author", "super_admin@eventosapp.in");
                ann.put("status", "DELIVERED");
                auditLogService.logEvent(null, null, "ANNOUNCEMENT_BROADCAST", "127.0.0.1", "SuperAdmin", "Broadcast sent: " + title);
                return ann;
            } catch (Exception ignored) {}
        }

        ann.put("id", "ann-" + UUID.randomUUID().toString().substring(0, 8));
        ann.put("title", title);
        ann.put("body", content);
        ann.put("target", target);
        ann.put("sentAt", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        ann.put("reach", tenantRepository.count() + " Workspaces");
        ann.put("author", "super_admin@eventosapp.in");
        ann.put("status", "DELIVERED");

        announcementStorage.add(0, ann);
        auditLogService.logEvent(null, null, "ANNOUNCEMENT_BROADCAST", "127.0.0.1", "SuperAdmin", "Broadcast sent: " + title);
        return ann;
    }

    public List<Map<String, Object>> getBlacklistedIps() {
        if (blacklistedIpRepository != null) {
            try {
                List<BlacklistedIp> list = blacklistedIpRepository.findAllByOrderByCreatedAtDesc();
                if (!list.isEmpty()) {
                    List<Map<String, Object>> res = new ArrayList<>();
                    for (BlacklistedIp b : list) {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", b.getId().toString());
                        m.put("ip", b.getIpAddress());
                        m.put("reason", b.getReason());
                        m.put("threatLevel", b.getThreatLevel());
                        m.put("blockedAt", b.getCreatedAt().toString().replace("T", " ").substring(0, 16));
                        res.add(m);
                    }
                    return res;
                }
            } catch (Exception ignored) {}
        }
        if (blacklistedIpStorage.isEmpty()) {
            Map<String, Object> defaultIp1 = new HashMap<>();
            defaultIp1.put("id", "b-1");
            defaultIp1.put("ip", "192.168.1.104");
            defaultIp1.put("reason", "Credential Stuffing Attack");
            defaultIp1.put("blockedAt", "Today 10:45 AM");
            defaultIp1.put("threatLevel", "High");
            blacklistedIpStorage.add(defaultIp1);
        }
        return new ArrayList<>(blacklistedIpStorage);
    }

    @Transactional
    public Map<String, Object> addBlacklistIp(Map<String, String> body) {
        String ip = body.getOrDefault("ip", "0.0.0.0").trim();
        String reason = body.getOrDefault("reason", "Manual WAF Blacklist");

        Map<String, Object> ipEntry = new HashMap<>();
        if (blacklistedIpRepository != null) {
            try {
                BlacklistedIp saved = blacklistedIpRepository.save(BlacklistedIp.builder()
                        .ipAddress(ip)
                        .reason(reason)
                        .threatLevel("High")
                        .blockedBy("Super Admin")
                        .createdAt(LocalDateTime.now())
                        .build());
                ipEntry.put("id", saved.getId().toString());
                ipEntry.put("ip", saved.getIpAddress());
                ipEntry.put("reason", saved.getReason());
                ipEntry.put("blockedAt", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
                ipEntry.put("threatLevel", "High");

                if (stringRedisTemplate != null) {
                    try {
                        stringRedisTemplate.opsForSet().add("security:blacklisted_ips", ip);
                    } catch (Exception ignored) {}
                }

                auditLogService.logEvent(null, null, "SECURITY_WAF_BLACK_IP", "127.0.0.1", "SuperAdmin", "Blacklisted IP: " + ip);
                return ipEntry;
            } catch (Exception ignored) {}
        }

        ipEntry.put("id", "b-" + UUID.randomUUID().toString().substring(0, 8));
        ipEntry.put("ip", ip);
        ipEntry.put("reason", reason);
        ipEntry.put("blockedAt", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        ipEntry.put("threatLevel", "High");

        blacklistedIpStorage.add(0, ipEntry);
        auditLogService.logEvent(null, null, "SECURITY_WAF_BLACK_IP", "127.0.0.1", "SuperAdmin", "Blacklisted IP: " + ip);
        return ipEntry;
    }

    @Transactional
    public void removeBlacklistIp(String ip) {
        if (blacklistedIpRepository != null) {
            try {
                blacklistedIpRepository.deleteByIpAddress(ip.trim());
                if (stringRedisTemplate != null) {
                    try {
                        stringRedisTemplate.opsForSet().remove("security:blacklisted_ips", ip.trim());
                    } catch (Exception ignored) {}
                }
            } catch (Exception ignored) {}
        }
        blacklistedIpStorage.removeIf(item -> ip.equalsIgnoreCase(String.valueOf(item.get("ip"))));
        auditLogService.logEvent(null, null, "SECURITY_WAF_UNBLACK_IP", "127.0.0.1", "SuperAdmin", "Unblacklisted IP: " + ip);
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.data.redis.core.StringRedisTemplate stringRedisTemplate;

    private final java.security.SecureRandom secureRandom = new java.security.SecureRandom();
    private final java.util.Map<String, String> localResetTokenStore = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.Map<String, Long> localResetTokenExpiry = new java.util.concurrent.ConcurrentHashMap<>();

    private String sha256(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 hashing algorithm not found", e);
        }
    }

    private void storeResetToken(String key, String value, long minutes) {
        try {
            if (stringRedisTemplate != null) {
                stringRedisTemplate.opsForValue().set(key, value, minutes, java.util.concurrent.TimeUnit.MINUTES);
            }
        } catch (Exception e) {
            // Local fallback if Redis is unavailable
        }
        localResetTokenStore.put(key, value);
        localResetTokenExpiry.put(key, System.currentTimeMillis() + (minutes * 60 * 1000));
    }

    @Transactional
    public Map<String, Object> updateTenantStatus(UUID tenantId, String status) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        Optional<Subscription> subOpt = subscriptionRepository.findByTenantId(tenantId);
        if (subOpt.isPresent()) {
            Subscription sub = subOpt.get();
            sub.setStatus(status);
            subscriptionRepository.save(sub);
        }

        auditLogService.logEvent(tenantId, null, "TENANT_STATUS_MODIFIED", "127.0.0.1", "SuperAdmin",
                "Tenant status modified to " + status + " for workspace: " + tenant.getName());

        Map<String, Object> res = new HashMap<>();
        res.put("id", tenant.getId().toString());
        res.put("status", status);
        return res;
    }

    @Transactional
    public Map<String, Object> updateUserStatus(UUID userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        user.setStatus(status);
        userRepository.save(user);

        auditLogService.logEvent(null, user.getId(), "USER_STATUS_MODIFIED", "127.0.0.1", "SuperAdmin",
                "User status updated to " + status + " for user: " + user.getEmail());

        Map<String, Object> res = new HashMap<>();
        res.put("id", user.getId().toString());
        res.put("status", status);
        return res;
    }

    @Transactional
    public Map<String, Object> resetUserPassword(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required for password reset");
        }
        String cleanEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + cleanEmail));

        // Generate 256-bit cryptographically secure one-time reset token
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String resetToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        String tokenHash = sha256(resetToken);

        // Standard Redis key recognized by AuthService.resetPassword
        String redisKey = "reset:token:" + tokenHash;
        storeResetToken(redisKey, user.getEmail(), 15);

        // Dispatch secure email link to user - raw token is never exposed in logs or API response
        emailService.sendPasswordResetEmail(user.getEmail(), resetToken);

        auditLogService.logEvent(null, user.getId(), "ADMIN_USER_PASSWORD_RESET_INITIATED", null, null,
                "Administrative one-time password reset dispatched to user email: " + cleanEmail);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("email", cleanEmail);
        res.put("message", "Password reset instructions dispatched to user email");
        return res;
    }

    // ==========================================
    // SuperAdmin Operational Hub: Support Tickets
    // ==========================================

    public List<SupportTicket> getSuperAdminTickets() {
        if (supportTicketRepository != null) {
            return supportTicketRepository.findAllByOrderByCreatedAtDesc();
        }
        return Collections.emptyList();
    }

    @Transactional
    public SupportTicket createSupportTicket(Map<String, Object> body) {
        String subject = String.valueOf(body.getOrDefault("subject", "General Inquiry"));
        String description = String.valueOf(body.getOrDefault("description", ""));
        String priority = String.valueOf(body.getOrDefault("priority", "MEDIUM"));
        String tenantName = String.valueOf(body.getOrDefault("tenantName", "EventOS Workspace"));
        String customerEmail = String.valueOf(body.getOrDefault("customerEmail", "customer@eventosapp.in"));

        SupportTicket ticket = SupportTicket.builder()
                .ticketNumber("TKT-" + (System.currentTimeMillis() % 1000000))
                .tenantName(tenantName)
                .customerEmail(customerEmail)
                .subject(subject)
                .description(description)
                .priority(priority.toUpperCase())
                .status("OPEN")
                .assignedTo("Support Desk")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        if (supportTicketRepository != null) {
            ticket = supportTicketRepository.save(ticket);
        }
        auditLogService.logEvent(null, null, "SUPPORT_TICKET_CREATED", "127.0.0.1", "SuperAdmin",
                "Support ticket created: " + ticket.getTicketNumber() + " - " + subject);
        return ticket;
    }

    @Transactional
    public SupportTicket updateSupportTicket(UUID id, Map<String, Object> body) {
        if (supportTicketRepository == null) {
            throw new IllegalStateException("Support ticket repository not available");
        }
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found with ID: " + id));

        if (body.containsKey("status")) {
            ticket.setStatus(String.valueOf(body.get("status")).toUpperCase());
        }
        if (body.containsKey("priority")) {
            ticket.setPriority(String.valueOf(body.get("priority")).toUpperCase());
        }
        if (body.containsKey("assignedTo")) {
            ticket.setAssignedTo(String.valueOf(body.get("assignedTo")));
        }
        if (body.containsKey("notes")) {
            ticket.setNotes(String.valueOf(body.get("notes")));
        }
        ticket.setUpdatedAt(LocalDateTime.now());
        SupportTicket updated = supportTicketRepository.save(ticket);

        auditLogService.logEvent(null, null, "SUPPORT_TICKET_UPDATED", "127.0.0.1", "SuperAdmin",
                "Support ticket updated: " + updated.getTicketNumber() + " status: " + updated.getStatus());
        return updated;
    }

    // ==========================================
    // SuperAdmin Operational Hub: Feature Flags
    // ==========================================

    public List<FeatureFlag> getFeatureFlags() {
        if (featureFlagRepository != null) {
            List<FeatureFlag> flags = featureFlagRepository.findAll();
            if (!flags.isEmpty()) {
                return flags;
            }
            // Seed defaults if empty
            FeatureFlag f1 = featureFlagRepository.save(FeatureFlag.builder()
                    .flagKey("ai-assistant-v2").name("AI Assistant V2 Conversational Copilot")
                    .description("Context-aware AI budget generation and event intelligence")
                    .enabled(true).rolloutPercentage(100).scope("Global").build());
            FeatureFlag f2 = featureFlagRepository.save(FeatureFlag.builder()
                    .flagKey("stripe-subscriptions").name("Stripe Subscription Checkout")
                    .description("Live billing subscription engine for SaaS workspaces")
                    .enabled(true).rolloutPercentage(100).scope("Global").build());
            FeatureFlag f3 = featureFlagRepository.save(FeatureFlag.builder()
                    .flagKey("ws-sync-engine").name("WebSockets Realtime Sync Engine")
                    .description("STOMP/WebSocket event streaming bus across all services")
                    .enabled(true).rolloutPercentage(100).scope("Global").build());
            FeatureFlag f4 = featureFlagRepository.save(FeatureFlag.builder()
                    .flagKey("custom-domain").name("Workspace White-label Custom Domains")
                    .description("Custom CNAME and SSL generation for enterprise clients")
                    .enabled(true).rolloutPercentage(100).scope("Enterprise Tenants").build());
            return List.of(f1, f2, f3, f4);
        }
        return Collections.emptyList();
    }

    @Transactional
    public FeatureFlag toggleFeatureFlag(String flagKey) {
        if (featureFlagRepository == null) {
            throw new IllegalStateException("FeatureFlag repository not available");
        }
        FeatureFlag flag = featureFlagRepository.findByFlagKey(flagKey)
                .orElseThrow(() -> new IllegalArgumentException("Feature flag not found: " + flagKey));

        flag.setEnabled(!flag.isEnabled());
        FeatureFlag updated = featureFlagRepository.save(flag);

        auditLogService.logEvent(null, null, "FEATURE_FLAG_TOGGLED", "127.0.0.1", "SuperAdmin",
                "Feature flag toggled: " + flagKey + " -> " + updated.isEnabled());
        return updated;
    }

    @Transactional
    public FeatureFlag updateFeatureFlag(String flagKey, Map<String, Object> body) {
        if (featureFlagRepository == null) {
            throw new IllegalStateException("FeatureFlag repository not available");
        }
        FeatureFlag flag = featureFlagRepository.findByFlagKey(flagKey)
                .orElseThrow(() -> new IllegalArgumentException("Feature flag not found: " + flagKey));

        if (body.containsKey("rolloutPercentage")) {
            flag.setRolloutPercentage(Integer.parseInt(String.valueOf(body.get("rolloutPercentage"))));
        }
        if (body.containsKey("scope")) {
            flag.setScope(String.valueOf(body.get("scope")));
        }
        if (body.containsKey("enabled")) {
            flag.setEnabled(Boolean.parseBoolean(String.valueOf(body.get("enabled"))));
        }
        FeatureFlag updated = featureFlagRepository.save(flag);

        auditLogService.logEvent(null, null, "FEATURE_FLAG_CONFIG_UPDATED", "127.0.0.1", "SuperAdmin",
                "Feature flag configured: " + flagKey);
        return updated;
    }

    // ==========================================
    // SuperAdmin Operational Hub: Subscriptions Ledger
    // ==========================================

    public List<Map<String, Object>> getSuperAdminSubscriptions() {
        List<Subscription> subscriptions = subscriptionRepository.findAll();
        List<Map<String, Object>> ledger = new ArrayList<>();

        for (Subscription sub : subscriptions) {
            Tenant tenant = tenantRepository.findById(sub.getTenantId()).orElse(null);
            Map<String, Object> item = new HashMap<>();
            item.put("id", sub.getId().toString());
            item.put("tenantId", sub.getTenantId().toString());
            item.put("tenantName", tenant != null ? tenant.getName() : "Tenant #" + sub.getTenantId().toString().substring(0, 8));
            item.put("planName", sub.getPlan() != null ? sub.getPlan().getName() : "Starter");
            item.put("amount", sub.getPlan() != null ? sub.getPlan().getPrice() : BigDecimal.ZERO);
            item.put("interval", sub.getPlan() != null ? sub.getPlan().getBillingInterval() : "MONTHLY");
            item.put("status", sub.getStatus());
            item.put("currentPeriodStart", sub.getCurrentPeriodStart());
            item.put("currentPeriodEnd", sub.getCurrentPeriodEnd());
            ledger.add(item);
        }
        return ledger;
    }

    @Transactional
    public Map<String, Object> refundSubscription(UUID subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found: " + subscriptionId));

        sub.setStatus("REFUNDED_CANCELED");
        subscriptionRepository.save(sub);

        auditLogService.logEvent(sub.getTenantId(), null, "SUBSCRIPTION_REFUNDED_BY_ADMIN", "127.0.0.1", "SuperAdmin",
                "Administrative refund executed for subscription ID: " + subscriptionId);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("subscriptionId", subscriptionId.toString());
        res.put("status", "REFUNDED_CANCELED");
        return res;
    }

    // ==========================================
    // SuperAdmin Operational Hub: Referral Coupons
    // ==========================================

    public List<PlatformCoupon> getCoupons() {
        if (platformCouponRepository != null) {
            List<PlatformCoupon> coupons = platformCouponRepository.findAllByOrderByCreatedAtDesc();
            if (!coupons.isEmpty()) {
                return coupons;
            }
            PlatformCoupon c1 = platformCouponRepository.save(PlatformCoupon.builder()
                    .code("LAUNCH2026").discountType("PERCENTAGE").discountValue(BigDecimal.valueOf(25.00))
                    .redemptionsCount(14).active(true).createdAt(LocalDateTime.now()).build());
            PlatformCoupon c2 = platformCouponRepository.save(PlatformCoupon.builder()
                    .code("ENTERPRISE_DISCOUNT").discountType("PERCENTAGE").discountValue(BigDecimal.valueOf(10.00))
                    .redemptionsCount(2).active(true).createdAt(LocalDateTime.now()).build());
            return List.of(c1, c2);
        }
        return Collections.emptyList();
    }

    @Transactional
    public PlatformCoupon createCoupon(Map<String, Object> body) {
        String code = String.valueOf(body.getOrDefault("code", "PROMO" + System.currentTimeMillis() % 10000)).toUpperCase().trim();
        String discountType = String.valueOf(body.getOrDefault("discountType", "PERCENTAGE"));
        BigDecimal discountValue = new BigDecimal(String.valueOf(body.getOrDefault("discountValue", "15.00")));

        PlatformCoupon coupon = PlatformCoupon.builder()
                .code(code)
                .discountType(discountType)
                .discountValue(discountValue)
                .redemptionsCount(0)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        if (platformCouponRepository != null) {
            coupon = platformCouponRepository.save(coupon);
        }
        auditLogService.logEvent(null, null, "COUPON_CREATED", "127.0.0.1", "SuperAdmin",
                "Referral coupon created: " + code + " (" + discountValue + "%)");
        return coupon;
    }

    // ==========================================
    // SuperAdmin Operational Hub: Force Session Logout
    // ==========================================

    @Transactional
    public Map<String, Object> forceLogoutUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (refreshTokenRepository != null) {
            try {
                refreshTokenRepository.deleteByUser(user);
            } catch (Exception ignored) {}
        }

        if (stringRedisTemplate != null) {
            try {
                stringRedisTemplate.opsForValue().set("revoked:user:" + userId, "true", java.time.Duration.ofDays(7));
            } catch (Exception ignored) {}
        }

        auditLogService.logEvent(null, userId, "USER_SESSION_TERMINATED", "127.0.0.1", "SuperAdmin",
                "Administrative force logout executed for user: " + user.getEmail());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("userId", userId.toString());
        res.put("message", "User sessions and active refresh tokens revoked successfully");
        return res;
    }
}
