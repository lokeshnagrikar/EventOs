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

    private final BillingService billingService;

    @org.springframework.beans.factory.annotation.Value("${app.stripe.api-key:}")
    private String stripeApiKey;

    @org.springframework.beans.factory.annotation.Value("${app.stripe.webhook-secret:}")
    private String stripeWebhookSecret;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
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

    @PostMapping("/subscription/upgrade")
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
            if ("growth".equalsIgnoreCase(planCode)) {
                priceId = System.getenv().getOrDefault("STRIPE_PRICE_GROWTH", "price_growth_monthly");
            } else if ("enterprise".equalsIgnoreCase(planCode)) {
                priceId = System.getenv().getOrDefault("STRIPE_PRICE_ENTERPRISE", "price_enterprise_monthly");
            } else {
                priceId = System.getenv().getOrDefault("STRIPE_PRICE_STANDARD", "price_standard_monthly");
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
                    System.out.println(
                            "[STRIPE WEBHOOK] Successfully upgraded Tenant " + tenantIdStr + " to plan " + planCode);
                }
            }

            return ResponseEntity.ok("Webhook Handled Successfully");
        } catch (com.stripe.exception.SignatureVerificationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature Verification Failed");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook Error: " + e.getMessage());
        }
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
