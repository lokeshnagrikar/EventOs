package com.eventos.auth.controller;

import com.eventos.auth.entity.*;
import com.eventos.auth.service.BillingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/billing")
public class BillingController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BillingController.class);

    private final BillingService billingService;
    private final com.eventos.auth.repository.AuditLogRepository auditLogRepository;
    private final org.springframework.data.redis.core.StringRedisTemplate stringRedisTemplate;

    @org.springframework.beans.factory.annotation.Value("${app.stripe.api-key:}")
    private String stripeApiKey;

    @org.springframework.beans.factory.annotation.Value("${app.stripe.webhook-secret:}")
    private String stripeWebhookSecret;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public BillingController(BillingService billingService,
            com.eventos.auth.repository.AuditLogRepository auditLogRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) org.springframework.data.redis.core.StringRedisTemplate stringRedisTemplate) {
        this.billingService = billingService;
        this.auditLogRepository = auditLogRepository;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @GetMapping("/plans")
    public ResponseEntity<?> getPlans() {
        List<Plan> plans = billingService.getPlans();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", plans);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/subscription")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getSubscription(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Subscription subscription = billingService.getSubscription(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", subscription);
        return ResponseEntity.ok(response);
    }

    @PostMapping({ "/subscription/upgrade", "/subscription/checkout" })
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> upgradeSubscription(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        String planCode = body.get("planCode");
        if (planCode == null || planCode.isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "planCode parameter is missing");
        }
        Subscription updated = billingService.upgradeSubscription(tenantId, planCode);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/subscription/cancel")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> cancelSubscription(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Subscription cancelled = billingService.cancelSubscription(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", cancelled);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/subscription/pause")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> pauseSubscription(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Subscription paused = billingService.pauseSubscription(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", paused);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/subscription/reactivate")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> reactivateSubscription(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        Subscription reactivated = billingService.reactivateSubscription(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", reactivated);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/usage")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getUsage(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        TenantUsage usage = billingService.getUsage(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", usage);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/usage/increment")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> incrementUsage(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        String metric = (String) body.get("metric");
        Integer amount = (Integer) body.get("amount");
        if (metric == null || amount == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "metric and amount parameters are missing");
        }
        TenantUsage updated = billingService.incrementUsage(tenantId, metric, amount);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> getInvoices(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        List<Invoice> invoices = billingService.getInvoices(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", invoices);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/payment-methods")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> getPaymentMethods(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        List<PaymentMethod> paymentMethods = billingService.getPaymentMethods(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", paymentMethods);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment-methods")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> addPaymentMethod(
            @RequestBody PaymentMethod pm,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        PaymentMethod saved = billingService.addPaymentMethod(tenantId, pm);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", saved);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/payment-methods/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> deletePaymentMethod(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        billingService.deletePaymentMethod(tenantId, id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment-methods/{id}/default")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> setDefaultPaymentMethod(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        billingService.setDefaultPaymentMethod(tenantId, id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/settings")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<?> getSettings(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        WorkspaceSettings settings = billingService.getWorkspaceSettings(tenantId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", settings);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updateSettings(
            @RequestBody WorkspaceSettings settings,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {
        UUID tenantId = getTenantId(tenantIdHeader);
        WorkspaceSettings updated = billingService.updateWorkspaceSettings(tenantId, settings);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    // Super Admin Dashboard Metrics API
    @GetMapping("/superadmin/dashboard")
    @PreAuthorize("hasRole('SUPER_ADMIN')") // Only Platform Superadmin can hit admin stats
    public ResponseEntity<?> getSuperAdminDashboard() {
        Map<String, Object> metrics = billingService.getSuperAdminDashboardMetrics();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", metrics);
        return ResponseEntity.ok(response);
    }

    // Super Admin Tenants List API
    @GetMapping("/superadmin/tenants")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getSuperAdminTenants() {
        List<Map<String, Object>> tenants = billingService.getSuperAdminTenants();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", tenants);
        return ResponseEntity.ok(response);
    }

    // Super Admin Users List API
    @GetMapping("/superadmin/users")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getSuperAdminUsers() {
        List<Map<String, Object>> users = billingService.getSuperAdminUsers();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", users);
        return ResponseEntity.ok(response);
    }

    // Super Admin Impersonate Tenant API
    @PostMapping("/superadmin/tenants/{id}/impersonate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> impersonateTenant(@PathVariable UUID id) {
        String token = billingService.impersonateTenant(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("accessToken", token);
        return ResponseEntity.ok(response);
    }

    // Super Admin Upgrade Tenant API
    @PostMapping("/superadmin/tenants/{id}/upgrade")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> forceUpgradeTenant(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String planCode = body.get("planCode");
        if (planCode == null || planCode.isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "planCode parameter is missing");
        }
        Subscription updated = billingService.upgradeSubscription(id, planCode);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    // Super Admin Cohort Analytics API
    @GetMapping("/superadmin/analytics/cohorts")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getCohortAnalytics() {
        Map<String, Object> data = billingService.getCohortAnalytics();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    // Super Admin Announcements API - GET
    @GetMapping("/superadmin/announcements")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getAnnouncements() {
        List<Map<String, Object>> list = billingService.getAnnouncements();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", list);
        return ResponseEntity.ok(response);
    }

    // Super Admin Announcements API - POST
    @PostMapping("/superadmin/announcements")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createAnnouncement(@RequestBody Map<String, String> body) {
        Map<String, Object> created = billingService.createAnnouncement(body);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", created);
        return ResponseEntity.ok(response);
    }

    // Super Admin Security Blacklist API - GET
    @GetMapping("/superadmin/security/blacklist")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getBlacklist() {
        List<Map<String, Object>> list = billingService.getBlacklistedIps();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", list);
        return ResponseEntity.ok(response);
    }

    // Super Admin Security Blacklist API - POST
    @PostMapping("/superadmin/security/blacklist")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> addBlacklistIp(@RequestBody Map<String, String> body) {
        Map<String, Object> created = billingService.addBlacklistIp(body);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", created);
        return ResponseEntity.ok(response);
    }

    // Super Admin Security Blacklist API - DELETE
    @DeleteMapping("/superadmin/security/blacklist/{ip}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> removeBlacklistIp(@PathVariable String ip) {
        billingService.removeBlacklistIp(ip);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "IP " + ip + " removed from blacklist");
        return ResponseEntity.ok(response);
    }

    // Super Admin Update Tenant Status API
    @PostMapping("/superadmin/tenants/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateTenantStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "ACTIVE");
        Map<String, Object> result = billingService.updateTenantStatus(id, status);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", result);
        return ResponseEntity.ok(response);
    }

    // Super Admin Update User Status API
    @PostMapping("/superadmin/users/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "ACTIVE");
        Map<String, Object> result = billingService.updateUserStatus(id, status);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", result);
        return ResponseEntity.ok(response);
    }

    // Super Admin Reset User Password API
    @PostMapping("/superadmin/users/reset-password")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> resetUserPassword(
            @RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Email is required");
        }
        Map<String, Object> result = billingService.resetUserPassword(email);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", result);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/subscription/checkout")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> createCheckoutSession(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader) {

        UUID tenantId = getTenantId(tenantIdHeader);
        String planCode = body.get("planCode");
        if (planCode == null || planCode.isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "planCode parameter is missing");
        }

        try {
            com.stripe.Stripe.apiKey = stripeApiKey;

            String priceId;
            if ("agency".equalsIgnoreCase(planCode) || "enterprise".equalsIgnoreCase(planCode)) {
                priceId = System.getenv().getOrDefault("STRIPE_PRICE_AGENCY",
                        System.getenv().getOrDefault("STRIPE_PRICE_ENTERPRISE", "price_agency_monthly"));
            } else if ("professional".equalsIgnoreCase(planCode) || "growth".equalsIgnoreCase(planCode)) {
                priceId = System.getenv().getOrDefault("STRIPE_PRICE_PROFESSIONAL",
                        System.getenv().getOrDefault("STRIPE_PRICE_GROWTH", "price_professional_monthly"));
            } else {
                priceId = System.getenv().getOrDefault("STRIPE_PRICE_STARTER",
                        System.getenv().getOrDefault("STRIPE_PRICE_STANDARD", "price_starter_monthly"));
            }

            com.stripe.param.checkout.SessionCreateParams params = com.stripe.param.checkout.SessionCreateParams
                    .builder()
                    .setMode(com.stripe.param.checkout.SessionCreateParams.Mode.SUBSCRIPTION)
                    .setSuccessUrl(frontendUrl + "/settings/billing?status=success&session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(frontendUrl + "/settings/billing?status=cancel")
                    .addLineItem(com.stripe.param.checkout.SessionCreateParams.LineItem.builder()
                            .setPrice(priceId)
                            .setQuantity(1L)
                            .build())
                    .putMetadata("tenantId", tenantId.toString())
                    .putMetadata("planCode", planCode)
                    .build();

            com.stripe.model.checkout.Session session = com.stripe.model.checkout.Session.create(params);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", Map.of("url", session.getUrl()));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Stripe Checkout initialization failed: " + e.getMessage(), e);
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        try {
            com.stripe.model.Event event = com.stripe.net.Webhook.constructEvent(
                    payload, sigHeader, stripeWebhookSecret);

            // Stripe Webhook Idempotency Check
            String eventId = event.getId();
            if (eventId != null && stringRedisTemplate != null) {
                String idempotencyKey = "webhook:stripe:" + eventId;
                Boolean isNew = stringRedisTemplate.opsForValue().setIfAbsent(idempotencyKey, "processed",
                        java.time.Duration.ofDays(7));
                if (Boolean.FALSE.equals(isNew)) {
                    log.info("[STRIPE WEBHOOK] Duplicate event ignored (already processed): {}", eventId);
                    return ResponseEntity.ok("Webhook already processed");
                }
            }

            if ("checkout.session.completed".equals(event.getType())) {
                com.stripe.model.checkout.Session session = (com.stripe.model.checkout.Session) event
                        .getDataObjectDeserializer()
                        .getObject()
                        .orElseThrow(() -> new IllegalArgumentException("Invalid Checkout Session webhook payload"));

                String tenantIdStr = session.getMetadata().get("tenantId");
                String planCode = session.getMetadata().get("planCode");

                if (tenantIdStr != null && planCode != null) {
                    UUID tenantId = UUID.fromString(tenantIdStr);
                    billingService.upgradeSubscription(tenantId, planCode);
                    log.info("[STRIPE WEBHOOK] Successfully upgraded Tenant {} to plan {}", tenantIdStr, planCode);
                }
            }

            return ResponseEntity.ok("Webhook Handled Successfully");
        } catch (com.stripe.exception.SignatureVerificationException e) {
            log.error("[STRIPE WEBHOOK] Signature Verification Failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature Verification Failed");
        } catch (Exception e) {
            log.error("[STRIPE WEBHOOK] Error processing webhook: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook Error: " + e.getMessage());
        }
    }

    // Super Admin platform logs API
    @GetMapping("/superadmin/logs")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getSuperAdminLogs() {
        List<AuditLog> logs = auditLogRepository.findAll();
        logs.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", logs);
        return ResponseEntity.ok(response);
    }

    private UUID getTenantId(String header) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof com.eventos.auth.config.UserPrincipal) {
            UUID tenantId = ((com.eventos.auth.config.UserPrincipal) auth.getPrincipal()).getTenantId();
            if (tenantId != null) {
                return tenantId;
            }
        }
        if (header != null && !header.isEmpty()) {
            return UUID.fromString(header);
        }
        throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Tenant ID context is missing");
    }
}
