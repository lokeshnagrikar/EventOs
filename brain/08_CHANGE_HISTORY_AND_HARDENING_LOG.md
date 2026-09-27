# 📜 Project Evolution History & Hardening Log

> **Chronological record of key architectural milestones, SRE hardening sessions, bug fixes, and feature implementations.**

---

## 1. Milestone Timeline

```
[ Inception ] ──► [ Core Microservices ] ──► [ Security & Multi-Tenancy ]
        │                       │                             │
        ▼                       ▼                             ▼
Mono-repo layout        Spring Cloud Gateway,         RSA256 JWT signing,
Docker Compose dev      Auth, CRM, Events, Gallery    TenantContext, BCrypt
        │                       │                             │
        ▼                       ▼                             ▼
[ Event Bus & WS ] ──► [ Database Hardening ] ──► [ Resend & Mobile Polish ]
        │                       │                             │
        ▼                       ▼                             ▼
RabbitMQ topic bus      Flyway V1 - V34               3D HTML email templates,
STOMP live presence     PostgreSQL 17 alignment       100svh mobile drawer fix
```

---

## 2. Detailed Engineering Milestones

### Phase 1: Foundation & Microservices Infrastructure
* Provisioned multi-container Docker development environment (`docker-compose.yml`) containing PostgreSQL 17, Redis 7.2, RabbitMQ 3.13, and 5 Spring Boot microservices.
* Configured `api-gateway` (Port 8080) with dynamic route predicates and global CORS policies.

### Phase 2: Multi-Tenancy & Cryptographic Security
* Established tenant isolation architecture with `tenant_id` foreign keys across all database tables.
* Implemented asymmetric RSA256 JWT token generation using `jwt_private.pem` and `jwt_public.pem`.
* Built multi-workspace tenant switching with immediate context refresh (`/api/v1/auth/switch-workspace`).

### Phase 3: Lead CRM & Interactive Proposals
* Created the CRM pipeline with drag-and-drop Kanban lead stages.
* Built the interactive proposal and quote calculator with live PDF generation and client digital acceptance.

### Phase 4: Event Logistics & Cloudinary Proofing Engine
* Built the run-of-show timeline cue sheet coordinator in `event-service`.
* Integrated Cloudinary in `gallery-service` for automatic dynamic watermark overlays on unpaid client photo galleries.
* Connected RabbitMQ consumer to remove watermarks automatically upon invoice payment confirmation.

### Phase 5: Database & Flyway Hardening
* Resolved migration conflicts across `auth_db`, `crm_db`, `event_db`, and `gallery_db`.
* Upgraded and standardized canonical pricing plans through `V34__standardize_canonical_pricing_plans.sql`.
* Fixed duplicate React key rendering issues in dashboard team list.

### Phase 6: Transactional Email Infrastructure (Resend SMTP Relay)
* Configured Resend SMTP relay (`smtp.resend.com:587`) using username `resend` and active API key in `.env`.
* Engineered 7 responsive, dark-mode 3D animated HTML email templates in [`EmailService.java`](file:///d:/EventOs/backend/auth-service/src/main/java/com/eventos/auth/service/EmailService.java) for verification OTPs, invitations, password resets, welcome notices, magic links, and billing receipts.
* Verified that Resend SMTP relay renders backend HTML directly without requiring dashboard templates.

### Phase 7: Mobile Navigation Responsiveness & Lenis Compatibility
* Diagnosed mobile navigation clipping where expanded `SOLUTIONS` and `RESOURCES` submenus could hide off-screen on small mobile viewports.
* Implemented `max-h-[calc(100svh-5.5rem)]` on the mobile menu drawer in [`Navbar.tsx`](file:///d:/EventOs/web/src/components/landing/Navbar.tsx) using **Small Viewport Height** (`100svh`) to prevent browser address bars from obscuring action buttons.
* Added `data-lenis-prevent`, `-webkit-overflow-scrolling: touch`, and `scrollbar-thin` to ensure fluid touch scrolling inside the drawer.

### Phase 8: SuperAdmin Console & Full Real Database Operational Controls
* Completely eradicated all static mock data arrays (`REVENUE_DATA`, `PLAN_DISTRIBUTION_DATA`, `INITIAL_LIVE_ACTIVITIES`, `INITIAL_SECURITY_LOGS`, `INITIAL_BLOCKED_IPS`) from [`superadmin/page.tsx`](file:///d:/EventOs/web/src/app/superadmin/page.tsx).
* Wired all 12 SuperAdmin Operational Controls to live PostgreSQL tables via backend endpoints:
  1. Global Metrics (Live MRR, total tenants, active users, subscription counts)
  2. Tenants Directory (Real tenant lifecycle, status toggle, tier overrides, impersonation)
  3. User Roster (Platform and workspace users, status locking, role elevation)
  4. Billing & Subscriptions (Ledger transactions, Stripe & Razorpay statuses, coupon codes)
  5. Platform Analytics (Tenant acquisition curves, plan distributions, cohort retention)
  6. Support Tickets Desk (Ticket resolution workflow, priority assignment)
  7. System Health & Telemetry (Postgres, Redis, JVM memory, RabbitMQ queue depths)
  8. Audit Log Trail (Live event stream with JPA Specification dynamic filtering)
  9. Feature Flags (Canary rollouts, percentage sliders, kill-switches)
  10. Platform Announcements (Global workspace broadcast banners)
  11. Security & WAF (Threat monitoring, IP blacklist/whitelist engine)
  12. Database Backups (Automated snapshot triggering via `BackupService`)
* Added custom responsive scrollbars, inspector drawer, and robust empty state components.

### Phase 9: Granular Platform Role-Based Access Control (RBAC) Hardening
* Upgraded backend [`BillingController.java`](file:///d:/EventOs/backend/auth-service/src/main/java/com/eventos/auth/controller/BillingController.java) with granular Spring Security `@PreAuthorize` method guards.
* Formalized 6 distinct platform superadmin roles:
  - `SUPER_ADMIN`: Root omni-access across all 12 operational controls and system settings.
  - `OPERATIONS_LEAD`: Tenant administration, user roster, announcements, and audit streams.
  - `SUPPORT_LEAD`: Support desk ticketing, safe password reset triggers, read-only diagnostics.
  - `FINANCE_OFFICER`: Subscriptions ledger, payment refunds, coupon management.
  - `DEVOPS_ENGINEER`: System health telemetry, database backup runs, feature flags rollout.
  - `COMPLIANCE_AUDITOR`: Read-only audit trail inspection, CSV exports, telemetry metrics.
* Hardened Next.js Edge Middleware ([`middleware.ts`](file:///d:/EventOs/web/src/middleware.ts)) to cryptographically verify HMAC signatures of JWT tokens for all `/superadmin/*` routes, preventing client-side spoofing.

### Phase 10: Multi-Gateway Billing Integration (Razorpay & Stripe)
* Integrated Razorpay Payment Gateway for Indian domestic payments supporting UPI, RuPay/Visa/Mastercard cards, and NetBanking in INR.
* Implemented automatic currency and region detection, dynamic checkout SDK modal loading, and payment signature verification.
* Hardened Stripe subscription checkout with instant return session validation and metadata fallback.
* Rendered subscription pricing plans via responsive React Portal modals with mobile viewports.
* Standardized legal compliance clauses on Terms, Privacy, and Cancellation policies (5-7 business days refund turnaround).

### Phase 11: Public Lead Inquiries & Founder Notification Automation
* Whitelisted `/api/v1/auth/inquiries` public endpoint in [`SecurityConfig.java`](file:///d:/EventOs/backend/auth-service/src/main/java/com/eventos/auth/config/SecurityConfig.java).
* Connected landing page Contact form, exit-intent modal, blog newsletter, and demo booking forms to backend inquiries API.
* Implemented automated HTML email dispatch via Resend SMTP informing founders instantly upon new lead submission.

### Phase 12: Production Cloudflare & VPS DNS/Email Architecture
* Migrated `eventosapp.in` nameservers to Cloudflare for global DDoS mitigation, fast Anycast DNS, and universal SSL.
* Routed backend traffic `api.eventosapp.in` directly to VPS `200.234.47.154` with DNS-Only (Grey Cloud) configuration.
* Configured Cloudflare Email Routing for inbound mailboxes (`admin@eventosapp.in`, `support@eventosapp.in`) forwarding directly into founder's personal Gmail inbox.
* Preserved Resend SMTP outbound sending architecture (`send.eventosapp.in` MX/DKIM records) with zero conflict.
