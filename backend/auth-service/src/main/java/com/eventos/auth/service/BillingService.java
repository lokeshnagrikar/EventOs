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
        metrics.put("ltv", activeCount > 0 ? mrr.divide(new BigDecimal(activeCount), 2, BigDecimal.ROUND_HALF_UP).multiply(new BigDecimal("31.25")) : BigDecimal.ZERO); // Mock count conversion to LTV
        
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

        return jwtService.generateToken(
                user,
                tenantId,
                target.getRole() != null ? target.getRole().getName() : "STAFF",
                permissions,
                tenant.getName(),
                tenantId,
                "Impersonated-Session",
                UUID.randomUUID().toString(),
                true // impersonated = true
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
            planDistribution.add(Map.of("name", "Enterprise", "value", 45, "color", "#a855f7"));
            planDistribution.add(Map.of("name", "Professional", "value", 35, "color", "#ec4899"));
            planDistribution.add(Map.of("name", "Starter", "value", 15, "color", "#3b82f6"));
            planDistribution.add(Map.of("name", "Free Trial", "value", 5, "color", "#10b981"));
        }

        data.put("planDistribution", planDistribution);
        data.put("netChurnRate", "1.8%");
        data.put("activationCohortRate", "94.2%");
        data.put("expansionRevenueIndex", "+$18,400 / mo");
        return data;
    }

    public List<Map<String, Object>> getAnnouncements() {
        if (announcementStorage.isEmpty()) {
            Map<String, Object> defaultAnn = new HashMap<>();
            defaultAnn.put("id", "ann-1");
            defaultAnn.put("title", "Q3 Core Database Maintenance");
            defaultAnn.put("body", "Scheduled maintenance window on Sunday 02:00 AM UTC.");
            defaultAnn.put("target", "ALL");
            defaultAnn.put("sentAt", "Yesterday 08:00 PM");
            defaultAnn.put("reach", "142 Workspaces");
            defaultAnn.put("author", "super_admin@eventos.co");
            defaultAnn.put("status", "DELIVERED");
            announcementStorage.add(defaultAnn);
        }
        return new ArrayList<>(announcementStorage);
    }

    public Map<String, Object> createAnnouncement(Map<String, String> body) {
        Map<String, Object> ann = new HashMap<>();
        ann.put("id", "ann-" + UUID.randomUUID().toString().substring(0, 8));
        ann.put("title", body.getOrDefault("title", "System Broadcast"));
        ann.put("body", body.getOrDefault("body", "Notice content"));
        ann.put("target", body.getOrDefault("target", "ALL"));
        ann.put("sentAt", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        ann.put("reach", tenantRepository.count() + " Workspaces");
        ann.put("author", "super_admin@eventos.co");
        ann.put("status", "DELIVERED");

        announcementStorage.add(0, ann);
        auditLogService.logEvent(null, null, "ANNOUNCEMENT_BROADCAST", "127.0.0.1", "SuperAdmin", "Broadcast sent: " + ann.get("title"));
        return ann;
    }

    public List<Map<String, Object>> getBlacklistedIps() {
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

    public Map<String, Object> addBlacklistIp(Map<String, String> body) {
        Map<String, Object> ipEntry = new HashMap<>();
        ipEntry.put("id", "b-" + UUID.randomUUID().toString().substring(0, 8));
        ipEntry.put("ip", body.getOrDefault("ip", "0.0.0.0"));
        ipEntry.put("reason", body.getOrDefault("reason", "Manual WAF Blacklist"));
        ipEntry.put("blockedAt", LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        ipEntry.put("threatLevel", "High");

        blacklistedIpStorage.add(0, ipEntry);
        auditLogService.logEvent(null, null, "SECURITY_WAF_BLACK_IP", "127.0.0.1", "SuperAdmin", "Blacklisted IP: " + ipEntry.get("ip"));
        return ipEntry;
    }

    public void removeBlacklistIp(String ip) {
        blacklistedIpStorage.removeIf(item -> ip.equalsIgnoreCase(String.valueOf(item.get("ip"))));
        auditLogService.logEvent(null, null, "SECURITY_WAF_UNBLACK_IP", "127.0.0.1", "SuperAdmin", "Unblacklisted IP: " + ip);
    }
}
