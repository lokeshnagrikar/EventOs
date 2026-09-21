# EventOS — Architecture

## High-Level Architecture

**FACT:**

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                          │
│         Next.js 15 Frontend (React 19 RC)                │
│         Port 3000 · TypeScript · Tailwind CSS            │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / WSS
                       ↓
┌──────────────────────────────────────────────────────────┐
│              REVERSE PROXY LAYER                          │
│  Production: Caddy (api.eventosapp.in → api-gateway)      │
│  Docker Dev: Nginx (port 80/443 → web + api-gateway)      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌──────────────────────────────────────────────────────────┐
│         SPRING CLOUD API GATEWAY (port 8080)              │
│  • JWT Authentication Filter (JwtAuthFilter.java)         │
│  • Rate Limiting Filter (RateLimitingFilter.java)         │
│  • Request Logging Filter                                 │
│  • Route Definitions → backend services                   │
│  • Redis-backed rate limiting                             │
└──────┬──────────┬──────────┬──────────┬─────────────────┘
       │          │          │          │
       ↓          ↓          ↓          ↓
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  AUTH    │ │   CRM    │ │  EVENT   │ │ GALLERY  │
│ SERVICE  │ │ SERVICE  │ │ SERVICE  │ │ SERVICE  │
│  :8081   │ │  :8082   │ │  :8083   │ │  :8084   │
│ auth_db  │ │ crm_db   │ │ event_db │ │gallery_db│
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │             │
     ↕            ↕            ↕             ↕
┌──────────────────────────────────────────────────┐
│               SHARED INFRASTRUCTURE               │
│  PostgreSQL 17  │  Redis 7.2  │  RabbitMQ 3.12   │
│  Cloudinary     │  Stripe     │  SMTP/MailHog     │
└──────────────────────────────────────────────────┘
```

## Service Routing (API Gateway)

**FACT (from `api-gateway/src/main/resources/application.yml`):**

| Route Pattern | Target Service | Port | Notes |
|---|---|---|---|
| `/api/v1/auth/**` | auth-service | 8081 | |
| `/api/v1/auth/ws`, `/api/v1/auth/ws/**` | auth-service (WS) | 8081 | WebSocket upgrade |
| `/api/v1/crm/**` | crm-service | 8082 | |
| `/api/v1/events/**` | event-service | 8083 | |
| `/api/v1/bookings/**` | event-service | 8083 | Rewrite: `/api/v1/events/bookings/**` |
| `/api/v1/client/**` | event-service | 8083 | Rewrite: `/api/v1/events/client/**` |
| `/api/v1/gallery/**` | gallery-service | 8084 | |

## Backend Framework Details

**FACT:**
- **Language:** Java 17
- **Framework:** Spring Boot 3.3.0
- **Build Tool:** Maven (multi-module POM)
- **Cloud:** Spring Cloud 2023.0.1 (Gateway)
- **ORM:** Spring Data JPA + Hibernate (auto DDL)
- **Security:** Spring Security 6 + JWT (JJWT 0.12.5)
- **API Docs:** SpringDoc OpenAPI (Swagger UI)
- **Mapping:** MapStruct 1.5.5
- **Boilerplate:** Lombok 1.18.32
- **Resilience:** Resilience4j 2.2.0
- **Testing:** JUnit 5 + Mockito + JaCoCo
- **Tracing:** OpenTelemetry (Tempo endpoint configured)

## Frontend Framework Details

**FACT:**
- **Framework:** Next.js 15 (App Router)
- **React:** 19.0.0-rc
- **Language:** TypeScript 5.4
- **Styling:** Tailwind CSS 3.4 + CSS custom properties (shadcn/ui pattern)
- **Components:** shadcn/ui (Radix UI primitives), custom components
- **State:** Zustand 4.5
- **Data Fetching:** TanStack React Query 5 + Axios
- **Forms:** React Hook Form 7 + Zod validation
- **Animation:** Framer Motion 12, GSAP 3.15, Lenis 1.3 (smooth scroll)
- **Icons:** Lucide React + Iconify
- **Charts:** Recharts 2.15
- **3D:** Three.js (landing page effects)
- **Testing:** Playwright (E2E)
- **Lottie:** @lottiefiles/dotlottie-react

## Database Architecture

**FACT (from `docker/postgres/init-db.sql` and docker-compose):**

Each microservice has its own dedicated PostgreSQL database:

| Service | Database | Notes |
|---|---|---|
| auth-service | `auth_db` | Users, tenants, companies, roles, sessions, billing |
| crm-service | `crm_db` | Leads, contacts, quotes, activities |
| event-service | `event_db` | Events, bookings, invoices, payments, vendors, timelines |
| gallery-service | `gallery_db` | Albums, gallery items, share links |
| (unused) | `payment_db` | Created in init-db.sql but no service targets it |

**Schema management:** Hibernate `ddl-auto` (JPA auto-creates tables from entities).

**INFERENCE:** No explicit migration files (Flyway/Liquibase) are present. Schema is managed by JPA entity definitions.

## Inter-Service Communication

**FACT (from RabbitMQ consumers and messaging configs):**

### Event-Driven (RabbitMQ)

| Event | Producer | Consumer | Queue |
|---|---|---|---|
| Quote Accepted → Create Booking | crm-service | event-service | `event.booking.queue` |
| Booking Created → Notify Auth | event-service | auth-service | `booking.created.queue` |
| Payment Recorded → Update Gallery Access | event-service | gallery-service | `payment.recorded.queue` |
| Budget Converted → Create Lead | event-service | crm-service | `crm.lead.queue` |
| Audit Events | various | auth-service | `audit.events.queue` |
| Media Cleanup | gallery-service | gallery-service | cleanup queue |
| Dead Letter Queue | any failed | event-service | DLQ handling |

### Synchronous (HTTP)
- event-service → auth-service (user verification)
- event-service → crm-service (lead data)
- crm-service → auth-service (user verification)

## Scheduled Tasks

**FACT:**

| Scheduler | Service | Cron | Purpose |
|---|---|---|---|
| TokenCleanupScheduler | auth-service | `0 0 3 * * *` (3 AM daily) | Clean expired refresh tokens |
| InvoiceReminderScheduler | event-service | `0 0 8 * * *` (8 AM daily) | Send invoice payment reminders |
| CleanupScheduler | gallery-service | `0 0 * * * *` (hourly) | Clean orphaned gallery items |

## Monitoring Stack

**FACT (from docker-compose.yml):**
- **Prometheus** (port 9090) — Metrics collection
- **Grafana** (port 3002) — Dashboards & alerting
- **Loki** — Log aggregation
- **Tempo** — Distributed tracing
- **Node Exporter** (port 9100) — Host metrics
- **cAdvisor** (port 8098) — Container metrics

Source: `docker-compose.yml`, `docker/monitoring/`, `docker/logging/`
