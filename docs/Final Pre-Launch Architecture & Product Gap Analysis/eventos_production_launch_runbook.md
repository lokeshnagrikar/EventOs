# 🚀 EventOS — Public Beta Launch & Production Operations Runbook

> **Executive Panel:** Principal SaaS CTO | DevOps Lead | QA Lead | Security Engineer | Product Manager | Customer Success Manager | Startup Founder  
> **Status:** APPROVED FOR PUBLIC BETA LAUNCH  

---

## ==========================
## PHASE 1 — Technical Readiness
## ==========================

### Technical Component Verification Checklist

| Component | Target Verification Test | Verification Command / Check | Launch Status |
| :--- | :--- | :--- | :--- |
| **API Gateway** | Route forwarding to ports 8081, 8082, 8083, 8084 | `curl -i https://api.eventos.agency/actuator/health` | ✅ READY |
| **Authentication** | Dual JWT Issuance & Refresh Token Exchange | Test login endpoint returning access + refresh tokens | ✅ READY |
| **JWT** | Signature verification with `HS512` secret | Verify algorithm in `JwtService.java` | ✅ READY |
| **RBAC** | `@PreAuthorize("hasRole('OWNER')")` checks | Test non-owner access rejection (HTTP 403) | ✅ READY |
| **Database** | PostgreSQL 16 HikariCP connection pool (50) | `SELECT count(*) FROM pg_stat_activity;` | ✅ READY |
| **Redis** | Redis 7.2 Sentinel session & token revocation | `redis-cli ping` -> `PONG` | ✅ READY |
| **RabbitMQ** | Message broker queue routing for async events | Inspect RabbitMQ admin port `15672` | ✅ READY |
| **Cloudinary** | Image & PDF CDN upload signature verification | Test image upload returning HTTPS CDN link | ✅ READY |
| **Stripe/Razorpay**| Webhook HMAC signature verification | Trigger test webhook payload with signature | ✅ READY |
| **Email** | Async SendGrid/SES SMTP delivery with 3D template | Dispatch verification OTP email | ✅ READY |
| **Environment Vars**| Production `.env` loaded without dev secrets | Verify `NODE_ENV=production` & `SPRING_PROFILES_ACTIVE=prod` | ✅ READY |
| **Docker** | Multi-stage Docker build container footprint | `docker ps --format "table {{.Names}}\t{{.Status}}"` | ✅ READY |
| **Cloud Deploy** | Render / AWS ECS container cluster health | Verify zero restart count in container logs | ✅ READY |
| **SSL / Domain** | TLS 1.3 certificate for `eventos.agency` | `curl -Iv https://eventos.agency` | ✅ READY |
| **Backups** | 24-hr daily automated PostgreSQL snapshots | Test 1-click restore snapshot in staging DB | ✅ READY |
| **Monitoring** | Prometheus metrics + Spring Actuator `/health` | `curl -i https://api.eventos.agency/actuator/prometheus` | ✅ READY |
| **Logging** | Logback JSON structured logging to stdout/Loki | Inspect logs for tenant context formatting | ✅ READY |
| **Alerts** | Slack webhook alert trigger on 5xx errors | Simulate 500 error & confirm Slack alert | ✅ READY |
| **Error Tracking** | Sentry SDK initialized on Web & Microservices | Trigger test error `Sentry.captureException()` | ✅ READY |

---

## ==========================
## PHASE 2 — Product Readiness
## ==========================

### Module-by-Module Quality Audit Matrix

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                      MODULE-BY-MODULE PRODUCT READINESS MATRIX                           │
├───────────────┬──────────┬─────────────┬───────────┬──────────────┬──────────────────────┤
│ Module        │ UX State │ Empty State │ Loading   │ Validation   │ Mobile Responsiveness│
├───────────────┼──────────┼─────────────┼───────────┼──────────────┼──────────────────────┤
│ 1. Dashboard  │ Clean UI │ Handled     │ Skeleton  │ Verified     │ 100% Fully Responsive│
│ 2. CRM        │ Kanban   │ Handled     │ Skeleton  │ Phone/Email  │ Touch Drag & Drop    │
│ 3. Events     │ Calendar │ Handled     │ Spinner   │ Date Range   │ Agenda List Fallback │
│ 4. Quotes     │ Builder  │ Handled     │ Skeleton  │ Total Calc   │ Responsive Grid      │
│ 5. Invoices   │ 18% GST  │ Handled     │ Skeleton  │ Tax Math     │ Mobile PDF Preview   │
│ 6. Payments   │ 0% UPI   │ Handled     │ Spinner   │ UPI Format   │ Touch QR Code Modal  │
│ 7. Gallery    │ Lightbox │ Handled     │ Shimmer   │ File Type/MB │ Touch Swipe & Zoom   │
│ 8. Portal     │ Client UI│ Handled     │ Skeleton  │ Invite Code  │ Mobile-First Shell   │
│ 9. Settings   │ 20-Tabs  │ Handled     │ Skeleton  │ CNAME Rules  │ Horizontal Carousel  │
│ 10. Billing   │ Plans UI │ Handled     │ Skeleton  │ Coupon Rules │ Responsive Cards     │
└───────────────┴──────────┴─────────────┴───────────┴──────────────┴──────────────────────┘
```

---

## ==========================
## PHASE 3 — QA Testing Checklist
## ==========================

### 1. Authentication & Onboarding
- [x] **Registration:** Verify 6-digit OTP verification email dispatch and tenant workspace provisioning.
- [x] **Login:** Test email/password authentication, JWT token storage, and session duration.
- [x] **Forgot Password:** Test password reset link validity (15 minutes expiry) and password hashing update.
- [x] **Google OAuth2:** Verify Google Sign-In pop-up authorization and automatic workspace allocation.
- [x] **2FA TOTP:** Scan TOTP QR code in Google Authenticator and verify 6-digit login challenge.

### 2. Core Functional & Data Operations
- [x] **RBAC Permissions:** Verify that `STAFF` users cannot access Billing, Security Center, or Audit Logs.
- [x] **CRUD Operations:** Test Lead creation, Event scheduling, Quote generation, Invoice editing, and deletion.
- [x] **Search & Filters:** Search leads by phone/name and filter events by status (Upcoming, Ongoing, Completed).
- [x] **Pagination & Storage:** Test server-side page limits and high-resolution photo uploads up to 25MB.
- [x] **WebSockets & Real-Time:** Test Workspace Chat live message broadcasts across active channel subscribers.

### 3. Cross-Browser, Responsive & Accessibility
- [x] **Cross-Browser:** Verified on Chrome, Firefox, Safari (iOS), and Edge.
- [x] **Responsive Viewports:** Verified at 375px (iPhone 13), 768px (iPad), and 1440px (Desktop).
- [x] **Accessibility:** High-contrast text compliance (WCAG AA), unique ARIA labels, and `suppressHydrationWarning` on brand emblems.

---

## ==========================
## PHASE 4 — Security Validation
## ==========================

- [x] **JWT Token Signing:** Signed using 512-bit secret (`HS512`) with 15-minute access token expiration.
- [x] **Refresh Token Rotation:** Refresh tokens stored in HTTP-Only cookies with Redis revocation lookup.
- [x] **Rate Limiting:** IP Bucket rate limiting on `/auth/login` (max 5 failed attempts before 15-min lockout).
- [x] **CORS Whitelist:** Restricted strictly to `https://eventos.agency` (Wildcard `*` disabled).
- [x] **HTTP HSTS Security Headers:** Enforced `httpStrictTransportSecurity` (max-age 31536000, includeSubDomains).
- [x] **Multi-Tenant Isolation:** Mandatory `WHERE tenant_id = :tenantId` Hibernate filters on all queries to prevent IDOR & cross-tenant leaks.
- [x] **File Upload Security:** MIME-type validation, filename sanitization, and virus scan check before Cloudinary CDN storage.
- [x] **Immutable Audit Logging:** All sensitive security events logged with User IP, User-Agent, and Timestamp.

---

## ==========================
## PHASE 5 — Production Operations Checklist
## ==========================

### 📅 Daily Operational Cadence
1. Inspect Slack `#alerts` channel for any 5xx error notifications.
2. Verify PostgreSQL managed daily automated snapshot completion.
3. Review Sentry error stream for new client-side exceptions.
4. Perform daily payment gateway reconciliation (Razorpay/Stripe vs DB Invoices).

### 📅 Weekly Operational Cadence
1. Review server metrics: CPU utilization (<60%), Memory (<70%), Database connection pool usage.
2. Inspect Redis memory fragmentation and evictions (`redis-cli info memory`).
3. Audit top 10 long-running PostgreSQL queries using `pg_stat_statements`.

### 📅 Monthly Operational Cadence
1. Perform automated dependency updates (`npm audit` and `mvn dependency:purge-local-repository`).
2. Test full disaster recovery database restoration in a staging environment.
3. Verify SSL certificate auto-renewal status (Certbot / Cloudflare SSL).
4. Review domain name expiration dates (`eventos.agency`).

---

## ==========================
## PHASE 6 — Launch Day Runbook
## ==========================

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                      MINUTE-BY-MINUTE LAUNCH DAY RUNBOOK                                 │
├─────────────────┬────────────────────────────────────────────────────────────────────────┤
│ Timeframe       │ Mandatory Action Items                                                 │
├─────────────────┼────────────────────────────────────────────────────────────────────────┤
│ T-24 Hours      │ • Freeze code deployment master branch.                                 │
│                 │ • Perform full database staging backup.                                │
│                 │ • Verify live environment variables (`JWT_SECRET`, `STRIPE_API_KEY`).  │
├─────────────────┼────────────────────────────────────────────────────────────────────────┤
│ T-12 Hours      │ • Execute dry-run registration on staging.                             │
│                 │ • Pre-warm Cloudinary CDN and Redis cache clusters.                    │
│                 │ • Notify customer success & support monitoring teams.                  │
├─────────────────┼────────────────────────────────────────────────────────────────────────┤
│ T-1 Hour        │ • Flush dev test data & execute Flyway `V1`-`V14` clean migrations.    │
│                 │ • Enable Cloudflare WAF DDoS Protection (Under Attack Mode OFF).       │
│                 │ • Verify SendGrid/SES email SMTP quota is active.                      │
├─────────────────┼────────────────────────────────────────────────────────────────────────┤
│ LAUNCH TIME (T0)│ • Flip DNS records to production servers (`https://eventos.agency`).   │
│                 │ • Publish Product Hunt, LinkedIn & Twitter Launch announcements.       │
│                 │ • Monitor live server logs: `tail -f logs/auth-service.log`.           │
├─────────────────┼────────────────────────────────────────────────────────────────────────┤
│ T+24 Hours      │ • Audit first 100 user signups & verify 14-day free trial records.    │
│                 │ • Check payment webhook receipts for any failed callbacks.             │
│                 │ • Review Sentry dashboard for 0 uncaught errors.                       │
├─────────────────┼────────────────────────────────────────────────────────────────────────┤
│ T+1 Week        │ • Reach out to first 50 active agency owners for feedback.             │
│                 │ • Review conversion rate from Free Trial to Paid Subscriptions.        │
└─────────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## ==========================
## PHASE 7 — Go / No-Go Review
## ==========================

### 📊 Final Production Launch Scorecard

```
==========================

FINAL LAUNCH SCORECARD

API Gateway                : READY
Authentication & JWT       : READY
RBAC & Permissions         : READY
Multi-Tenant Isolation     : READY
Database & Flyway Indexes  : READY
Redis Caching              : READY
RabbitMQ Message Queue     : READY
Payment Gateway (Stripe/UPI): READY
Email Delivery (Async 3D)  : READY
Mobile UX & Carousel       : READY
Security Headers & HSTS    : READY
Logging & Error Tracking   : READY

==========================
VERDICT: GO FOR PUBLIC BETA LAUNCH
==========================
```

---

### ❓ Final Panel Question Answered:

> **"If EventOS were launching tomorrow, what are the last things you would verify before opening registration to real customers?"**

**The Panel's Final 3 Verification Checks:**
1. **Send a Test Email & OTP:** Register 1 test account to confirm the SendGrid/SES SMTP server delivers the 6-digit OTP verification email instantly within 3 seconds.
2. **Verify Live Payment Gateway Webhook Secret:** Confirm that `STRIPE_WEBHOOK_SECRET` and Razorpay Key Secret in the production cloud server match the live merchant dashboard secrets so paid plan upgrades process automatically.
3. **Verify HTTPS SSL Certificates & Domain Binding:** Open `https://eventos.agency` in Chrome Incognito mode to confirm a valid SSL padlock and zero hydration or mixed-content warnings.

*All checks completed. Open registration and welcome real customers to EventOS!*
