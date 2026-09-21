# EventOS — Master Project Context

> **This is the primary AI orientation document.** Read this FIRST before making any changes.

## 1. What Is EventOS?

**FACT:**
EventOS is a multi-tenant SaaS platform for event management agencies. It provides an end-to-end workspace for managing the lifecycle of event planning — from lead capture through CRM, quoting/proposals, booking, event execution (timeline/run-of-show), invoicing/payments, gallery/photo delivery, and client communication.

**Product Positioning (from codebase):**
> Proposals + WhatsApp Alerts + Run-of-Show + Photo Delivery in one single workspace.

**Target Users:** Event planning agencies, wedding planners, coordinators, and production houses — primarily in the Indian market (INR currency, GST tax, Asia/Kolkata timezone defaults).

## 2. What Problem Does It Solve?

**INFERENCE:**
Replaces fragmented tools (spreadsheets, WhatsApp groups, manual proposals, paper contracts) with a unified digital workspace. Agencies can manage leads, generate quotes, send branded proposals, handle milestone payments, coordinate event timelines, and deliver photo galleries — all from one platform.

## 3. Who Uses It?

**FACT (from middleware, role system, pricing):**
- **Agency Owners/Admins** — Full workspace management (dashboard, CRM, events, billing, settings)
- **Team Members** — Event coordination, task execution (role-based access)
- **Clients** — View proposals, approve quotes, pay invoices, view galleries (via `/portal`)
- **Platform Operators** — Superadmin panel for managing tenants, billing, support (`/superadmin`)

## 4. Technology Stack

**FACT:**

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19 RC, TypeScript |
| Styling | Tailwind CSS 3.4 + CSS Variables (shadcn/ui design tokens) |
| State Management | Zustand (stores: auth, billing, onboarding, help, celebration, limit, authModal) |
| Data Fetching | TanStack React Query 5 + Axios |
| Animation | Framer Motion 12, GSAP, Lenis smooth scroll |
| Backend | Java 17, Spring Boot 3.3, Spring Cloud Gateway |
| Architecture | Microservices (5 services) behind API Gateway |
| Database | PostgreSQL 17 (separate DB per service) |
| ORM | Spring Data JPA / Hibernate |
| Messaging | RabbitMQ 3.12 (async event-driven communication) |
| Cache | Redis 7.2 |
| Auth | JWT (JJWT) + refresh tokens + 2FA (TOTP) + Google OAuth |
| Media Storage | Cloudinary |
| Payments | Stripe (billing/subscription) |
| Email | SMTP (configurable, MailHog for dev) |
| WebSocket | Spring WebSocket + STOMP |
| Monitoring | Prometheus + Grafana + Loki + Tempo |
| Reverse Proxy | Caddy (production), Nginx (docker-compose) |
| Containerization | Docker + Docker Compose |
| Orchestration | Kubernetes (k8s manifests + Helm charts present) |
| Analytics | PostHog, GA4, Microsoft Clarity (configurable) |

## 5. Architecture Overview

```
User Browser
     ↓
Next.js Frontend (port 3000)
     ↓ (API calls via Axios)
Caddy/Nginx Reverse Proxy
     ↓
Spring Cloud API Gateway (port 8080)
     ├── JWT Auth Filter + Rate Limiting
     ↓
  ┌─────────────────────────────────────────┐
  │  auth-service (8081) → auth_db          │
  │  crm-service  (8082) → crm_db          │
  │  event-service (8083) → event_db        │
  │  gallery-service (8084) → gallery_db    │
  └─────────────────────────────────────────┘
     ↕ RabbitMQ (async events)
     ↕ Redis (caching, rate limiting, sessions)
     ↕ Cloudinary (media), Stripe (payments), SMTP (email)
```

## 6. Major Modules

**FACT:**
1. **Auth Service** — Authentication, authorization, workspaces, teams, roles, billing, settings, API keys, audit logs
2. **CRM Service** — Leads, contacts, quotes/proposals, lead scoring, PDF generation, dashboard analytics
3. **Event Service** — Events, bookings, timelines, vendors, invoices, payments, budgets, templates, client portal
4. **Gallery Service** — Albums, gallery items, share links, Cloudinary integration, media cleanup
5. **API Gateway** — Routing, JWT validation, rate limiting, request logging
6. **Frontend (web)** — Landing page, auth flows, dashboard, CRM, events, bookings, quotes, invoices, payments, gallery, settings, superadmin, onboarding, AI assistant, client portal

## 7. What Is Implemented?

**FACT:** See `brain/04-feature-inventory.md` for full details. Core implemented features:
- Multi-tenant authentication with JWT + refresh tokens + Google OAuth + 2FA
- Workspace/team management with role-based access
- CRM: Leads, contacts, quotes with line items and PDF generation
- Event management with multi-day support, venues, timelines
- Booking lifecycle (lead → quote → booking → event)
- Invoice generation with sequential numbering and milestone tracking
- Payment tracking and Stripe subscription billing
- Gallery with albums, media upload (Cloudinary), and share links
- Client portal for quote/invoice viewing
- WhatsApp message formatting and Meta Cloud API dispatch
- AI Assistant (frontend simulation — not backed by real API calls)
- Superadmin panel for platform operations
- Analytics (PostHog, GA4, Clarity)
- Comprehensive landing page with pricing

## 8. What Is Incomplete?

**INFERENCE/PLANNED:**
- AI assistant is client-side simulated — no real LLM API integration on backend
- Run-of-show functionality exists as WhatsApp alert templates but no dedicated run-of-show execution UI or backend
- Photo delivery (gallery share links exist, but no automated client delivery workflow)
- SMS integration is referenced in pricing/usage tracking but not implemented
- Automation module has frontend routes but implementation depth is unclear
- Chat functionality has routes but appears to be placeholder

## 9. What Should An AI Agent Understand Before Changing Anything?

1. **Multi-tenant architecture**: Every data query MUST be scoped to `tenantId`. The `X-Tenant-ID` header is sent with every authenticated request.
2. **Microservices boundary**: Each service has its own database. Cross-service communication uses RabbitMQ events or HTTP calls.
3. **JWT tokens**: Access tokens are short-lived (~15min), refresh tokens are long-lived (~7 days). Both frontend and middleware verify tokens.
4. **Role hierarchy**: CLIENT users → `/portal` only. Agency staff → `/dashboard`. Platform roles → `/superadmin`.
5. **API Gateway routing**: All frontend API calls go through `api-gateway:8080/api/v1/*`. The gateway rewrites paths for bookings and client-portal routes.
6. **Frontend state**: Zustand stores with localStorage/sessionStorage persistence. Cookies used for SSR middleware.
7. **Database per service**: `auth_db`, `crm_db`, `event_db`, `gallery_db` (also `payment_db` created but appears unused).

## 10. Files To Inspect First

| Area | Key Files |
|---|---|
| Frontend entry | `web/src/app/layout.tsx`, `web/src/app/providers.tsx` |
| Auth flow | `web/src/store/authStore.ts`, `web/src/lib/api-client.ts`, `web/src/middleware.ts` |
| API routing | `backend/api-gateway/src/main/resources/application.yml` |
| Backend auth | `backend/auth-service/.../controller/AuthController.java`, `backend/auth-service/.../service/AuthService.java` |
| Data models | Entity files in each service's `entity/` package |
| Docker setup | `docker-compose.yml`, `Caddyfile` |
| Design system | `web/tailwind.config.ts`, `web/src/app/globals.css` |

## 11. What Must Never Be Changed Casually?

- **JWT secret configuration** — Shared across all services
- **Database schema changes** — Affects all running services
- **API Gateway routing** — Breaks frontend ↔ backend communication
- **Multi-tenant scoping** — Data isolation is critical
- **Cookie names** (`hasSession`, `accessToken`, `user_role`) — Used by Next.js middleware for SSR auth
- **RabbitMQ queue/exchange names** — Cross-service contracts
- **Stripe webhook handling** — Financial data integrity

## 12. Current Known Risks

See `brain/13-known-issues-and-technical-debt.md` for full list. Key risks:
- Google OAuth client ID is hardcoded as fallback in `providers.tsx`
- AI provider has a mock API key in default config
- `payment_db` is created but no service uses it
- Dashboard page is a single 138KB file
- Settings page is a single 218KB file
- SuperAdmin page is a single 105KB file

## 13. Current Project State

See `brain/15-current-project-state.md` for live state tracking.

---

# AI AGENT STARTUP PROTOCOL

Every future AI coding session must follow this order:

1. Read `brain/00-project-context.md` (this file)
2. Read `brain/15-current-project-state.md`
3. Read relevant architecture/module documentation from `brain/`
4. Inspect the actual source files related to the requested task
5. Check `brain/decisions/` for relevant prior decisions
6. Understand existing patterns before creating new ones
7. Make the smallest appropriate change
8. Do not duplicate existing functionality
9. Do not contradict established architecture without a documented reason
10. Update Brain documentation when the project state materially changes
11. Record important architectural/product decisions in `brain/decisions/`
12. Validate the implementation
13. Update current project state in `brain/15-current-project-state.md`

> **The Brain is a memory aid. The actual source code remains the final implementation authority.**
> **If Brain documentation conflicts with the codebase: CODEBASE WINS.**
> The discrepancy must then be documented and the Brain corrected.
