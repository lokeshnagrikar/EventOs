# 🎪 EventOS — Pre-Launch Audit & Perfection Checklist

> Master Pre-Launch Verification Matrix & Production Readiness Audit.

---

## 🚨 1. CRITICAL (Must Fix Before Launch)

### Security & Data Protection
- [x] **SSL/TLS Configuration**
  - TLS 1.3 enforced via Render / Vercel Edge proxies.
  - Automatic Let's Encrypt SSL renewal configured on custom domain (`api.eventos.agency`).
  - HSTS headers & HTTPS redirect enabled in Next.js `middleware.ts` & Spring Cloud Gateway.
- [x] **Database Security**
  - Schema/Row-Level-Security (RLS) isolation (`WHERE tenant_id = :tenantId`) enforced across PostgreSQL 17 databases (`auth_db`, `crm_db`, `event_db`, `gallery_db`, `payment_db`).
  - Parameterized JPA / Hibernate queries preventing SQL injection.
  - BCrypt (`Strength 12`) password hashing enforced in `auth-service`.
- [x] **Authentication & Authorization**
  - Multi-tenant JWT authorization (RSA-256 signed access tokens with 15-min expiration & 7-day refresh tokens).
  - WhatsApp 6-digit OTP passwordless login option.
  - Role-Based Access Control (RBAC): `SUPER_ADMIN`, `AGENCY_OWNER`, `EVENT_MANAGER`, `VENDOR`, `CLIENT`.
  - Logout confirmation modal safeguard protecting against accidental sign-outs.
- [x] **API Security**
  - Rate limiting configured on Spring Cloud Gateway (Port 8080).
  - Webhook signature verification for Stripe & WhatsApp callbacks.
  - Strict CORS whitelist configuration (`CORS_ALLOWED_ORIGINS`).
- [x] **Secrets Management**
  - All hardcoded credentials removed from git history.
  - `.gitleaksignore` and `.gitignore` configured.
  - Environment variables master guide established (`docs/launch/env_variables_master_guide.md`).

### Compliance & Legal
- [x] **Terms, Privacy & Policy Pages**
  - Privacy Policy page (`/privacy`) with AI processing & Cloudinary disclosures.
  - Terms of Service page (`/terms`).
  - Refund & Cancellation Policy page (`/refund`).
  - Service Level Agreement (SLA) page (`/sla`).
  - Cookies Consent Policy page (`/cookies`).
- [x] **Payment Compliance**
  - Stripe tokenization (no raw credit card numbers stored on servers).
  - Dynamic UPI QR payment generator modal with VPA validation & 15-min countdown timer.
  - 18% GST tax calculation for Indian venue invoice compliance.

### Critical Features Verification
- [x] **Multi-Tenant Isolation**
  - 1-Second Workspace Switcher (`WorkspaceSelectorPill.tsx`) allowing instant tenant toggling.
  - Strict API tenant context verification (`X-Tenant-ID` header validation).
- [x] **Instant Quote & Proposal PDF Generator**
  - Interactive budget calculator (`/quote-calculator`) with guest count sliders (50 to 5,000 guests).
  - 1-Click Client Proposal PDF compiler (`/quotes`).
- [x] **CRM & Operations Stage Manager**
  - Drag-and-drop Kanban lead pipeline (`/crm`).
  - Run-of-Show stage cue sheet timelines (`/events`).
- [x] **Media & Photo Booth Gallery**
  - High-res photo booth uploads synced with Cloudinary CDN (`/gallery`).

---

## 🔴 2. HIGH PRIORITY (Fix Before Launch)

### Performance & Scalability
- [x] **Backend JVM Tuning**
  - Heap memory capped at `-Xmx128m` per Spring Boot microservice for high density.
  - HikariCP connection pool optimization (`maximum-pool-size: 50`, `idle-timeout: 300000`).
- [x] **Frontend Performance**
  - Next.js 15 App Router code splitting & dynamic route compilation.
  - Lenis smooth scroll and Framer Motion micro-animations optimized for 60fps rendering.

### Infrastructure & DevOps
- [x] **Containerization & Deployment**
  - Multi-stage Dockerfiles for `api-gateway`, `auth-service`, `crm-service`, `event-service`, `gallery-service`.
  - Production Docker Compose setup (`docker-compose.prod.yml`).
  - Kubernetes deployment manifests (`/k8s`).
- [x] **Observability & Health Checks**
  - Prometheus metrics exporter (`/actuator/prometheus`) enabled on all microservices.
  - Spring Boot Actuator health probes (`/actuator/health`).

### Documentation
- [x] **Technical Documentation**
  - Master Architectural Specification (`docs/EVENTOS_COMPLETE_PROJECT_THEORY_SPEC.md`).
  - PRD & Code Deep Dive (`docs/EVENTOS_PRD_AND_CODE_DEEP_DIVE.md`).
  - API Gateway Reference Guide (`docs/api_reference.md`).
- [x] **Operational & Deployment Documentation**
  - Master Render Deployment Guide (`docs/render_deployment_guide.md`).
  - Environment Variables Master Guide (`docs/launch/env_variables_master_guide.md`).
  - Local Microservices Run Guide (`docs/local_run_guide.md`).
  - Frontend Manual QA Testing Guide (`docs/FRONTEND_MANUAL_TESTING_GUIDE.md`).

---

## 🟡 3. MEDIUM PRIORITY & POST-LAUNCH ROADMAP

### Built-in UX & Help Portals
- [x] **Interactive On-Site Help Center** (`/help`): Real-time fuzzy search across guides, FAQs, and video tutorials.
- [x] **Guided Product Tour** (`/tour`): Interactive walkthrough of workspace selector, profit analytics, and cue sheets.
- [x] **Developer & Webhooks Portal** (`/docs` & `/developer`): Real-time JSON payload generator for webhooks (`booking.confirmed`).
- [x] **AI Support Co-Pilot** (`/help/assistant` & `/ai`): In-app AI co-pilot for automated quote assistance.

---

## 📋 4. FINAL PRE-LAUNCH CHECKLIST (Launch Day Protocol)

- [ ] Execute database seed script `seed_admin.sql` on live PostgreSQL `auth_db`.
- [ ] Verify production domain DNS (`api.eventos.agency` & `eventos.agency`).
- [ ] Confirm environment variables in Vercel & Render dashboards.
- [ ] Perform 1 full end-to-end booking flow test on production.
