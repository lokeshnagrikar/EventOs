# Walkthrough: EventOS Features & Production Infrastructure

A complete production deployment stack has been created to secure, monitor, deploy, and backup the EventOS ecosystem.

Below is the updated walkthrough documenting the full environment setup.

---

## 1. Backend Microservices Updates & Security Remediation

### 🔒 API Gateway
- **[JwtAuthFilter.java](file:///d:/EventOs/backend/api-gateway/src/main/java/com/eventos/gateway/config/JwtAuthFilter.java)**:
  - **Header Spoofing Prevention**: Strips incoming custom headers (`X-Tenant-ID`, `X-User-ID`, `X-User-Email`, `X-User-Roles`) from all requests to prevent client-side parameter injection.
  - Extracts tenant ID, user ID, email, and roles from verified JWT claims, and injects them as headers downstream only for authenticated routes.

### 🔑 Auth Service
- **[SecurityConfig.java](file:///d:/EventOs/backend/auth-service/src/main/java/com/eventos/auth/config/SecurityConfig.java)**:
  - Removes the path `/api/v1/auth/settings/**` from public bypass permissions. Settings endpoints are now fully authenticated.
  - Integrates `JwtRequestFilter` to validate JWT signatures locally, and enables method-level security (`@EnableMethodSecurity`).
- **[SettingsController.java](file:///d:/EventOs/backend/auth-service/src/main/java/com/eventos/auth/controller/SettingsController.java)**:
  - Restricts settings modifications (Company profiles, team updates) to `ADMIN` and `MANAGER` roles using `@PreAuthorize` annotations.
  - Resolves tenant IDs from the validated SecurityContext rather than relying on raw request headers.
- **[AuthService.java](file:///d:/EventOs/backend/auth-service/src/main/java/com/eventos/auth/service/AuthService.java)**:
  - **Hardened Password Reset Flow**: Removes `debugResetToken` from JSON response payloads. Generates cryptographically secure tokens using `SecureRandom`.
  - Stores reset tokens in Redis with a 15-minute expiration and deletes them immediately upon use to enforce single-use restrictions.

### 🛡️ Downstream Services (CRM, Event, Gallery Services)
- **Zero-Trust Token Validation**: Added local Spring Security configurations (`SecurityConfig`) and JWT filters (`JwtRequestFilter`) to `crm-service`, `event-service`, and `gallery-service`. Downstream services validate JWT signatures and extract tenant context directly from the token, eliminating trust on raw HTTP headers.
- **Controllers Hardening**: Modified controllers (`QuoteController`, `CrmLeadController`, `BookingController`, `BudgetController`, `EventController`, `InvoiceController`, `PaymentController`, `AlbumController`, `GalleryItemController`) to resolve tenant context from the verified `SecurityContextHolder`.

### 🏢 Tenant Membership & Sequential Generation Row Locking (Phase 2)
- **Workspace Model**: Refactored the authentication model from a direct `User -> Tenant` structure to a membership-based workspace model (`User -> Membership -> Tenant`).
  - Added [Membership.java](file:///d:/EventOs/backend/auth-service/src/main/java/com/eventos/auth/entity/Membership.java) to record roles and statuses per workspace membership.
  - Users are now shared globally across tenant workspaces and can login to a specific tenant using the optional `tenantId` parameter, returning a list of all memberships.
  - Replaced direct tenant/company fields in [User.java](file:///d:/EventOs/backend/auth-service/src/main/java/com/eventos/auth/entity/User.java).
- **Tenant Isolation Hardening**: Refactored `getTenantId` in all controllers to throw `ResponseStatusException` (returning `400 Bad Request`) if the tenant context is empty or missing, completely removing the dev fallback `00000000-0000-0000-0000-000000000000`.
- **Sequential Integrity (Pessimistic Locks)**:
  - Created [TenantSequence.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/entity/TenantSequence.java) and [TenantSequenceRepository.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/repository/TenantSequenceRepository.java) in `crm-service` and `event-service`.
  - Implemented `@Lock(LockModeType.PESSIMISTIC_WRITE)` and `FOR UPDATE` queries to safely fetch, lock, and increment sequential quote (`QuoteService`), booking (`BookingService`), and invoice (`InvoiceService`) numbers.
- **Database Migrations (Flyway)**:
  - [V2__add_memberships_table.sql](file:///d:/EventOs/backend/auth-service/src/main/resources/db/migration/V2__add_memberships_table.sql) in `auth-service` to migrate existing associations, introduce `memberships`, and drop legacy user tenant columns.
  - [V4__add_tenant_sequence.sql](file:///d:/EventOs/backend/crm-service/src/main/resources/db/migration/V4__add_tenant_sequence.sql) in `crm-service` to drop global uniqueness constraints on quotes and introduce the sequence table.
  - [V5__database_hardening.sql](file:///d:/EventOs/backend/event-service/src/main/resources/db/migration/V5__database_hardening.sql) in `event-service` to consolidate bookings/invoices sequences, set composite unique keys, and configure cascading foreign keys.

---

## 2. Web Frontend Modules

- **Client Portal ([portal/page.tsx](file:///d:/EventOs/web/src/app/portal/page.tsx))**:
  - Displays summary statistics, interactive stepper event timelines, quotes list with Approve/Reject actions, invoices/payments statement tables, and a photo/video album gallery with custom slide lightbox (view-only).
- **Reports Dashboard ([reports/page.tsx](file:///d:/EventOs/web/src/app/reports/page.tsx))**:
  - **Revenue Reports**: Tracks received vs outstanding earnings, monthly revenue, and payment channels.
  - **Leads Reports**: Visualizes acquisition channels and funnel stage leakages.
  - **Events Reports**: Summarizes completion rates and event categorizations.
  - **Conversion Reports**: Calculates lead-to-booking conversions, time-to-book, and deal values.
- **Settings Console ([settings/page.tsx](file:///d:/EventOs/web/src/app/settings/page.tsx))**:
  - Company profile editor, Branding hex customizer, and Team member rosters (with register / revoke modal actions).

---

## 3. Production Infrastructure Setup

We created a hardened environment configuration matching enterprise deployment best practices.

### 🐋 Containerization
- **Hardened JVM Execution**: Java microservices use multi-stage Dockerfiles (`eclipse-temurin:21-jre-alpine` runtime) running with optimized GC parameters:
  `java -XX:+UseG1GC -Xms256m -Xmx512m -XX:+ExitOnOutOfMemoryError`
- **Next.js Production Builder**: Frontend Node container (`node:20-alpine`) compiles `.next` outputs and serves them statically in production.
- **[docker-compose.prod.yml](file:///d:/EventOs/docker-compose.prod.yml)**: Combines Postgres database schemas, Redis session caches, RabbitMQ event brokers, Java backend microservices, Next.js UI container, and Nginx proxy in a secure container network.

### 🌐 Nginx Reverse Proxy
- **[nginx.conf](file:///d:/EventOs/docker/nginx/nginx.conf)**: Configures high-performance worker connections and active Gzip compression for page loading metrics.
- **[default.conf](file:///d:/EventOs/docker/nginx/conf.d/default.conf)**:
  - Enforces HTTP-to-HTTPS redirect (redirects port 80 requests to port 443).
  - Proxy passes path `/` to Node frontend, and path `/api/v1` to the API gateway.
  - Protects microservices with **Rate Limiting** (`limit_req_zone rate=10r/s burst=20`).
  - Hardens headers: Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), Clickjacking protection (X-Frame-Options: DENY), and MIME-sniffing protection (X-Content-Type-Options: nosniff).

### 📈 Monitoring & Logging
- **[prometheus.yml](file:///d:/EventOs/docker/monitoring/prometheus.yml)**: Set up to scrape Actuator metrics from `http://<service-name>:<port>/actuator/prometheus` on all backend containers.
- **[datasources.yml](file:///d:/EventOs/docker/monitoring/grafana/provisioning/datasources/datasources.yml)**: Automatically registers Prometheus database source inside Grafana.
- **[logback-spring.xml](file:///d:/EventOs/docker/logging/logback-spring.xml)**: Output log formatter mapping production logging output to JSON standard.

### 🚀 CI/CD Pipeline
- **[deploy.yml](file:///d:/EventOs/.github/workflows/deploy.yml)**: GitHub Actions workspace workflow compiling Java projects, testing Next.js builds, building Docker images, and pushing tags to the GitHub Container Registry.

### 💾 Backup Strategy
- **[backup.sh](file:///d:/EventOs/docker/backup/backup.sh)**: Executable shell script trigger database SQL dumps of `crm_db`, `event_db`, `gallery_db`, and `auth_db`. Compresses outputs with Gzip, names them with timestamps, logs progress to a ledger, and automatically rotates backups older than 7 days.

---

## 4. How to Test Infrastructure

### A. SSL Certificate Setup
To test Nginx HTTPS locally, generate a self-signed key/cert pair inside the Nginx directory:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/eventos.key \
  -out docker/nginx/ssl/eventos.crt \
  -subj "/CN=localhost"
```

### B. Startup Stack
Start the production docker network:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
Verify all services are running:
- **Next.js Web Frontend**: `https://localhost` (proxied via SSL Nginx)
- **API Gateway Health Check**: `https://localhost/api/v1/auth/refresh`
- **Prometheus Targets Dashboard**: `http://localhost:9090/targets`
- **Grafana Workspace Portal**: `http://localhost:3001` (Prometheus datasource pre-wired)

### C. Trigger Manual Database Backup
To verify the database rotation script works, execute:
```bash
bash docker/backup/backup.sh
```
Check `./backups/` for the compressed `.sql.gz` database dumps and the `backup_ledger.log` audit trail.

---

## 5. Phase 3: Database Hardening

We have implemented strict schema validation controls and database query optimizations across the EventOS platform:

### A. Flyway Schema Validation Enforcement
- In each microservice's `application.yml`, the DDL auto-generation strategy has been hardened from `ddl-auto: update` to `ddl-auto: validate`.
- This ensures that Hibernate does not silently modify database structures at runtime, preventing schema drift and ensuring all modifications are strictly audited via Flyway migrations.

### B. Missing Indexes and Foreign Keys
We added SQL migrations across all microservices to optimize data query performance and reinforce integrity:
- **`auth-service` ([V3__database_hardening.sql](file:///d:/EventOs/backend/auth-service/src/main/resources/db/migration/V3__database_hardening.sql))**:
  - Configures a cascading foreign key constraint from `refresh_tokens(tenant_id)` to `tenants(id)`.
  - Creates lookup indexes on `refresh_tokens(tenant_id)` and `memberships(role_id)`.
- **`crm-service` ([V5__database_hardening.sql](file:///d:/EventOs/backend/crm-service/src/main/resources/db/migration/V5__database_hardening.sql))**:
  - Creates lookup indexes on `leads(company_id)` and `leads(assigned_user_id)`.
  - Creates a composite lookup index on `leads(tenant_id, email)` for fast email lookups.
- **`event-service` ([V6__database_hardening.sql](file:///d:/EventOs/backend/event-service/src/main/resources/db/migration/V6__database_hardening.sql))**:
  - Creates lookup indexes on `bookings(lead_id)` and `event_assignments(user_id)`.
- **`gallery-service` ([V2__database_hardening.sql](file:///d:/EventOs/backend/gallery-service/src/main/resources/db/migration/V2__database_hardening.sql))**:
  - Creates lookup indexes on `albums(tenant_id)` and `gallery_items(tenant_id)` to optimize tenant isolation query boundaries.

---

## 6. Phase 4: Performance Remediation

We have resolved frontend client-side rendering bottlenecks and modernized the notification system:

### A. Optimized Database Aggregations
- **CRM Service (`crm-service`)**: Refactored the lead budget summary query (`LeadRepository.java`) to select the average budget of `BOOKED` leads in a single database roundtrip, returning it under the stats payload (`averageBookedBudget`).
- **Reports Dashboard (`reports/page.tsx`)**: Refactored the dashboard to pull statistics directly from the dedicated `/stats` microservice endpoints (`/crm/leads/stats`, `/events/stats`, `/events/invoices/stats`, `/events/payments/stats`) instead of downloading massive, unpaginated records lists and running expensive `.reduce(...)` iterations on the browser.
- **Global Cache Expirations**: Configured the React Query default query client `staleTime` to `10 * 1000` (10 seconds) inside `providers.tsx` to balance database load while maintaining fresh UI updates.

### B. Custom Glassmorphism Toast System
- **Zustand Store (`toastStore.ts`)**: Built a reactive Zustand state hook that manages active notification objects, supporting success, error, and informational toast notifications.
- **Toast UI Component (`ToastContainer.tsx`)**: Created a floating overlay component rendering enqueued notification items as sleek, modern glassmorphism cards at the bottom-right corner. Features custom check, warning, and info icons along with subtle slide-in animations (`@keyframes slide-in` appended in `globals.css`).
- **Elimination of Blocking Alerts**: Replaced all native browser `alert()` popups in the Client Portal (`portal/page.tsx`) and Settings Console (`settings/page.tsx`) with non-blocking, smooth Zustand-triggered toast notifications.
