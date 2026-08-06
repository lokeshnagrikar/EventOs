# 📖 EventOS — Complete Master Project Theory, Architecture & Technical Blueprint

---

## 📘 1. Executive Summary & Core Vision

**EventOS** is an enterprise-grade, multi-tenant operating system built explicitly for event planners, wedding agencies, concert producers, venue operators, and scenography directors.

### The Problem It Solves
Traditional event management relies on fragmented, disconnected tools:
- Spreadsheets for budgeting & vendor payouts.
- Unstructured WhatsApp groups for client communication & crew dispatch.
- Paper/PDF proposals with manual invoicing & delayed payment collection.
- Disconnected photo galleries and missing run-of-show stage timing tools.

### The EventOS Solution
EventOS replaces this fragmented chaos with a single, high-performance, real-time operating system that unifies:
1. **Multi-Tenant Agency Workspace**: Agencies manage multiple brand identities/clients with 1-second workspace switching.
2. **Instant Quote & Contract Engine**: Dynamic cost estimation with 1-click PDF proposal exports.
3. **Live Run-of-Show Stage Manager**: Real-time cue-by-cue sound, lighting, pyrotechnics, and crew dispatch timeline.
4. **Financial Analytics & Margins Engine**: Real-time gross revenue, vendor expense breakdown, and net profit margin auditing (`EventFinancialAnalytics.tsx`).
5. **Omnichannel Communication**: Integrated WhatsApp Business API 6-digit OTPs & automated booking alerts.
6. **AI Event Assistant**: Automated event checklist, vendor recommendation, and contract generation.

---

## 🏛️ 2. Architectural Blueprint & Technical Stack

```
                               ┌─────────────────────────────────────────┐
                               │  Next.js 15 Web Application (Frontend)  │
                               │  Obsidian Dark Glassmorphism UI          │
                               └────────────────────┬────────────────────┘
                                                    │ REST / WebSocket
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │     Spring Cloud API Gateway (Port 8080) │
                               │     JWT Verification & Tenant Filter     │
                               └───────┬──────────┬──────────┬───────────┘
                                       │          │          │
                 ┌─────────────────────┘          │          └─────────────────────┐
                 ▼                                ▼                                ▼
┌─────────────────────────────────┐ ┌───────────────────────────┐ ┌─────────────────────────────────┐
│   Auth & Multi-Tenant Service   │ │   CRM & Proposals Service │ │    Event & Logistics Service    │
│   (Spring Boot / Java 21)       │ │   (Spring Boot / Java 21) │ │    (Spring Boot / Java 21)      │
└────────────────┬────────────────┘ └─────────────┬─────────────┘ └────────────────┬────────────────┘
                 │                                │                                │
                 └────────────────────────────────┼────────────────────────────────┘
                                                  ▼
                               ┌─────────────────────────────────────────┐
                               │ PostgreSQL 17 + Redis 7 + RabbitMQ 3.13 │
                               └─────────────────────────────────────────┘
```

### 💻 Frontend Architecture (Web Layer)
- **Framework**: Next.js 15 (App Router, React 19, TypeScript).
- **Styling & Aesthetics**: Obsidian `#09090b` palette, Tailwind CSS, Framer Motion (60fps spring physics), Lenis smooth scroll, Lucide icon system.
- **State Management**: Lightweight Zustand stores (`authStore`, `authModalStore`, `toastStore`, `billingStore`, `limitStore`).
- **Data Visualization**: Recharts (Area charts for revenue trends, Donut charts for cost allocation).
- **Performance Optimization**: Below-the-fold dynamic code splitting (`next/dynamic`), GPU-accelerated canvas spotlights, Node `--max-old-space-size=8192` build booster.

### ⚙️ Backend Architecture (Microservices Layer)
- **Runtime**: Java 21 & Spring Boot 3.x.
- **Service Breakdown**:
  - `api-gateway`: Central entry point handling JWT token filtering, CORS headers, and rate-limiting.
  - `auth-service`: Authentication, Registration, Google OAuth2, WhatsApp 6-digit OTP, Tenant Isolation, and Subscription Billing.
  - `crm-service`: Client lead pipeline Kanban board, Quotes, Proposals, and Vendor Agreements.
  - `event-service`: Run-of-Show stage scheduling, Crew dispatch, and Venue logistics.
  - `gallery-service`: AI Photo Booth media uploads, EXIF metadata extraction, and Cloudinary CDN storage.
- **JVM Footprint Tuning**: Capped at `-Xmx128m` per microservice so all 5 backend services + Next.js frontend execute simultaneously under **1.2 GB RAM total**.

---

## 🏢 3. Multi-Tenant Data Isolation & Security Model

### Tenant Isolation Guarantee
- Every agency workspace is assigned a unique `tenantId` (e.g. `tenant_apex`, `tenant_royal`, `tenant_subhub`).
- Every HTTP request passes an `X-Tenant-Id` header validated against the user's JWT authorization claims.
- PostgreSQL database queries enforce `WHERE tenant_id = :tenantId` scoping, guaranteeing **100% data privacy** between competing event agencies.

### Multi-Workspace Switcher (`WorkspaceSelectorPill.tsx`)
- Agency owners owning multiple companies can switch between active workspace contexts in 1 second without re-logging in.

### Authentication Safeguards
- **1-Click Returning User Profile**: Recognizes returning browser sessions for 1-second sign-in ("Welcome back, Lokesh!").
- **Email Domain Auto-Suggestion**: Suggests domain completions (`name@gma` ➔ `name@gmail.com`) to eliminate signup typos.
- **WhatsApp 6-Digit OTP**: Passwordless authentication for event clients.
- **Logout Confirmation Popup Modal (`LogoutConfirmationModal.tsx`)**: High-contrast obsidian warning dialog protecting users from accidental sign-outs.

---

## 💰 4. Financial Engine & Monetization Theory

### Tiered Subscription Plans
1. **STARTER**: Up to 3 Active Events, 5GB Storage, 1,000 AI Credits.
2. **PRO**: Unlimited Events, 50GB Storage, Custom Domain, White-Label Email Sender, Priority WhatsApp Dispatch.
3. **ENTERPRISE**: Custom Limits, Dedicated Database Shards, SLA Guarantee, 24/7 Phone Support.

### Real-Time Financial Analytics & Margins (`EventFinancialAnalytics.tsx`)
- Audits monthly gross revenue, vendor payouts, and net profit margins (`41.9% Margin`).
- Categorizes production expenses (Stage Decor 35%, Catering 28%, Sound & AV 20%, Cinematography 10%, Crew 7%).
- Per-Event Profitability Audit Table calculating net profit per contract.
- 1-Click Currency Toggle (`₹ INR`, `$ USD`, `€ EUR`).

### Dynamic Payment Processing (`DynamicUpiQrModal.tsx` & Stripe)
- Integrated Stripe Checkout (`pk_live_...` / `sk_live_...`) for global credit card billing.
- Real-Time Dynamic UPI QR Code modal with VPA verification (`eventos.pay@hdfcbank`) and 15-minute transaction expiration countdown.

---

## 🚀 5. Complete App Route Taxonomy (48 Pages)

| Category | Routes / Pages | Purpose |
| :--- | :--- | :--- |
| **Public Landing** | `/`, `/about`, `/features`, `/pricing`, `/calculator`, `/contact`, `/blog`, `/docs`, `/security`, `/status`, `/sla`, `/terms`, `/privacy`, `/cookies` | Marketing, ROI Calculator, Security & Legal disclosures |
| **Authentication** | `/login`, `/register`, `/forgot-password`, `/reset-password`, `AuthModal.tsx` | Password, Magic Link, Google OAuth, & WhatsApp 6-digit OTP Auth |
| **Workspace & Onboarding** | `/workspace-select`, `/onboarding`, `/accept-invite` | Multi-tenant workspace switcher & wizard setup |
| **Quote Calculator** | `/quote-calculator` | Interactive event budget estimator & 1-Click PDF proposal generator |
| **Dashboard Core** | `/dashboard`, `/ai`, `/chat`, `/activity` | Main workspace dashboard, AI Assistant, Team Chat, & Audit Logs |
| **Operations** | `/crm`, `/events`, `/bookings`, `/gallery` | Lead Kanban board, Calendar & Run-of-Show, Bookings, & Photo Booth |
| **Finance** | `/finance`, `/quotes`, `/payments`, `/invoices`, `/calculator` | Financial Analytics, Invoices, UPI QR Modal, & Payments Ledger |
| **Intelligence** | `/reports`, `/automation`, `/import` | Analytics graphs, Smart Automation Trigger builder, & CSV importer |
| **Settings & Admin** | `/settings`, `/settings/security`, `/portal`, `/developer`, `/superadmin` | White-label domain setup, Payment Gateways, WhatsApp API, & Client Portal |

---

## 💡 6. Summary Statement

EventOS is built from the ground up as a state-of-the-art, enterprise-grade SaaS operating system. It combines modern UI aesthetics (Linear/Vercel obsidian dark design), resilient microservices architecture (Java 21 / Spring Boot), robust multi-tenant data isolation, and comprehensive financial tools to power the next generation of event management agencies worldwide.
