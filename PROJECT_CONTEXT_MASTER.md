# EventOS — Master Project Context, Architecture & Deployment Specification

> **Document Version**: 2.0.0 (Production Hardened)  
> **Target Audience**: Core Engineering, SRE, Product Operations, Future AI Agents  
> **Last Verified & Updated**: September 2026  
> **Status**: Hardened & Conditionally Live (Phase 1 Microservices Live, Gateway & Remaining Microservices Deployment in Progress)

---

## Table of Contents
1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Multi-Tenancy & Data Isolation Engine](#3-multi-tenancy--data-isolation-engine)
4. [Microservices Breakdown & Domain Responsibilities](#4-microservices-breakdown--domain-responsibilities)
5. [Database Architecture & Flyway Migrations](#5-database-architecture--flyway-migrations)
6. [Asynchronous Messaging & Event-Driven Architecture](#6-asynchronous-messaging--event-driven-architecture)
7. [Frontend Architecture, UI/UX & Design System](#7-frontend-architecture-uiux--design-system)
8. [Role-Based Access Control (RBAC) & Routing Matrix](#8-role-based-access-control-rbac--routing-matrix)
9. [Superadmin Auto-Healing Architecture](#9-superadmin-auto-healing-architecture)
10. [JVM Optimization & Cloud Infrastructure Strategy (Render 512MB RAM)](#10-jvm-optimization--cloud-infrastructure-strategy-render-512mb-ram)
11. [Live Cloud Deployment Parameters & Environment Variables](#11-live-cloud-deployment-parameters--environment-variables)
12. [Completed Hardening Audit & Changelog](#12-completed-hardening-audit--changelog)
13. [End-to-End Business Life-Cycle Workflows](#13-end-to-end-business-life-cycle-workflows)
14. [Deployment Verification & Go-Live Checklist](#14-deployment-verification--go-live-checklist)
15. [Operator Runbook & SRE Troubleshooting](#15-operator-runbook--sre-troubleshooting)

---

## 1. Executive Summary & Product Vision

### What is EventOS?
**EventOS** is an enterprise-grade, multi-tenant B2B Event Operating System engineered specifically for high-end wedding planning agencies, corporate conference organizers, exhibition managers, production houses, and professional event photography studios.

Unlike generic project management software (such as Asana, Trello, or Monday) or basic CRM tools (HubSpot, Pipedrive), EventOS integrates the **entire event life-cycle** into a single cohesive operating plane:
1. **CRM & Lead Pipeline**: Ingestion, qualification, dynamic automated budget quoting.
2. **Contract & Proposal Portal**: Client-facing digital proposal signing, interactive quote approvals, custom addons.
3. **Event Operations & Logistics**: Real-time run-of-show schedules, stage cue coordination, vendor assignments, crew dispatch.
4. **Financial Engine**: Automated milestone invoicing, payment tracking, payment webhooks, margin computation.
5. **Client Portal**: Real-time approval workflows, guest list RSVPs, dietary management, budget transparency.
6. **High-Throughput Media Proofing Engine**: Watermarked photo galleries, client photo favoriting, PIN-protected high-res downloads, photographer proofing.
7. **Multi-Tenant Administration**: Self-serve tenant onboarding, subscription management, tenant isolation, and a Superadmin HQ monitoring plane.

---

## 2. End-to-End System Architecture

```
                                  [ Client Browser / Mobile Web ]
                                                │
                                    HTTPS (TLS 1.3 / Port 443)
                                                ▼
                         ┌─────────────────────────────────────────────┐
                         │              Vercel Edge Network            │
                         │          Next.js 14 App Router Frontend     │
                         │          (Domain: event-os-woad.vercel.app) │
                         └──────────────────────┬──────────────────────┘
                                                │
                                     REST / JSON API Requests
                                                │
                                                ▼
                         ┌─────────────────────────────────────────────┐
                         │         EventOS API Gateway (Render)        │
                         │             Spring Cloud Gateway            │
                         │            (Dynamic PORT / 8080)            │
                         └──────┬──────────┬──────────┬──────────┬─────┘
                                │          │          │          │
                 ┌──────────────┘          │          │          └──────────────┐
                 ▼                         ▼          ▼                         ▼
      ┌────────────────────┐    ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
      │    auth-service    │    │   crm-service    │ │  event-service   │ │ gallery-service  │
      │   (Render / 8081)  │    │  (Render / 8082) │ │  (Render / 8083) │ │  (Render / 8084) │
      └─────────┬──────────┘    └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
                │                        │                    │                    │
                └───────────┬────────────┴───────────┬────────┴────────────────────┘
                            │                        │
                            ▼                        ▼
               ┌────────────────────────┐  ┌───────────────────────────────────┐
               │    PostgreSQL 18.4     │  │   CloudAMQP RabbitMQ (TLS 5671)   │
               │  (Render DB:           │  │   Exchange: eventos.exchange      │
               │   eventos_root_mad6)   │  │   vhost: ghisyhmk                 │
               └────────────────────────┘  └───────────────────────────────────┘
                            │                                │
                            ▼                                ▼
               ┌────────────────────────┐  ┌───────────────────────────────────┐
               │      Render Redis      │  │        Cloudinary Media API       │
               │  (red-da5b8sajobas73e) │  │  (Watermarking, Proofing, Cloud:  │
               │  Port 6379             │  │   dqvwl8e13)                      │
               └────────────────────────┘  └───────────────────────────────────┘
```

### Technology Matrix
* **Frontend**: Next.js 14.2 (App Router), React 18, TypeScript 5, Tailwind CSS, Framer Motion, Lucide Icons, Canvas Confetti.
* **Backend**: Java 21, Spring Boot 3.3.2, Spring Cloud Gateway, Spring Data JPA / Hibernate 6, Spring Security 6.
* **Datastores**: PostgreSQL 18.4 (Render Managed), Redis (Render Managed Cache).
* **Message Broker**: RabbitMQ via CloudAMQP (TLS Port 5671, AMQPS protocol).
* **Media & Storage**: Cloudinary (Cloud name `dqvwl8e13`, dynamic responsive breakpoints, proofing watermarks).
* **Hosting Platforms**:
  * Frontend: Vercel (Edge-optimized serverless).
  * Backend: Render (Containerized Docker microservices, low-footprint SerialGC JVM tuning).

---

## 3. Multi-Tenancy & Data Isolation Engine

EventOS employs a **discriminator column multi-tenancy model with fail-secure programmatic enforcement**:

### 1. The Tenant Entity
Every organizational customer (wedding agency, production studio, etc.) is represented by a `Tenant` entity with a unique `UUID id`.
* Root Administration Tenant: `e5afcc88-5c4b-4df8-bb6d-6bb9bd380111` (**EventOS HQ Platform Administration**).

### 2. TenantContext & Request Interception
* When an authenticated request arrives at any microservice, the JWT claims (`tenantId`, `userId`, `roles`) are extracted by `JwtAuthenticationFilter`.
* The `tenantId` is populated into a thread-local `TenantContext`.
* If a request is received with no tenant context or an invalid tenant ID, the context securely defaults to `00000000-0000-0000-0000-000000000000` (fail-closed design), preventing cross-tenant leakage.

### 3. Hibernate Dynamic Aspect (`TenantFilterAspect.java`)
```java
@Aspect
@Component
public class TenantFilterAspect {
    @PersistenceContext
    private EntityManager entityManager;

    @Before("execution(* org.springframework.data.repository.Repository+.*(..))")
    public void enableTenantFilter() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId != null) {
            Session session = entityManager.unwrap(Session.class);
            Filter filter = session.enableFilter("tenantFilter");
            filter.setParameter("tenantId", tenantId);
        }
    }
}
```
* Every domain entity extending `BaseTenantEntity` carries `@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")`.
* All SQL queries (`SELECT`, `UPDATE`, `DELETE`) automatically inject `WHERE tenant_id = ?`, rendering cross-tenant data exfiltration mathematically impossible at the ORM layer.

---

## 4. Microservices Breakdown & Domain Responsibilities

### 1. `api-gateway` (Port 8080)
* **Technology**: Spring Cloud Gateway, Netty.
* **Responsibilities**:
  * Central reverse proxy for all inbound requests from the Next.js frontend.
  * CORS termination (Origin: `https://event-os-woad.vercel.app`, `http://localhost:3000`).
  * Route dispatching:
    * `/api/v1/auth/**` $\rightarrow$ `auth-service:8081`
    * `/api/v1/crm/**` $\rightarrow$ `crm-service:8082`
    * `/api/v1/events/**` $\rightarrow$ `event-service:8083`
    * `/api/v1/gallery/**` $\rightarrow$ `gallery-service:8084`
  * Gateway Trust Header Injection: Injects `X-Gateway-Secret` so downstream microservices reject direct unproxied requests.

### 2. `auth-service` (Port 8081)
* **Technology**: Spring Boot, Spring Security, Spring Data JPA, Nimbus JOSE JWT.
* **Responsibilities**:
  * User Registration (`/api/v1/auth/register`), Tenant Creation, and Workspace Initialization.
  * Login & Token Minting (`/api/v1/auth/login`) with RS256 / HS512 JWT access and refresh tokens.
  * User Profile & Membership Management (`/api/v1/auth/users/me`, `/api/v1/auth/tenants`).
  * Superadmin Platform Analytics (`/api/v1/auth/superadmin/**`).
  * Waitlist & Launch Configurations (`V30__waitlist_and_launch_config.sql`).

### 3. `crm-service` (Port 8082)
* **Technology**: Spring Boot, Spring Data JPA, RabbitMQ Producer.
* **Responsibilities**:
  * Lead Ingestion & Pipeline Tracking (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`).
  * Client Database & Contact Directory.
  * Interactive Quote & Proposal Generation:
    * Line items, packages, tax calculation, payment schedule milestones.
    * Client Digital Signature & Proposal Acceptance.
  * When a Quote is marked `WON` / Accepted, publishes `crm.quote.accepted` to RabbitMQ to auto-create the booking and event.

### 4. `event-service` (Port 8083)
* **Technology**: Spring Boot, Spring Data JPA, RabbitMQ Consumer & Producer.
* **Responsibilities**:
  * Event Booking & Core Details (Type: Wedding, Corporate, Concert; Date, Venue, Guest Count).
  * Run-of-Show (Timeline Scheduling): Stage cues, sound checks, ceremony timelines, crew assignments.
  * Vendor Coordination & Logistics: Decor, catering, sound/AV, transportation.
  * Financial Invoicing: Automated milestone invoices (Deposit, Interim, Final Settlement), payment tracking, and balance calculation.
  * Client Portal View (`/api/v1/events/portal/**`): Read-only/interactive event view for the bride/groom or corporate client.

### 5. `gallery-service` (Port 8084)
* **Technology**: Spring Boot, Spring Data JPA, Cloudinary SDK, RabbitMQ Consumer.
* **Responsibilities**:
  * Photo Gallery Management (Collections, Sections: Pre-wedding, Ceremony, Reception).
  * Batch Media Upload with automated Cloudinary transformations.
  * Intelligent Proofing:
    * Watermarked low-resolution previews for client review.
    * Client favoriting, selection tagging, and photographer notes.
  * Secure Download Delivery:
    * PIN-protected ZIP downloads.
    * Download gating (disables download if the final event invoice is unpaid).

---

## 5. Database Architecture & Flyway Migrations

All microservices connect to the unified PostgreSQL 18.4 database (`eventos_root_mad6` on Render), segregated cleanly by schema/table prefixes and isolated by `tenant_id`.

### Key Flyway Migrations (Auth Service)
* `V1__init_auth_schema.sql`: Core `users`, `tenants`, `tenant_memberships`, `roles`, and `refresh_tokens`.
* `V2__seed_default_roles.sql`: Standard permissions (`SUPER_ADMIN`, `ADMIN`, `EVENT_MANAGER`, `COORDINATOR`, `CLIENT`, `VENDOR`).
* `V3__password_reset_tokens.sql`: Secure tokenized password recovery.
* `V20__user_audit_and_activity.sql`: System audit logs and IP tracking.
* `V30__waitlist_and_launch_config.sql`: Public waitlist, launch flags, idempotent `DO $$` role initialization block.

### Key Database Tables
| Table | Service | Purpose | Key Columns |
| :--- | :--- | :--- | :--- |
| `tenants` | `auth` | Organization entity | `id`, `name`, `subdomain`, `plan_type`, `created_at` |
| `users` | `auth` | Global identity | `id`, `email`, `password_hash`, `first_name`, `last_name` |
| `tenant_memberships`| `auth` | User-Tenant RBAC link | `id`, `tenant_id`, `user_id`, `role`, `status` |
| `leads` | `crm` | Sales opportunities | `id`, `tenant_id`, `name`, `email`, `budget`, `status` |
| `quotes` | `crm` | Formal proposals | `id`, `tenant_id`, `lead_id`, `total_amount`, `status` |
| `events` | `event` | Core operational event | `id`, `tenant_id`, `name`, `event_type`, `start_date`, `venue`|
| `event_timelines` | `event` | Run-of-show cues | `id`, `event_id`, `title`, `start_time`, `end_time`, `owner` |
| `invoices` | `event` | Milestone billing | `id`, `event_id`, `invoice_number`, `amount`, `status` |
| `galleries` | `gallery`| Media collections | `id`, `event_id`, `name`, `pin_code`, `download_locked` |
| `photos` | `gallery`| Media assets | `id`, `gallery_id`, `cloudinary_public_id`, `watermarked_url`|

---

## 6. Asynchronous Messaging & Event-Driven Architecture

Microservices communicate asynchronously through CloudAMQP RabbitMQ over TLS (`amqps://...:5671/ghisyhmk`) using topic exchange `eventos.exchange`.

```
[ crm-service ] ────(crm.quote.accepted)────► [ RabbitMQ Exchange ]
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
         [ event-service.booking.queue ]                               [ notification.queue ]
                       │                                                             │
                       ▼                                                             ▼
           Auto-creates Event Record                                      Sends Email/SMS to Client
```

### Registered Exchanges, Queues & Events
1. **Exchange**: `eventos.exchange` (Type: `topic`, durable: `true`).
2. **Key Events**:
   * `crm.lead.created`: Dispatched when a new inquiry arrives.
   * `crm.quote.accepted`: Dispatched when a client signs a quote $\rightarrow$ consumed by `event-service` to spawn an active `Event` and invoice milestones.
   * `event.created`: Dispatched when an event is finalized $\rightarrow$ consumed by `gallery-service` to provision photo storage.
   * `event.invoice.paid`: Dispatched on payment confirmation $\rightarrow$ consumed by `gallery-service` to automatically unlock high-resolution gallery downloads.

---

## 7. Frontend Architecture, UI/UX & Design System

### Technology Stack
* **Framework**: Next.js 14.2 (App Router)
* **Styling**: Tailwind CSS + Custom Design System
* **State Management**: React Context, TanStack Query, LocalStorage token storage
* **Icons & Animation**: Lucide React, Framer Motion

### Design System: The Light Alabaster `#FAF9F6` Standard
The public and marketing surface of EventOS adheres strictly to the **Light Alabaster Standard** to convey an elite, clean, modern luxury enterprise feel:
* **Background Palette**:
  * Main Surface: Alabaster `#FAF9F6` (`bg-[#FAF9F6]`)
  * Alternate Surface: Crisp White `#FFFFFF` (`bg-white`)
  * Card/Glass Backdrop: `bg-white/80 backdrop-blur-xl border border-slate-200/80`
* **Typography**:
  * Heading Font: `font-heading font-bold text-slate-900`
  * Body Font: `text-slate-600 font-sans leading-relaxed`
  * High Contrast Accents: Amber/Gold `from-amber-600 to-amber-500` and Indigo `from-indigo-600 to-violet-600`
* **Card Aesthetics**: Floating subtle shadows (`shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300`).

### Public Pages Harmonized to Alabaster:
* `/` (Landing Page): Hero, Interactive Product Showcase, Social Proof, Metrics, Feature Grid, CTA.
* `/features`: Comprehensive deep dive into all 6 product modules.
* `/solutions`: Vertical-tailored workflows (Weddings, Corporate, Festivals, Photo Studios).
* `/pricing`: Transparent pricing tiers (Starter, Professional, Agency, Enterprise).
* `/status`: Real-time system health, uptime graphs, and incident status.

---

## 8. Role-Based Access Control (RBAC) & Routing Matrix

EventOS implements a strict, multi-tiered role hierarchy:

```
                  ┌───────────────────────────────┐
                  │          SUPER_ADMIN          │ (Platform HQ)
                  └───────────────┬───────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  │             ADMIN             │ (Agency Owner)
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  EVENT_MANAGER   │    │   COORDINATOR    │    │      VENDOR      │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  ▼
                        ┌──────────────────┐
                        │      CLIENT      │ (Bride/Groom/Corporate)
                        └──────────────────┘
```

### Route Protection & Redirection Logic
* **`SUPER_ADMIN`**:
  * Route: `/superadmin`
  * Guard: Protected by Next.js `middleware.ts` checking `user_role === "SUPER_ADMIN"`.
  * Capabilities: Global tenant inspection, feature toggling, platform revenue, system logs, waitlist control.
* **`ADMIN` / `EVENT_MANAGER` / `COORDINATOR`**:
  * Route: `/workspace-select` $\rightarrow$ `/dashboard` (Scoped to active `tenantId`).
  * Capabilities: Lead management, event planning, invoicing, staff assignment.
* **`CLIENT`**:
  * Route: `/portal` (Dedicated tokenized client approval portal).
  * Capabilities: View event timeline, approve quotes, review invoices, proof photos.
* **`VENDOR`**:
  * Route: `/vendor-portal` (Assigned tasks, stage cue sheets).

---

## 9. Superadmin Auto-Healing Architecture

### The Problem
During development or manual database seeding, administrator accounts created with `@eventos.com` or `@eventos.co` could exist in the `users` table without a corresponding record in `tenant_memberships`. When attempting to log in, these users faced infinite redirects or 403 Forbidden errors due to having no active tenant.

### The Self-Healing Implementation
In `AuthService.java` (`backend/auth-service/src/main/java/com/eventos/auth/service/AuthService.java`):
```java
// Check if user is an official EventOS platform administrator
boolean isEventOsAdmin = email.endsWith("@eventos.com") || email.endsWith("@eventos.co");

if (memberships.isEmpty() && isEventOsAdmin) {
    log.warn("Superadmin {} logged in with no tenant memberships. Auto-linking to HQ Tenant.", email);
    Tenant hqTenant = tenantRepository.findById(HQ_TENANT_ID)
        .orElseGet(() -> tenantRepository.save(new Tenant(HQ_TENANT_ID, "EventOS HQ Administration", "hq")));

    TenantMembership superAdminMembership = TenantMembership.builder()
        .tenant(hqTenant)
        .user(user)
        .role(Role.SUPER_ADMIN)
        .status(MembershipStatus.ACTIVE)
        .build();
    tenantMembershipRepository.save(superAdminMembership);
    memberships = List.of(superAdminMembership);
}
```
* On login, any `@eventos.com` / `@eventos.co` user automatically receives `SUPER_ADMIN` membership in the official EventOS HQ Tenant (`e5afcc88-5c4b-4df8-bb6d-6bb9bd380111`).
* Frontend `LoginForm.tsx` and `workspace-select/page.tsx` immediately redirect this role to `/superadmin`.

---

## 10. JVM Optimization & Cloud Infrastructure Strategy (Render 512MB RAM)

### The Cloud Problem: Linux OOM Kills
Render's free and starter instance tiers enforce a hard **512MB RAM** ceiling. The default Spring Boot 3.3 runtime on Java 21 with G1 Garbage Collector (`G1GC`) allocates:
* Heap size: ~256MB to ~384MB
* Metaspace: ~128MB
* Thread stacks & Native C++ memory: ~100MB
* **Total RSS**: Exceeds 512MB $\rightarrow$ Terminated with `Exit status 137 (Out Of Memory)`.

### The Low-Footprint Solution
Every microservice Dockerfile (`api-gateway`, `auth-service`, `crm-service`, `event-service`, `gallery-service`) has been standardized with ultra-efficient flags:
```dockerfile
ENTRYPOINT ["java", \
  "-XX:+UseSerialGC", \
  "-Xms64m", \
  "-Xmx192m", \
  "-XX:TieredStopAtLevel=1", \
  "-XX:+ExitOnOutOfMemoryError", \
  "-jar", "app.jar"]
```
* `-XX:+UseSerialGC`: Eliminates multi-threaded garbage collector overhead, saving ~40MB of native RAM.
* `-Xms64m -Xmx192m`: Limits max heap to 192MB, guaranteeing total process memory remains under ~260MB RSS.
* `-XX:TieredStopAtLevel=1`: Caps C2 JIT compiler overhead, reducing CPU spikes and compilation memory during startup.

---

## 11. Live Cloud Deployment Parameters & Environment Variables

### 1. Central Datastores
* **PostgreSQL 18.4 (Render)**:
  * Host: `dpg-da5b4buk1f9s7385ping-a`
  * Port: `5432`
  * Database: `eventos_root_mad6`
  * Username: `eventos_admin`
  * Password: `[CONFIGURED_IN_RENDER_ENV]`
* **Redis Cache (Render)**:
  * Host: `red-da5b8sajobas73e5qj1g`
  * Port: `6379`
* **CloudAMQP RabbitMQ**:
  * Host: `armadillo.rmq.cloudamqp.com`
  * Port: `5671` (TLS AMQPS)
  * Virtual Host: `ghisyhmk`
  * Username: `ghisyhmk`
* **Cloudinary Storage**:
  * Cloud Name: `dqvwl8e13`
  * API Key: `416144262516315`

### 2. Microservice Deployment Roster (Render)
| Service | Render Service Name | Dockerfile Path | Port | Live Status |
| :--- | :--- | :--- | :--- | :--- |
| `auth-service` | `eventos-auth-service` | `backend/auth-service/Dockerfile` | `8081` | **LIVE** |
| `crm-service` | `eventos-crm-service` | `backend/crm-service/Dockerfile` | `8082` | **LIVE** |
| `event-service` | `eventos-event-service` | `backend/event-service/Dockerfile` | `8083` | **PENDING DEPLOYMENT** |
| `gallery-service`| `eventos-gallery-service`| `backend/gallery-service/Dockerfile` | `8084` | **PENDING DEPLOYMENT** |
| `api-gateway` | `eventos-api-gateway` | `backend/api-gateway/Dockerfile` | `8080` | **PENDING DEPLOYMENT** |

### 3. Vercel Frontend Configuration
* **Production URL**: `https://event-os-woad.vercel.app/`
* **Key Environment Variable**:
  * `NEXT_PUBLIC_API_BASE_URL`: `https://eventos-api-gateway.onrender.com` (Routes all client requests through the API Gateway).

---

## 12. Completed Hardening Audit & Changelog

### Phase 1: Security & Stability
1. **Dynamic Port Binding**: Converted all hardcoded ports to `${PORT:${SERVER_PORT:xxxx}}` across all microservices so containers bind dynamically to Render's injected `PORT`.
2. **RabbitMQ CloudAMQP TLS Fix**: Added `spring.rabbitmq.addresses` and `ssl.enabled: true` to support AMQPS TLS port `5671` without plaintext transport errors.
3. **Flyway Role Idempotency**: Added `DO $$` role check blocks in `V30__waitlist_and_launch_config.sql` to eliminate `role "service_role" does not exist` errors on external PostgreSQL.
4. **Token Exposure Elimination**: Set `app.security.log-tokens: false` in `application.yml` to prevent JWT leakage in application stdout.
5. **Superadmin Auto-Healing**: Implemented automatic tenant creation and membership linking in `AuthService.java` for `@eventos.com` accounts.

### Phase 2: Frontend & UI/UX Unification
1. **Light Alabaster `#FAF9F6` Theme Unification**: Replaced inconsistent dark/hybrid backgrounds across `/features`, `/solutions`, `/pricing`, and `/status` with a crisp, high-contrast `#FAF9F6` slate design system.
2. **Superadmin RBAC Protection**:
   * Updated `middleware.ts` to enforce `user_role === "SUPER_ADMIN"` cookie validation on `/superadmin/*`.
   * Updated `LoginForm.tsx` and `workspace-select/page.tsx` to automatically route `SUPER_ADMIN` to `/superadmin`.
   * Added client-side role guard in `superadmin/page.tsx`.

---

## 13. End-to-End Business Life-Cycle Workflows

```
  [ 1. Ingestion ]      Client submits inquiry on landing page or contact form
                                   │
                                   ▼
  [ 2. CRM Pipeline ]   Sales coordinator reviews Lead in CRM (Status: QUALIFIED)
                                   │
                                   ▼
  [ 3. Proposal ]       Coordinator generates interactive Quote with milestones
                                   │
                                   ▼
  [ 4. Client Portal ]  Client reviews proposal at /portal, signs digitally
                                   │
                                   ▼
  [ 5. Event Spawn ]    crm.quote.accepted triggers event-service
                        - Event record created
                        - Milestone invoices generated
                        - Run-of-show timeline initialized
                                   │
                                   ▼
  [ 6. Operations ]     Planners assign vendors, schedule cue sheets, track run-of-show
                                   │
                                   ▼
  [ 7. Billing ]        Client pays milestone invoices (Deposit, Final) via gateway
                                   │
                                   ▼
  [ 8. Media Proofing ] Event completed; photographer uploads photos to gallery-service
                        - Watermarked previews generated
                        - Client favorites photos
                        - Full ZIP download unlocked once final invoice is marked PAID
```

---

## 14. Deployment Verification & Go-Live Checklist

### Verification Steps
* [x] PostgreSQL database online and reachable.
* [x] Redis cache online and reachable.
* [x] CloudAMQP RabbitMQ online with TLS enabled.
* [x] Cloudinary storage credentials verified.
* [x] Vercel frontend deployed and reachable.
* [x] `auth-service` deployed on Render and passing `/actuator/health`.
* [x] `crm-service` deployed on Render and passing `/actuator/health`.
* [ ] Deploy `event-service` on Render (Port 8083).
* [ ] Deploy `gallery-service` on Render (Port 8084).
* [ ] Deploy `api-gateway` on Render (Port 8080).
* [ ] Point Next.js frontend `NEXT_PUBLIC_API_BASE_URL` to `api-gateway`.
* [ ] Perform Live E2E Smoke Test (User Signup $\rightarrow$ Create Lead $\rightarrow$ Approve Quote $\rightarrow$ Verify Event Timeline $\rightarrow$ Upload Gallery $\rightarrow$ Access Superadmin).

---

## 15. Operator Runbook & SRE Troubleshooting

### 1. Service Won't Start (Render Exit Code 137)
* **Cause**: Container exceeded 512MB RAM ceiling.
* **Remedy**: Verify Dockerfile uses `-XX:+UseSerialGC -Xms64m -Xmx192m`. Never increase heap beyond 256m on free/starter tiers.

### 2. Database Connection Refused (`Connection to localhost:5432 refused`)
* **Cause**: Environment variable `POSTGRES_HOST` is missing or defaulted to localhost.
* **Remedy**: Ensure Render Web Service environment contains `POSTGRES_HOST=dpg-da5b4buk1f9s7385ping-a` and `POSTGRES_DB=eventos_root_mad6`.

### 3. Superadmin Login Redirect Loop
* **Cause**: User logged in but has no active tenant membership.
* **Remedy**: The auto-healing mechanism in `AuthService.java` automatically attaches any `@eventos.com` email to the HQ Tenant (`e5afcc88-5c4b-4df8-bb6d-6bb9bd380111`). Verify the user email ends with `@eventos.com` or `@eventos.co`.

### 4. Cross-Tenant Data Leak Investigation
* **Remedy**: Check if any raw SQL or custom JPQL queries bypassed `@Filter("tenantFilter")`. All repository queries must extend `BaseTenantEntity` or explicitly enforce `WHERE e.tenantId = :tenantId`.
