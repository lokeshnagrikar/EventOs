# EventOS Production Readiness Audit Report

This report provides a formal verification audit of the EventOS microservices architecture and frontend. The audit was conducted from the perspectives of a Principal Security Engineer, Senior DevOps Engineer, Senior QA Engineer, Senior Spring Boot Architect, Senior Next.js Architect, and SaaS CTO.

---

## 1. Executive Summary & Production Readiness Score

### **Production Readiness Score: 74% (B-)**

*   **Security (85%):** Highly secure token design, anti-header-spoofing gateway filters, and secure password reset policies. Minor risks around sandbox fallbacks in microservice route controllers.
*   **Multi-Tenancy (90%):** Strong multi-tenant structures in data schemas and JPA isolation filters. Composite unique keys exist on business sequence codes.
*   **Database (80%):** Solid Flyway migrations, explicit foreign keys, and index placements. Needs strict production profile configuration for Hibernate validation.
*   **Performance (50%):** Missing pagination on list APIs, mock dashboard metrics lacking Redis caching/invalidation, and JWT parser rebuilds on every request.
*   **Infrastructure (65%):** Missing Dockerfiles for microservices/web app and no Spring Boot Actuator/Prometheus metrics instrumentation.

---

## 2. Verification Report

### **Security Audit**
*   **Downstream JWT Claims Validation:** **Verified.** Downstream services (`event-service`, `crm-service`, `gallery-service`) validate the JWT token signature against the shared secret (`app.jwt.secret`) rather than blindly trusting Gateway headers (zero-trust pattern).
*   **RBAC & Method Permissions:** **Verified.** Custom `UserPrincipal` maps roles to Spring Security GrantedAuthorities (prefixed with `ROLE_`). Controllers enforce checks via `@PreAuthorize("hasAnyRole('...')")`.
*   **Header Spoofing Prevention:** **Verified.** The Gateway's `JwtAuthFilter` strips incoming `X-Tenant-ID`, `X-User-ID`, `X-User-Email`, and `X-User-Roles` headers from client requests before validation and overrides them using validated JWT claims.
*   **Password Reset Token Safety:** **Verified.** Tokens are secure 32-byte strings stored in Redis with a 15-minute TTL. Upon reset, the token is verified, and the key is immediately deleted from Redis, enforcing single-use.
*   **Settings Endpoint Protection:** **Verified.** `/settings/**` endpoints are authenticated at the filter chain level and restricted to `ADMIN`/`MANAGER` roles using method security.

### **Multi-Tenancy Audit**
*   **Multi-Tenant Membership:** **Verified.** Users are linked to multiple tenants via the `memberships` table, allowing different roles per workspace.
*   **Tenant Isolation Query Checks:** **Verified.** JPA repositories use queries incorporating `tenantId` (e.g., `findAllByTenantIdOrderByCreatedAtDesc` or `findByIdAndTenantId`).
*   **Missing Tenant Safety:** **Partially Verified.** `SettingsController` correctly throws a `ResponseStatusException` when `X-Tenant-ID` is missing. Downstream controllers (e.g. `BudgetController`) use a development sandbox fallback (`00000000-0000-0000-0000-000000000000`), which represents a leak vulnerability if bypassed in production.
*   **Composite Constraints:** **Verified.** Migration scripts V4 and V5 add:
    *   `bookings`: `UNIQUE (tenant_id, booking_number)`
    *   `invoices`: `UNIQUE (tenant_id, invoice_number)`
    *   `quotes`: `UNIQUE (tenant_id, quote_number)`

### **Database Audit**
*   **Flyway Schema Ownership:** **Verified.** Schema tables are versioned and modified strictly via Flyway migration scripts.
*   **DDL Auto Configuration:** **Failed.** Downstream microservices use `hibernate.ddl-auto: update` in their primary configuration files. In production, this must be `validate` to prevent automated schema mutation.
*   **Foreign Keys & Indexes:** **Verified.** Migration DDLs define constraints (`fk_payments_booking`, `fk_invoices_booking`) and indices for fast lookups.

### **Performance Audit**
*   **Pagination:** **Failed.** List endpoints (leads, quotes, bookings, payments, invoices) return complete collections (`List<T>`). Large workspaces will experience high latency and heap allocation spikes.
*   **Dashboard Caching:** **Failed.** `DashboardService` returns hardcoded metrics, lacks database queries, and has no Redis cache integration or invalidation listeners.
*   **JWT Signing Keys:** **Failed.** `JwtRequestFilter` and `JwtService` recreate signing keys (`Keys.hmacShaKeyFor(...)`) and rebuild `Jwts.parser()` builders on every HTTP request, introducing CPU bottlenecks.

### **Infrastructure Audit**
*   **Docker Setup:** **Incomplete.** Only database, cache, and broker middleware are containerized. Microservices and the frontend Next.js application lack `Dockerfile` build manifests.
*   **Health Checks & Monitoring:** **Incomplete.** Spring Boot Actuator is missing from all services, leaving Kubernetes liveness/readiness probes and Prometheus scraper integrations unconfigured.
*   **Logging:** **Incomplete.** Services log standard console output instead of structured JSON format (`Logback` logstash encoder), which impedes log aggregators.

---

## 3. Remaining Risks

1.  **Downstream Sandbox Fallback Leak (High Risk):**
    Controllers fall back to `00000000-0000-0000-0000-000000000000` or random UUIDs when the `X-Tenant-ID` header is empty. If security filters are misconfigured, unauthorized calls could leak data into a shared tenant.
2.  **DDL Auto Modification in Production (Medium Risk):**
    Leaving `ddl-auto: update` in production can result in automatic database modifications at startup if a developer modifies a JPA entity, potentially locking tables or altering schemas without Flyway tracking.
3.  **Out of Memory (OOM) via Unpaginated Queries (Medium Risk):**
    Lack of pagination on ledger transactions will trigger OutOfMemoryErrors as workspaces scale to thousands of records.
4.  **No Downstream Health/Readiness Probes (Medium Risk):**
    Without Spring Boot Actuator `/actuator/health`, container orchestration managers cannot detect deadlocks or service initialization status.

---

## 4. Missing Tests

1.  **Tenant Leak Integration Tests:**
    Tests verifying that requesting `/api/v1/events/bookings/{id}` using Tenant A's token for Tenant B's booking ID returns `404 Not Found` or `403 Forbidden`.
2.  **Header Spoofing Integration Tests:**
    Tests ensuring that requests sent to the Gateway with malicious `X-Tenant-ID` headers are stripped and replaced by the authenticated token's claims.
3.  **Password Reset Token Re-Use Tests:**
    Tests asserting that invoking `/api/v1/auth/reset-password` twice with the same token results in an immediate `400 Bad Request` or `401 Unauthorized` on the second call.
4.  **Unpaginated Payload Size Limit Assertions:**
    Tests validating heap constraints when querying list endpoints containing 10,000+ mock database rows.

---

## 5. Recommended Load Tests

*   **Endpoint:** `POST /api/v1/auth/login`
    *   **Goal:** Measure BCrypt hashing CPU overhead and thread exhaustion under high login volumes.
    *   **Target:** 200 concurrent login requests/sec with latency < 500ms.
*   **Endpoint:** `GET /api/v1/events/bookings` & `GET /api/v1/events/payments`
    *   **Goal:** Verify database index performance, connection pool limits (`HikariCP`), and payload transfer sizing for large lists.
    *   **Target:** 1000 requests/sec with database CPU utilization < 70%.
*   **Endpoint:** `GET /api/v1/crm/dashboard/metrics` (post-implementation)
    *   **Goal:** Test Redis hit/miss latency, Cache Lock contention, and metrics aggregation.
    *   **Target:** 2000 requests/sec with response time < 50ms.

---

## 6. Recommended Security Tests

*   **Gateway Bypass Scans:**
    Verify if downstream services (ports `8081` to `8083`) can be reached directly from outside the network, bypassing the API gateway on port `8080`.
*   **JWT Algorithm Spoofing (`alg: none`):**
    Verify that the Gateway and downstream filters reject JWT tokens signed with the `none` algorithm or mismatched symmetric/asymmetric algorithms.
*   **Header Spoofing Penetration Test:**
    Send requests with custom `X-Tenant-ID` and `X-User-Roles=ADMIN` headers to bypass authorization controls, verifying that the API Gateway strips them.
*   **BCrypt Work Factor Brute-Force Testing:**
    Confirm that the BCrypt encoder work factor is set to a secure level (minimum `10` or `12`) to resist brute-force attacks without causing Denial of Service (DoS) due to CPU starvation.
