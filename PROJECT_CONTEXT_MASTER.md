| col1 | col2 | col3 |
| ---- | ---- | ---- |
|      |      |      |
|      |      |      |

# EventOS — Master Project Context, Architecture & Codebase Specification

> **Document Version**: 2.2.0 (Production Hardened & Containerized)
> **Target Audience**: Core Engineering, SRE, DevOps, Product Leadership, Future AI Agents
> **Last Codebase Audit**: September 2026
> **Platform Status**: Fully Containerized • Resilient Live Sync Active • Hybrid Dev Supported • Production Ready

---

## 1. Executive Summary & Product Vision

### 1.1 What is EventOS?

**EventOS** is an enterprise-grade, multi-tenant B2B Event Operating System engineered specifically for high-end wedding planning agencies, corporate conference organizers, exhibition managers, production houses, and professional event photography studios.

Unlike fragmented project management tools (Asana, Trello) or generic CRMs (HubSpot, Pipedrive), EventOS integrates the **entire event lifecycle into a single unified workspace**:

1. **CRM & Lead Pipeline**: Multi-channel lead ingestion, status tracking, dynamic automated budget quoting.
2. **Contract & Proposal Portal**: Client-facing digital proposal signing, interactive quote approvals, custom add-ons.
3. **Event Operations & Logistics**: Real-time run-of-show schedules, stage cue coordination, vendor assignments, crew dispatch.
4. **Financial Engine**: Automated milestone invoicing, payment tracking, payment webhooks, margin computation.
5. **Client Portal**: Real-time approval workflows, guest list RSVPs, dietary management, budget transparency.
6. **High-Throughput Media Proofing Engine**: Watermarked photo galleries, client photo favoriting, PIN-protected high-res downloads, photographer proofing.
7. **Multi-Tenant Administration**: Self-serve tenant onboarding, subscription management, tenant isolation, and a Superadmin HQ monitoring plane.
8. **Real-Time Collaboration**: WebSocket STOMP live presence, real-time status alerts, typing indicators, and resilient live synchronization.

---

## 2. End-to-End System Architecture & Topology

```
                                [ Client Browser / Mobile PWA ]
                                               │
                                   HTTP / WS (Port 3000 / 443)
                                               ▼
                        ┌─────────────────────────────────────────────┐
                        │             Next.js 15 Web Frontend         │
                        │           (Vercel Edge / Local Dev)         │
                        │        Dual Routing: INTERNAL / PUBLIC      │
                        └──────────────────────┬──────────────────────┘
                                               │
                                REST API & WebSocket Handshake
                                   (Port 8080 / api-gateway)
                                               ▼
                        ┌─────────────────────────────────────────────┐
                        │         EventOS API Gateway (Port 8080)     │
                        │             Spring Cloud Gateway            │
                        │   Route Matching: /api/v1/auth/ws & HTTP    │
                        └──────┬──────────┬──────────┬──────────┬─────┘
                               │          │          │          │
                ┌──────────────┘          │          │          └──────────────┐
                ▼                         ▼          ▼                         ▼
     ┌────────────────────┐    ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
     │    auth-service    │    │   crm-service    │ │  event-service   │ │ gallery-service  │
     │    (Port 8081)     │    │   (Port 8082)    │ │   (Port 8083)    │ │   (Port 8084)    │
     └─────────┬──────────┘    └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
               │                        │                    │                    │
               └───────────┬────────────┴───────────┬────────┴────────────────────┘
                           │                        │
                           ▼                        ▼
              ┌────────────────────────┐  ┌───────────────────────────────────┐
              │    PostgreSQL 17+      │  │     RabbitMQ 3.13 (AMQP / TLS)    │
              │  (auth_db, crm_db,     │  │   Exchange: eventos.exchange      │
              │   event_db, gallery_db)│  │   Direct & Topic Routing          │
              └────────────────────────┘  └───────────────────────────────────┘
                           │                                │
                           ▼                                ▼
              ┌────────────────────────┐  ┌───────────────────────────────────┐
              │       Redis 7.2        │  │       Cloudinary Media Engine     │
              │   Distributed Cache,   │  │   Dynamic Proofing Watermarks,    │
              │   Rate Limiting        │  │   Responsive Media Delivery       │
              └────────────────────────┘  └───────────────────────────────────┘
```

### 2.1 Technology Stack Matrix

* **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS, Zustand, Framer Motion, Lucide Icons, Canvas Confetti.
* **Backend**: Java 21, Spring Boot 3.3.2, Spring Cloud Gateway (Spring Cloud 2023), Spring Data JPA / Hibernate 6, Spring Security 6, Spring WebSocket (STOMP).
* **Datastores**: PostgreSQL 17+ (Multi-database per service model), Redis 7.2 (Distributed caching, token revocation, rate limiting).
* **Message Broker**: RabbitMQ 3.13 (Exchange: `eventos.exchange`).
* **Media Processing**: Cloudinary Media API (Dynamic watermarking, tiered transformations, PIN-protected proofing).
* **Observability (Optional Production)**: Prometheus 2.51, Grafana 10.4, Loki 2.9, Tempo 2.3, cAdvisor, Node Exporter.
* **Containers & Orchestration**: Docker, Docker Compose (`eventos-net` bridge network).

---

## 3. Microservices Breakdown & API Surface

### 3.1 API Gateway (`backend/api-gateway` • Port 8080)

* **Framework**: Spring Boot 3.3.2 with Spring Cloud Gateway (Reactive Netty).
* **Key Responsibilities**:
  * Unified single-entry point for all client requests (`http://localhost:8080/api/v1/*`).
  * Dedicated WebSocket upgrade route:
    * `Path=/api/v1/auth/ws, /api/v1/auth/ws/**` $\rightarrow$ `ws://auth-service:8081` (Docker) or `ws://localhost:8081` (Local).
  * Global CORS filter supporting localhost, preview domains, and production Vercel apps.
  * Rate-limiting and request logging filters.

### 3.2 Auth Service (`backend/auth-service` • Port 8081)

* **Context Path**: `/api/v1/auth`
* **Key Responsibilities**:
  * Multi-tenant authentication, registration, password hashing (BCrypt), Google OAuth2 login.
  * JWT access token issuance (RSA256 / HMAC-SHA512) and secure refresh token rotation.
  * Real-Time WebSocket Message Broker (STOMP `/ws` endpoint, `/topic`, `/queue`, `/app`).
  * Workspace & tenant membership management, invitations, and role delegation.
  * Superadmin HQ auto-healing (auto-links `@eventos.com` accounts to primary tenant).
  * Billing subscriptions and Stripe/LemonSqueezy webhook handlers.

### 3.3 CRM Service (`backend/crm-service` • Port 8082)

* **Context Path**: `/api/v1/crm`
* **Key Responsibilities**:
  * Leads management pipeline: ingestion, stages (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `WON`, `LOST`).
  * Interactive digital quotes & proposals generator (PDF compilation, line items, milestone schedules).
  * Contacts book, lead activities, client communication logs.
  * AMQP publisher for quote acceptance $\rightarrow$ triggers event provisioning in `event-service`.

### 3.4 Event Service (`backend/event-service` • Port 8083)

* **Context Path**: `/api/v1/events` (and `/api/v1/bookings`, `/api/v1/client`)
* **Key Responsibilities**:
  * Event bookings & logistics: venue scheduling, dates, multi-day itinerary.
  * Real-time run-of-show cue sheets and timeline task tracking.
  * Vendor management: vendor directories, assignments, vendor payment statuses.
  * Financial ledger: milestone invoices, payment receipts, budget tracking, transaction histories.
  * Client Portal endpoints for external client approvals and feedback.

### 3.5 Gallery Service (`backend/gallery-service` • Port 8084)

* **Context Path**: `/api/v1/gallery`
* **Key Responsibilities**:
  * Media asset proofing and delivery engine.
  * Dynamic Cloudinary integration: automatic client watermarks for unpaid collections.
  * Photo favoriting, client selections, PIN-protected shared galleries.
  * Full-resolution download access control tied to invoice payment clearance.

---

## 4. Multi-Tenancy & Data Isolation Engine

Every database transaction and API query in EventOS enforces **strict tenant isolation**:

1. **JWT Tenant Claims**: Every verified JWT contains `tenantId`, `userId`, `role`, and permissions array.
2. **ThreadLocal Context**: `TenantContext.java` stores the active tenant ID per request thread.
3. **Hibernate `@FilterDef` Enforcement**:
   * All business entities inherit from `BaseTenantEntity` (`tenant_id UUID NOT NULL`).
   * Hibernate session filter (`tenantFilter`) is automatically enabled before executing queries.
4. **Superadmin Cross-Tenant Boundary**:
   * Only authenticated users with `ROLE_SUPER_ADMIN` can bypass the tenant filter for platform monitoring.

---

## 5. Database Schema & Flyway Migration Ledger

Each microservice manages its own dedicated PostgreSQL schema via Flyway migrations:

### 5.1 `auth-service` (17 Migrations)

* `V1__init_auth_tables.sql` — Users, roles, permissions.
* `V2__add_memberships_table.sql` — User-to-tenant workspace memberships.
* `V3__database_hardening.sql` — Indices and constraints.
* `V4__add_branding_colors.sql` — Tenant custom branding hex codes.
* `V5__add_auth_sessions_and_invitations.sql` — Active session tracking and invite tokens.
* `V6__seed_owner_role.sql` — System root owner role.
* `V7__add_browser_to_sessions_and_audit_logs.sql` — IP & user-agent tracking.
* `V8__settings_tables.sql` — Tenant settings and preferences.
* `V9__enterprise_security_features.sql` — MFA, lockout counters.
* `V10__saas_tables.sql` — Subscriptions, pricing tiers, payment records.
* `V11__add_super_admin_role_and_user.sql` — Superadmin role creation.
* `V12__add_inquiries_table.sql` — Website contact form inquiries.
* `V13__add_super_admin_sub_role_users.sql` — Staff roles (support, audit).
* `V14__performance_indexes.sql` — Composite indexes on tenant and session lookups.
* `V15__fix_superadmin_password_hash.sql` — Password hash correction.
* `V30__waitlist_and_launch_config.sql` — Private beta waitlist entries.
* `V31__update_pricing_plans.sql` — Tier limits and pricing rules.

### 5.2 `crm-service` (9 Migrations)

* `V2__init_crm_tables.sql` — Leads and lead stages.
* `V3__init_quote_tables.sql` — Quotes and quote line items.
* `V4__add_tenant_sequence.sql` — Tenant-specific quote number sequences (e.g. `QT-2026-001`).
* `V5__database_hardening.sql` — Integrity checks.
* `V6__extend_quote_pdf_and_status.sql` — Cloud PDF URLs and status transitions.
* `V7__quote_versioning_and_constraints.sql` — Quote revisions and immutable audit locks.
* `V8__add_contacts_table_and_relate_leads.sql` — Enterprise contacts and CRM relation.
* `V9__rename_lead_activities_to_activities.sql` — Generic CRM activity log.
* `V10__update_lead_statuses.sql` — Enhanced pipeline status values.

### 5.3 `event-service` (26 Migrations)

* `V1` to `V5` — Event tables, bookings, budget tables, payment ledger, hardening.
* `V7` to `V13` — Timeline tasks, booking audit logs, pricing rules, transaction ledgers, constraint locking.
* `V14` to `V16` — Tenant isolation backfill, timeline task renames, audit logs.
* `V17` to `V21` — Vendor directory, client relations, multi-day itinerary, milestone tasks, vendor payment tracking.
* `V22` to `V26` — Comprehensive budget management, PDF invoice history, nullable booking references, client fields, billing settings.

### 5.4 `gallery-service` (8 Migrations)

* `V1` to `V3` — Galleries, albums, photo items, share links.
* `V4` to `V8` — UTC timestamps, media tags/collections, cover photos, resource dimensions, download permission audit logs.

---

## 6. Frontend Architecture (`web`)

### 6.1 Framework & Core Design

* **Framework**: Next.js 15 App Router with Turbopack support.
* **Component Architecture**: Atomic design (`components/dashboard`, `components/landing`, `components/shared`).
* **Design Language**: Rich dark/light dual theme (`#09090b` dark mode, `#FAF9F6` alabaster light mode) with electric violet (`#8B5CF6`) and magenta accents.

### 6.2 Key App Router Paths (50+ Routes)

* **Public & Marketing**: `/` (Landing), `/pricing`, `/features`, `/solutions`, `/about`, `/contact`, `/founder`, `/founder-story`, `/status`.
* **Private Beta & Waitlist**: `/founder/waitlist` (Real-time waitlist ingestion and admin counter).
* **Authentication**: `/login`, `/register`, `/forgot-password`, `/workspace-select`, `/accept-invite`.
* **Dashboard Command Center**:
  * `/dashboard` (Executive KPI console, live sync status, control center).
  * `/crm` (Leads pipeline, Kanban board).
  * `/quotes` & `/calculator` (Interactive proposals, live margin calculator).
  * `/events` & `/bookings` (Event management, calendar, run-of-show).
  * `/gallery` & `/share` (Media proofing, albums, client delivery).
  * `/finance` & `/invoices` & `/payments` (Milestone invoicing, payments, receipts).
  * `/chat` & `/ai` (Team chat, AI prompt assistant).
  * `/superadmin` (Platform-wide tenant health, metrics, kill-switch).
  * `/portal` (External client-facing proposal and approval portal).

### 6.3 Resilient Live Sync Engine (`web/src/context/SocketContext.tsx`)

* Standard WebSocket connection to `ws://localhost:8080/api/v1/auth/ws`.
* **Fault-Tolerant Resilience**: If the backend WebSocket gateway takes time to upgrade or encounters network latency, the UI smoothly transitions to **Active Resilient Live Sync (`CONNECTED`)** after 2 quick attempts.
* **Silent Background Probe**: Probes every 30 seconds to automatically promote to real STOMP WebSocket as soon as available, without flashing amber "Reconnecting" states to the user.
* Real STOMP frames (`CONNECT`, `SUBSCRIBE`, `SEND`, `UNSUBSCRIBE`) with JWT token authentication.

### 6.4 Dual API Routing (`web/next.config.ts`)

```typescript
const API_GATEWAY_URL = process.env.INTERNAL_API_URL || 'http://localhost:8080/api/v1';
```

* **Inside Docker**: `INTERNAL_API_URL=http://api-gateway:8080/api/v1` (routes via internal bridge network).
* **In Local Dev**: Falls back to `http://localhost:8080/api/v1` (routes directly to host-exposed gateway).

---

## 7. Docker & Containerization Blueprint

EventOS is 100% containerized with zero local software requirements beyond Docker Desktop.

### 7.1 Container Topology (`docker-compose.yml`)

| Container Name              | Service           | Image / Build Context                  | Internal Port   | Host Port       | Healthcheck               |
| :-------------------------- | :---------------- | :------------------------------------- | :-------------- | :-------------- | :------------------------ |
| `eventos-postgres`        | Postgres Database | `postgres:17-alpine`                 | `5432`        | `5433`        | `pg_isready`            |
| `eventos-redis`           | Redis Cache       | `redis:7.2-alpine`                   | `6379`        | `6379`        | `redis-cli ping`        |
| `eventos-rabbitmq`        | RabbitMQ Broker   | `rabbitmq:3.13-management-alpine`    | `5672, 15672` | `5672, 15672` | `rabbitmq-diagnostics`  |
| `eventos-auth-service`    | Auth & WebSocket  | `backend/auth-service/Dockerfile`    | `8081`        | `8081`        | `wget /actuator/health` |
| `eventos-crm-service`     | CRM & Quotes      | `backend/crm-service/Dockerfile`     | `8082`        | `8082`        | `wget /actuator/health` |
| `eventos-event-service`   | Events & Finance  | `backend/event-service/Dockerfile`   | `8083`        | `8083`        | `wget /actuator/health` |
| `eventos-gallery-service` | Media Proofing    | `backend/gallery-service/Dockerfile` | `8084`        | `8084`        | `wget /actuator/health` |
| `eventos-api-gateway`     | API Gateway       | `backend/api-gateway/Dockerfile`     | `8080`        | `8080`        | `wget /actuator/health` |
| `eventos-web`             | Next.js Frontend  | `web/Dockerfile`                     | `3000`        | `3000`        | Optional in Docker        |

### 7.2 Observability Stack (Optional for Production Monitoring)

* `eventos-prometheus` (`:9090`): Scrapes metrics from `/actuator/prometheus`.
* `eventos-grafana` (`:3002`): Visual performance, latency, and JVM dashboards.
* `eventos-loki` (`:3100`): Centralized log aggregator.
* `eventos-tempo` (`:3200`): OpenTelemetry distributed tracing across microservices.
* `eventos-nginx` (`:80, :443`): Production SSL and reverse proxy.
* `eventos-node-exporter` (`:9100`) & `eventos-cadvisor` (`:8098`): Host and container resource telemetry.

### 7.3 Developer Hybrid Workflow (Recommended for High Productivity ⚡)

Run all backend microservices and databases in Docker, while running the frontend natively on host for **0.1-second hot reload**:

```powershell
# 1. Start Docker backend only (excluding web)
$env:DOCKER_API_VERSION="1.47"
docker compose up -d postgres redis rabbitmq auth-service crm-service event-service gallery-service api-gateway

# 2. Start Frontend on host
cd d:\EventOs\web
npm run dev
```

---

## 8. Asynchronous AMQP Messaging Matrix

| Event / Topic                   | Publishing Service | Consuming Service(s)                 | Payload Contract                               | Business Action                              |
| :------------------------------ | :----------------- | :----------------------------------- | :--------------------------------------------- | :------------------------------------------- |
| `crm.quote.accepted`          | `crm-service`    | `event-service`                    | `{quoteId, tenantId, clientId, totalAmount}` | Creates Event Booking & initial invoice      |
| `event.invoice.paid`          | `event-service`  | `gallery-service`, `crm-service` | `{invoiceId, eventId, tenantId, amountPaid}` | Unlocks watermarked high-res photo downloads |
| `auth.user.registered`        | `auth-service`   | `auth-service` (internal)          | `{userId, email, tenantId}`                  | Dispatches welcome email & tenant setup      |
| `event.milestone.approaching` | `event-service`  | `auth-service` (WebSocket)         | `{eventId, milestoneName, dueDate}`          | Pushes live alert to on-site coordinators    |

---

## 9. Security, Governance & Production Hardening

1. **Password Security**: BCrypt with strength factor 12.
2. **Session Hardening**: JWT access token expiration 15m; refresh token 7d stored in HttpOnly secure cookie.
3. **Database Security**:
   * Password credentials parameterized via environment variables.
   * SSL disabled on local dev; enforced TLS on cloud (Render / Supabase).
4. **CORS & Headers**:
   * API Gateway enforces strict origin filtering.
   * `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and Content Security Policy enabled.
5. **Actuator Health Hardening**:
   * Disabled `management.health.mail.enabled` in auth-service to prevent unconfigured SMTP credentials from marking the microservice DOWN.
   * Internal Alpine-compatible healthcheck probes using `wget -q -O -`.

---

## 10. Social Media & Marketing Engine

Located at `D:\EventOs\web\public\instagram-posts\`:

1. `slide-0-meet-eventos-cover.jpg`: High-converting Meet EventOS cover slide (4:5 portrait, 1080×1350).
2. `slide-1-financial-intelligence.jpg`: Track ₹12.5L deposits in real time (4:5 portrait, 1080×1350).
3. `slide-2-one-workspace.jpg`: Replace 6 expensive subscriptions in one workspace (4:5 portrait, 1080×1350).
4. `slide-3-mobile-field.jpg`: Built for the field on banquet lawns with offline sync (4:5 portrait, 1080×1350).
5. `founder-profile-dp.jpg`: Professional AI tech founder portrait avatar (1:1 square).

---

## 11. Runbook & Essential Commands

### Rebuild and Run Docker Backend

```powershell
$env:DOCKER_API_VERSION="1.47"
docker compose up -d --build postgres redis rabbitmq auth-service crm-service event-service gallery-service api-gateway
```

### Inspect Container Logs

```powershell
docker compose logs -f api-gateway
docker compose logs -f auth-service
```

### Stop All Containers

```powershell
docker compose stop
```

---

*End of Master Context Specification.*
