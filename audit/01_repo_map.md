# Phase 1: Repository Architecture Map & Codebase Hygiene Audit

> **Target Repository**: EventOS  
> **Auditor**: Senior Staff Engineer & Security Auditor  
> **Date**: October 2026  
> **Scope**: Repository structure, services, entry points, dependencies, port bindings, database schemas, Flyway migrations, environment variables, container topology, Caddy proxy, dead code, unused files, duplicate logic, and commented code.

---

## 1. Complete Repository Folder Tree & Architecture Map

```
EventOs/
├── .env                              # Local env file (contains live secrets)
├── .env.example                      # Template env file
├── .gitignore                        # Git ignore patterns
├── Caddyfile                         # Production reverse proxy config for api.eventosapp.in
├── docker-compose.yml                # Main/local full-stack multi-container composition
├── docker-compose.prod.yml           # Production Docker Compose orchestration
├── docker-compose.staging.yml        # Staging orchestration
├── docker-compose.dev.yml            # Minimal dev dependencies (Postgres, Redis, RabbitMQ)
├── backup.sql                        # 0-byte empty file in root
├── seed_admin.sql                    # SQL seed script with hardcoded BCrypt hashes and superadmins
├── docker/
│   ├── postgres/init-db.sql          # DB creation script (auth_db, crm_db, event_db, payment_db, gallery_db)
│   ├── nginx/                        # Legacy Nginx configs (superseded by Caddy)
│   ├── monitoring/                   # Prometheus & Grafana configurations
│   └── logging/                      # Loki & Tempo observability configurations
├── backend/
│   ├── pom.xml                       # Root Maven Parent POM (Java 17, Spring Boot 3.3.0, Spring Cloud 2023.0.1)
│   ├── api-gateway/                  # Spring Cloud Gateway (Port 8080)
│   ├── auth-service/                 # Identity, Tenants, RBAC, Subscriptions (Port 8081, auth_db)
│   ├── crm-service/                  # Leads, Quotations, Dynamic Pricing, Proposals (Port 8082, crm_db)
│   ├── event-service/                # Bookings, Invoices, Run-of-Show Cues, Staff, Audit (Port 8083, event_db)
│   └── gallery-service/              # Media Albums, Cloudinary Proofing, PIN Shares (Port 8084, gallery_db)
└── web/                              # Next.js 15 Web Application (Port 3000)
    ├── package.json                  # Next.js 15.0.0, React 19.0.0-rc, TypeScript 5.4.5, Tailwind CSS
    ├── next.config.ts                # Edge rewrites, security headers, image optimization
    ├── src/
    │   ├── app/                      # App router (59 route segments)
    │   ├── components/               # UI components, CRM Kanban, Booking Workspace, AI Copilot
    │   ├── lib/                      # API client, Redis helper, waitlist direct Postgres pool
    │   └── store/                    # Zustand client state stores (authStore.ts, etc.)
```

---

## 2. Microservices Breakdown & Service Profiles

| Service | Technology | Port | Database Schema | Primary Entry Point | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`api-gateway`** | Spring Cloud Gateway (Netty) | `8080` | None (Stateless + Redis) | `com.eventos.gateway.ApiGatewayApplication` | Reverse proxy routing, WebSocket upgrade proxy, distributed rate-limiting, CORS handling. |
| **`auth-service`** | Spring Boot 3.3.0, Spring Security 6 | `8081` | `auth_db` (PostgreSQL) | `com.eventos.auth.AuthServiceApplication` | Multi-tenant tenant isolation (`tenant_id`), JWT issuance/refresh/revocation, RBAC, STOMP presence, subscription billing. |
| **`crm-service`** | Spring Boot 3.3.0, JPA, RabbitMQ | `8082` | `crm_db` (PostgreSQL) | `com.eventos.crm.CrmServiceApplication` | Lead management, Kanban board, dynamic quote calculator, itemized budgets, proposal e-signatures. |
| **`event-service`** | Spring Boot 3.3.0, JPA, Redis | `8083` | `event_db` (PostgreSQL) | `com.eventos.event.EventServiceApplication` | Booking management (`EVT-XXXXXX`), financial ledger, stage cue sheets, staff assignments, invoices, audit trails. |
| **`gallery-service`** | Spring Boot 3.3.0, Cloudinary API | `8084` | `gallery_db` (PostgreSQL) | `com.eventos.gallery.GalleryServiceApplication` | Event albums, Cloudinary proofing, PIN-protected public share links (`/share/[token]`), streaming ZIP packaging. |
| **`web`** | Next.js 15, React 19-rc, Node 20 | `3000` | None (Direct DB pool in waitlist) | `web/src/app/page.tsx` & `web/src/app/layout.tsx` | Responsive B2B dashboard, public client portals, marketing landing pages, AI Copilot interface. |

---

## 3. Database Schemas & Flyway Migration Inventory

PostgreSQL 17 contains 4 active databases initialized via `docker/postgres/init-db.sql`:

### 3.1 `auth_db` (27 Migrations)
- `V1__init_auth_tables.sql`: Base tables (`users`, `tenants`, `companies`, `roles`, `permissions`, `refresh_tokens`).
- `V2__add_memberships_table.sql`: Junction table mapping users to tenants with specific roles.
- `V3__database_hardening.sql`: Foreign keys and indexes.
- `V4__add_branding_colors.sql`: Tenant white-label customization fields.
- `V5__add_auth_sessions_and_invitations.sql`: User active login sessions and team invitation tokens.
- `V6__seed_owner_role.sql`: `OWNER` role initialization.
- `V7__add_browser_to_sessions_and_audit_logs.sql`: Session user-agent metadata and auth audit logs.
- `V8__settings_tables.sql`: Agency workspace configuration parameters.
- `V9__enterprise_security_features.sql`: Security settings, MFA flags, IP whitelists.
- `V10__saas_tables.sql`: Subscriptions, plan tiers (`STARTER`, `PRO`, `ENTERPRISE`), usage meters.
- `V11__add_super_admin_role_and_user.sql`: Initial superadmin role creation.
- `V12__add_inquiries_table.sql`: Public landing page lead inquiries table.
- `V13__add_super_admin_sub_role_users.sql`: Support, finance, and operations internal accounts.
- `V14__performance_indexes.sql`: B-Tree indexes on `memberships`, `users`, and `tenants`.
- `V15__fix_superadmin_password_hash.sql`: Password hash adjustment.
- `V30__waitlist_and_launch_config.sql`: Waitlist table and launch feature flags.
- `V31__update_pricing_plans.sql`: Pricing updates.
- `V32__add_whatsapp_config_to_companies.sql`: WhatsApp API settings on companies.
- `V33__verify_system_admin_emails.sql`: Email verification flags for system admins.
- `V34__standardize_canonical_pricing_plans.sql`: Canonical subscription plans.
- `V35__add_eventosapp_in_superadmin.sql`: Superadmin tenant binding.
- `V36__password_reset_security_indices.sql`: Security indexes for password resets.
- `V37__superadmin_granular_roles.sql`: Granular permissions (`can_manage_billing`, `can_view_metrics`).
- `V38__tenant_scoped_roles.sql`: Scoped tenant roles.
- `V39__secure_admin_bootstrap.sql`: Bootstrap token verification.
- `V40__activate_superadmin.sql`: Status activation.
- `V41__superadmin_complete_platform_tables.sql`: Platform audit logs, revenue metrics, system incidents.

### 3.2 `crm_db` (10 Migrations)
- `V2__init_crm_tables.sql`: Leads table (`leads`), lead activities. *(Note: V1 migration is missing)*.
- `V3__init_quote_tables.sql`: Quotes (`quotes`), line items (`quote_items`).
- `V4__add_tenant_sequence.sql`: Sequential quote and proposal numbering generator.
- `V5__database_hardening.sql`: Referential integrity and indexes.
- `V6__extend_quote_pdf_and_status.sql`: PDF URL and status fields.
- `V7__quote_versioning_and_constraints.sql`: Versioning and contract approval constraints.
- `V8__add_contacts_table_and_relate_leads.sql`: CRM contacts database.
- `V9__rename_lead_activities_to_activities.sql`: Unified activity stream.
- `V10__update_lead_statuses.sql`: Expanded lead pipeline statuses.
- `V11__add_share_token_to_quotes.sql`: Public proposal portal share tokens.

### 3.3 `event_db` (27 Migrations)
- `V1__init_event_tables.sql`: Master events table (`events`).
- `V2__init_booking_tables.sql`: Bookings (`bookings`), timeline events (`booking_timeline_events`).
- `V3__init_budget_tables.sql`: Event budgets and categories.
- `V4__init_payment_tables.sql`: Invoices and payment transactions.
- `V5__database_hardening.sql`: Performance indexes on event dates and statuses.
- `V6__database_hardening.sql`: Duplicate named migration adding index constraints.
- `V7__extend_events_and_create_tasks.sql`: Tasks table (`tasks`).
- `V8__add_booking_quote_ref_and_audit_log.sql`: `booking_audit_logs` table and quote references.
- `V9__add_budget_estimate_venue_and_pricing_rules.sql`: Budget estimate models.
- `V10__add_transactions_and_invoice_paid_amount.sql`: Payment transactions ledger.
- `V11__booking_constraints.sql`: Foreign key cascades.
- `V12__budget_constraints_and_locking.sql`: Optimistic locking on budgets.
- `V13__invoice_constraints_and_ledger.sql`: Invoice constraints.
- `V14__add_tenant_id_to_missing_tables.sql`: Tenant isolation backfill.
- `V15__rename_event_tasks_to_timeline_tasks.sql`: Renamed to `timeline_tasks`.
- `V16__create_generic_audit_logs.sql`: Generic audit log structure.
- `V17__init_vendor_management.sql`: Vendor directory and category models.
- `V18__add_client_id_and_event_type_to_bookings.sql`: Client references on bookings.
- `V19__event_planning_days_and_venues.sql`: Multi-day itinerary (`event_days`) and venues (`event_venues`).
- `V20__add_timeline_milestones_and_task_management.sql`: Stage cues and run-of-show milestones.
- `V21__add_vendor_categories_and_payment_status.sql`: Vendor payment tracking.
- `V22__add_budget_management.sql`: Expense line items and payment milestones.
- `V23__add_invoice_history_and_pdf.sql`: PDF invoice generation fields.
- `V24__make_booking_event_id_nullable.sql`: Allows direct quote-to-booking conversions without pre-created events.
- `V25__add_client_fields_to_bookings.sql`: Denormalized client metadata (`client_name`, `client_email`, `client_phone`).
- `V26__billing_settings.sql`: Tenant tax, GSTIN, currency, and invoice prefix configurations.
- `V27__add_version_and_locking_to_bookings.sql`: Version column (`version BIGINT DEFAULT 0`) for optimistic locking.

### 3.4 `gallery_db` (9 Migrations)
- `V1__init_gallery_tables.sql`: Albums (`albums`) and media items (`gallery_items`).
- `V2__database_hardening.sql`: Foreign keys.
- `V3__create_share_links_table.sql`: Public share tokens (`share_links`) with PIN protection.
- `V4__migrate_expires_at_to_utc.sql`: Expiration timestamp normalization.
- `V5__add_media_organization_fields.sql`: Sub-galleries and tags.
- `V6__add_album_status_visibility_cover_image.sql`: Album visibility and cover pictures.
- `V7__add_gallery_item_dimension_and_resource_type.sql`: Width, height, format, resource type.
- `V8__add_share_link_download_permission_and_audit_log.sql`: Download restrictions and share access logs.
- `V9__add_watermark_to_share_links.sql`: Watermarking flags on public links.

---

## 4. Environment Variables & Secret Configuration Audit

| Variable Name | Declared Location | Purpose | Security Finding / Default Risk |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET_KEY` | `.env`, `docker-compose.yml`, `application.yml` | HMAC-SHA256 signing key for JWTs | **HIGH**: Hardcoded default string fallback (`9a4f2c8d7e6b5a3f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d`) in all 5 microservices. |
| `RAZORPAY_KEY_ID` | `docker-compose.yml:91`, `docker-compose.prod.yml:98`, `auth-service/application.yml:120` | Razorpay payment integration | **CRITICAL**: Real live production Razorpay Key ID (`rzp_live_TjIIttn39f18sO`) committed as fallback value. |
| `RAZORPAY_KEY_SECRET` | `docker-compose.yml:92`, `docker-compose.prod.yml:99`, `auth-service/application.yml:121` | Razorpay API Secret | **CRITICAL**: Real live production Razorpay Secret (`c1B76Np8hv3Ckj8y2WxiZIIT`) committed as fallback value. |
| `BOOTSTRAP_SECRET` | `docker-compose.prod.yml:93`, `auth-service/application.yml:102` | Admin activation key | **HIGH**: Default secret committed (`superadmin_secure_bootstrap_key_2026!`). |
| `GATEWAY_TRUST_SECRET` | `docker-compose.prod.yml:91`, `application.yml:91` | Gateway-to-service trust token | **MEDIUM**: Default secret committed (`eventos_gateway_secure_shared_secret`). |
| `ENCRYPTION_KEY` | `docker-compose.prod.yml:92`, `auth-service/application.yml:105` | Database field encryption | **HIGH**: Hardcoded encryption key (`e7f9a2b4c6d8e0f1a3b5c7d9e1f3a5b7`). |
| `POSTGRES_PASSWORD` | `docker-compose.yml:9`, `application.yml:25` | Database root password | **HIGH**: Default password (`eventos_secure_pass`) committed across configurations. |

---

## 5. Container & Infrastructure Topology Audit

### 5.1 Docker Compose Configurations
Three distinct Compose files exist with divergent specifications:
1. `docker-compose.yml`: Local full stack including telemetry, MailHog, pgAdmin, and Nginx.
2. `docker-compose.prod.yml`: Production stack with restart policies, Caddy compatibility, and health checks.
3. `docker-compose.dev.yml`: Dependency-only stack (PostgreSQL, Redis, RabbitMQ) for local IDE runs.

### 5.2 Caddy Reverse Proxy Configuration (`Caddyfile`)
- **Location**: `d:\EventOs\Caddyfile`
- **Configuration Analysis**:
  ```caddy
  api.eventosapp.in {
      @cors_preflight method OPTIONS
      handle @cors_preflight {
          header Access-Control-Allow-Origin "{header.Origin}"
          header Access-Control-Allow-Credentials "true"
          ...
      }
      handle {
          header Access-Control-Allow-Origin "{header.Origin}"
          header Access-Control-Allow-Credentials "true"
          reverse_proxy api-gateway:8080 {
              header_up Origin "http://localhost:3000"
          }
      }
  }
  ```
- **Vulnerability**: Reflects any requested `Origin` header while setting `Access-Control-Allow-Credentials: true`. Overrides upstream Origin header to `http://localhost:3000`.

---

## 6. Dead Code, Unused Files & Code Hygiene Findings

### Finding 1.1: [HIGH] Live Payment Gateway Credentials Hardcoded as Fallback Defaults
- **Location**: `d:\EventOs\docker-compose.yml:91-92`, `d:\EventOs\docker-compose.prod.yml:98-99`, `d:\EventOs\backend\auth-service\src\main\resources\application.yml:120-121`
- **Evidence**:
  ```yaml
  RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID:-rzp_live_TjIIttn39f18sO}
  RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET:-c1B76Np8hv3Ckj8y2WxiZIIT}
  ```
- **Impact**: Live Razorpay production credentials are baked into version control. Anyone with read access to the repo can charge or view payments.
- **Fix**: Strip all default fallback values from compose files and `application.yml`. Enforce mandatory environment variable injection without defaults. Immediately roll/regenerate keys in the Razorpay Dashboard.

---

### Finding 1.2: [HIGH] Production Database & RabbitMQ Management Ports Exposed to Public 0.0.0.0
- **Location**: `d:\EventOs\docker-compose.prod.yml:13`, `d:\EventOs\docker-compose.prod.yml:49-51`
- **Evidence**:
  ```yaml
  ports:
    - "5432:5432"
  ...
  ports:
    - "5672:5672"
    - "15672:15672"
  ```
- **Impact**: Production PostgreSQL database and RabbitMQ web management console are exposed directly on the public internet of the VPS host rather than remaining within the private Docker bridge network (`eventos-prod-net`).
- **Fix**: Remove the `ports` block for `postgres` and `rabbitmq` in `docker-compose.prod.yml`, or bind them strictly to `127.0.0.1:5432:5432` for administrative SSH tunnels.

---

### Finding 1.3: [MEDIUM] Over-Permissive Wildcard CORS Reflection in Caddyfile
- **Location**: `d:\EventOs\Caddyfile:4`, `d:\EventOs\Caddyfile:13`
- **Evidence**:
  ```caddy
  header Access-Control-Allow-Origin "{header.Origin}"
  header Access-Control-Allow-Credentials "true"
  ```
- **Impact**: Caddy dynamically reflects back whichever Origin header is supplied by the browser and pairs it with `Allow-Credentials: true`. An arbitrary malicious site can issue authenticated cross-origin requests using victim cookies/credentials.
- **Fix**: Replace `{header.Origin}` with an explicit whitelist:
  ```caddy
  @allowedOrigins header_regexp Origin ^https?://(www\.)?(eventosapp\.in|localhost:3000)$
  header @allowedOrigins Access-Control-Allow-Origin "{header.Origin}"
  ```

---

### Finding 1.4: [LOW] Phantom Database Initialization (`payment_db`)
- **Location**: `d:\EventOs\docker\postgres\init-db.sql:5`, `d:\EventOs\docker\postgres\init-db.sql:20-22`
- **Evidence**:
  ```sql
  CREATE DATABASE payment_db;
  \c payment_db;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  ```
- **Impact**: `payment_db` is created upon every fresh database container bootstrap, but no microservice connects to or utilizes it. All payment logic resides in `event-service` (`event_db`).
- **Fix**: Remove `payment_db` from `init-db.sql` to avoid confusing operators.

---

### Finding 1.5: [LOW] JVM Hotspot Crash Dumps & Garbage Files in Project Root
- **Location**: `d:\EventOs\backup.sql`, `d:\EventOs\hs_err_pid*.log`, `d:\EventOs\replay_pid*.log`, `d:\EventOs\test_run.log`
- **Evidence**:
  - `backup.sql` is a 0-byte orphan file.
  - 18 hotspot error crash dump logs (`hs_err_pid10356.log`, `hs_err_pid10980.log`, `hs_err_pid11612.log`, etc.) totaling > 1.2 MB.
  - `backend/test_run.log` is a stale 135 KB test execution output.
- **Impact**: Pollutes repository root, increases repository clone size, and exposes stack crash traces.
- **Fix**: Add `*.log`, `hs_err_pid*.log`, `replay_pid*.log`, and `*.sql` (outside `docker/`) to `.gitignore` and delete the orphan files.

---

### Finding 1.6: [LOW] Duplicate Migration Sequence in Event Service
- **Location**: `d:\EventOs\backend\event-service\src\main\resources\db\migration\V5__database_hardening.sql`, `V6__database_hardening.sql`
- **Evidence**:
  - Two sequential migrations carry identical titles (`database_hardening`), performing separate index creations.
  - `crm-service` starts at `V2__init_crm_tables.sql` with no `V1`.
- **Impact**: Violates Flyway migration naming conventions; missing `V1` in `crm-service` can cause confusion during fresh baseline configuration.
- **Fix**: Ensure Flyway documentation specifies why `V1` was skipped (or renamed), and establish a clear naming standard for migrations.

---

## 7. Files Reviewed in Phase 1

1. `d:\EventOs\backend\pom.xml`
2. `d:\EventOs\web\package.json`
3. `d:\EventOs\web\next.config.ts`
4. `d:\EventOs\web\src\lib\redis.ts`
5. `d:\EventOs\web\src\lib\waitlist-storage.ts`
6. `d:\EventOs\docker-compose.yml`
7. `d:\EventOs\docker-compose.prod.yml`
8. `d:\EventOs\docker-compose.dev.yml`
9. `d:\EventOs\Caddyfile`
10. `d:\EventOs\.env`
11. `d:\EventOs\.env.example`
12. `d:\EventOs\docker\postgres\init-db.sql`
13. `d:\EventOs\seed_admin.sql`
14. `d:\EventOs\backup.sql`
15. `d:\EventOs\backend\api-gateway\src\main\resources\application.yml`
16. `d:\EventOs\backend\auth-service\src\main\resources\application.yml`
17. `d:\EventOs\backend\crm-service\src\main\resources\application.yml`
18. `d:\EventOs\backend\event-service\src\main\resources\application.yml`
19. `d:\EventOs\backend\gallery-service\src\main\resources\application.yml`
20. `d:\EventOs\backend\auth-service\src\main\resources\db\migration\` (27 files)
21. `d:\EventOs\backend\crm-service\src\main\resources\db\migration\` (10 files)
22. `d:\EventOs\backend\event-service\src\main\resources\db\migration\` (27 files)
23. `d:\EventOs\backend\gallery-service\src\main\resources\db\migration\` (9 files)
