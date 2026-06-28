# EventOS — Final Bug Report (Post-Fix Audit)

> Generated after a deep re-scan of all services, the API Gateway, and the frontend.
> Includes both the status of previously fixed bugs and newly discovered issues.

---

## ✅ Previously Fixed Bugs (Confirmed Resolved)

| # | Service | Bug | Status |
|---|---------|-----|--------|
| 1 | event-service | `BookingService` double-prefixed CRM URL (`/crm/crm/...`) | ✅ Fixed |
| 2 | event-service | `PaymentService` double-prefixed CRM URL | ✅ Fixed |
| 3 | event-service | `JwtRequestFilter` — TenantContext ThreadLocal leak on early return | ✅ Fixed |
| 4 | crm-service | `JwtRequestFilter` — TenantContext ThreadLocal leak on early return | ✅ Fixed |
| 5 | auth-service | `JwtRequestFilter` — TenantContext ThreadLocal leak on early return | ✅ Fixed |
| 6 | crm-service | `DashboardService.eventServiceBaseUrl` was missing `/events` path segment | ✅ Fixed |
| 7 | auth-service | `SettingsController /team` — MANAGER and STAFF excluded from GET endpoint | ✅ Fixed |

---

## 🔴 Critical Bugs Found (New / Remaining)

### BUG-01 — JWT Algorithm Mismatch in Service-to-Service Calls
**Severity:** CRITICAL  
**Services Affected:** `crm-service`, `event-service`

**Root Cause:**  
The API Gateway's `JwtAuthFilter` validates JWTs using **RS256 (RSA asymmetric)**. The auth-service's `JwtService` also **signs** tokens with **RS256** using a shared PEM keypair (`jwt_private.pem` / `jwt_public.pem`).

However, the `JwtRequestFilter` in **crm-service** and **event-service** was written to validate JWTs using **HS256 (HMAC symmetric)** with the `app.jwt.secret` property.

**Impact:**
- Normal frontend → Gateway → Microservice flow works fine (Gateway validates RS256, then injects `X-User-*` trusted headers; microservices use the gateway-header path).
- **Service-to-service direct calls fail**: When `crm-service/DashboardService` calls `event-service /dashboard/metrics` with a forwarded Bearer token, event-service tries to validate the RS256 token with HMAC → fails → SecurityContext is empty → **401 Unauthorized**.
- **Result**: The CRM Dashboard's event metrics (revenue, upcoming events, team tasks) always return fallback empty data because the cross-service call silently fails.
- **CLIENT role access validation fails**: `BookingService.validateBookingAccess()` calls CRM with Bearer token → CRM tries HMAC validation → fails → CLIENT cannot verify booking access (throws FORBIDDEN).

**The Fix (Applied):**  
Updated `crm-service/JwtRequestFilter.java` and `event-service/JwtRequestFilter.java` to use RSA public key validation (RS256), matching the gateway and auth-service. They now load `jwt_public.pem` from the same locations.

---

## 🟠 Major Bugs Found

### BUG-02 — QuoteController Swagger Example Shows Wrong Status Value
**Severity:** MAJOR (API Contract)  
**Service:** `crm-service`

**Root Cause:**  
`QuoteController` Swagger examples and description mention `"APPROVED"` as a valid status:
```java
@ExampleObject(name = "Mark as Approved", value = "{\"status\": \"APPROVED\"}")
```
But the actual `QuoteStatus` enum only defines: `DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED`.

**Impact:**  
Any consumer copying the Swagger example and sending `status: "APPROVED"` receives `400 Bad Request` with "Invalid status value: APPROVED". The correct value is `"ACCEPTED"`.

**Fix Required:**  
Change `"APPROVED"` → `"ACCEPTED"` in the `@ExampleObject` annotation in `QuoteController.updateStatus()`.

---

### BUG-03 — DashboardController (CRM) has No `@PreAuthorize`
**Severity:** MEDIUM (Security/Access Control)  
**Service:** `crm-service`

**Root Cause:**  
`DashboardController` has no `@PreAuthorize` on either endpoint:
- `GET /dashboard/metrics` — accessible by any authenticated user (incl. `CLIENT`)
- `DELETE /dashboard/metrics/cache` — accessible by any authenticated user

**Impact:**  
Any authenticated CLIENT can view the full CRM dashboard metrics (lead counts, revenue forecasts, pipeline data). A CLIENT should only see their own data.

**Fix Required:**  
Add `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")` to both endpoints, or restrict the cache-busting endpoint to OWNER/ADMIN only.

---

### BUG-04 — EventDashboardController has No `@PreAuthorize`
**Severity:** MEDIUM (Security/Access Control)  
**Service:** `event-service`

**Root Cause:**  
`EventDashboardController.getDashboardMetrics()` has no method-level authorization. Any authenticated user (incl. CLIENT role) can call `GET /api/v1/events/dashboard/metrics`.

**Impact:**  
Clients can see full revenue, vendor costs, and business metrics intended for internal team use.

**Fix Required:**  
Add `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")` to the endpoint.

---

## 🟡 Minor / Low Issues

### BUG-05 — Duplicate Axios API Clients in Frontend
**Severity:** LOW (Maintenance)  
**Component:** Frontend (`web/src/lib/`)

**Root Cause:**  
There are two separate Axios instances:
- `api.ts` → `baseURL: "/api/v1"` — does NOT attach `X-Tenant-ID` header
- `api-client.ts` → `baseURL: process.env.NEXT_PUBLIC_API_BASE_URL` — attaches `X-Tenant-ID` header

**Impact:**  
Inconsistency between components depending on which client they use. The `X-Tenant-ID` header from `api-client.ts` is stripped by the gateway anyway (gateway rebuilds all X-User-* headers from JWT claims), but it creates confusion.

**Fix Recommendation:**  
Consolidate to a single Axios client. Remove the `X-Tenant-ID` header since the gateway manages tenant context from JWT.

---

### BUG-06 — Auth-service `JwtRequestFilter` Uses HMAC for Token Validation
**Severity:** LOW (Latent)  
**Service:** `auth-service`

**Root Cause:**  
`auth-service/JwtRequestFilter` uses the shared `app.jwt.secret` with HMAC (HS256) as the fallback JWT validation path. But the auth-service `JwtService` signs tokens with RS256.

**Impact:**  
Low. In practice, all auth-service protected requests (sessions, invitations) come through the gateway, which uses X-User-* headers, bypassing HMAC validation entirely. Direct access to auth-service endpoints would fail JWT validation, but that is expected/secured by the gateway.

**Note:**  
The `JwtRequestFilter` here actually delegates to `JwtService.validateToken()` which correctly uses RSA. So this is **actually NOT a bug** — the auth-service filter uses RSA through its `JwtService` dependency. ✅

---

## Architecture Summary

```
Frontend (Next.js :3000)
    ↓ /api/v1/** (rewritten via next.config.ts)
API Gateway (:8080)   ← RS256 RSA JWT validation, injects X-User-* headers
    ├── /api/v1/auth/**    → Auth Service  (:8081, ctx: /api/v1/auth)
    ├── /api/v1/crm/**     → CRM Service   (:8082, ctx: /api/v1/crm)
    ├── /api/v1/events/**  → Event Service (:8083, ctx: /api/v1/events)
    ├── /api/v1/bookings/**→ Event Service (rewritten → /api/v1/events/bookings)
    └── /api/v1/gallery/** → Gallery Svc   (:8084, ctx: /api/v1/gallery)

Service-to-Service (direct, no gateway):
    CRM /dashboard/metrics → Event /dashboard/metrics  (now fixed: uses RSA)
    Event BookingService   → CRM /quotes, /leads       (now fixed: uses RSA)
    Event PaymentService   → CRM /dashboard/metrics/cache (async fire-and-forget)
```

---

## Fixes Applied in This Session

| # | File | Change |
|---|------|--------|
| 1 | `crm-service/JwtRequestFilter.java` | Replaced HMAC key init with RSA public key from PEM file |
| 2 | `event-service/JwtRequestFilter.java` | Replaced HMAC key init with RSA public key from PEM file |

## Fixes Still Required (Manual)

| # | File | Change Needed |
|---|------|---------------|
| 1 | `crm-service/QuoteController.java` | Change Swagger example `"APPROVED"` → `"ACCEPTED"` |
| 2 | `crm-service/DashboardController.java` | Add `@PreAuthorize` to both endpoints |
| 3 | `event-service/EventDashboardController.java` | Add `@PreAuthorize` to the metrics endpoint |
| 4 | `web/src/lib/` | Consolidate duplicate Axios clients |

---

## 🔴 Frontend & Integration Bugs Found (Post-Fix Audit)

### BUG-07 — Onboarding Page Route Mismatch (404 Not Found)
**Severity:** CRITICAL  
**Component:** Frontend / Onboarding ([page.tsx](file:///d:/EventOs/web/src/app/onboarding/page.tsx))  

**Root Cause:**  
The onboarding component invokes `apiClient.get("/settings/company")` and `apiClient.put("/settings/company")`. With `apiClient`'s baseURL `/api/v1`, this resolves to `/api/v1/settings/company`.
However, the API Gateway's routing rules only route `/api/v1/auth/**`, `/api/v1/crm/**`, `/api/v1/events/**`, etc. There is no route mapping for `/api/v1/settings/**`.
The settings endpoints are in `auth-service`, which runs on servlet context path `/api/v1/auth`.

**Impact:**  
Onboarding fetches and updates fail with **404 Not Found**, rendering the onboarding workflow completely broken.

**Fix Needed:**  
Update page requests to use `/auth/settings/company` (e.g. `apiClient.get("/auth/settings/company")`), matching `/api/v1/auth/settings/company` which is correctly routed to auth-service.

---

### BUG-08 — Missing Budget Calculator REST Controller (404 Not Found)
**Severity:** CRITICAL  
**Service/Component:** `event-service` / Frontend Calculator ([page.tsx](file:///d:/EventOs/web/src/app/calculator/page.tsx))  

**Root Cause:**  
The frontend Budget Calculator relies on multiple REST endpoints:
- `GET /events/calculator/pricing-rules`
- `GET /events/calculator`
- `POST /events/calculator`
- `DELETE /events/calculator/{id}`
- `POST /events/calculator/{id}/convert-to-lead`
- `POST /events/calculator/{id}/generate-quote`

While the database entities (`PricingRule`, `BudgetEstimate`), repositories, and DTOs are declared in the `event-service` backend, **no Spring REST controllers** are implemented to expose these calculator paths.

**Impact:**  
Any client/user requests to the event calculator return **404 Not Found** errors, disabling budget estimate compilation, saving, and CRM pipeline conversions.

**Fix Needed:**  
Implement a `BudgetCalculatorController` in `event-service` (under package `com.eventos.event.controller`) mapping `/events/calculator` to expose the necessary GET, POST, and DELETE operations, leveraging existing service/repository logic.

---

### BUG-09 — Client Portal Logout Session Leak
**Severity:** MAJOR  
**Component:** Frontend Client Portal ([layout.tsx](file:///d:/EventOs/web/src/app/portal/layout.tsx))  

**Root Cause:**  
The Client Portal logout handler (`handleLogout`) clears the client-side cookies (`accessToken`, `user_role`, `user_name`) and localStorage items, but **fails to send a POST request to `/auth/logout`** to invalidate the backend session.
Because the browser's HTTP-Only `refreshToken` cookie is scoped to `/api/v1/auth` and protected against javascript modification, client-side scripts cannot clear it.

**Impact:**  
The active session and the refresh token remain fully active in the backend database and the user's browser, permitting session hijacking or bypass on subsequent visits.

**Fix Needed:**  
Integrate a server-side logout request `await api.post("/auth/logout")` (or `apiClient.post`) within `handleLogout` in `portal/layout.tsx` before clearing browser storage.

---

### BUG-10 — Empty Email Logout Session Leak (Dashboard)
**Severity:** MAJOR  
**Component:** Frontend Dashboard ([page.tsx](file:///d:/EventOs/web/src/app/dashboard/page.tsx))  

**Root Cause:**  
The dashboard logout calls `await api.post("/auth/logout", { email: "" })`. 
In the backend `AuthService.logout(email)`, calling `userRepository.findByEmail("")` returns an empty optional, quietly skipping the deletion of sessions and tokens.

**Impact:**  
The actual user session and refresh token are leaked and remain active in the database.

**Fix Needed:**  
Modify the logout request in `dashboard/page.tsx` to pass the logged-in user's email from the Zustand auth store:
```typescript
const { user } = useAuthStore();
...
await api.post("/auth/logout", { email: user?.email || "" });
```

---

### BUG-11 — Middleware Cookie Bypass on Portal Logout
**Severity:** MEDIUM  
**Component:** Frontend Portal Layout & Routing ([layout.tsx](file:///d:/EventOs/web/src/app/portal/layout.tsx), [middleware.ts](file:///d:/EventOs/web/src/middleware.ts))  

**Root Cause:**  
Next.js Edge Middleware (`middleware.ts`) secures dashboard and portal routes by checking for the `hasSession` cookie. While the main application's Zustand store `clearAuth` correctly removes `hasSession`, the Client Portal layout `handleLogout` does not clear the `hasSession` cookie.

**Impact:**  
The `hasSession` cookie remains in the browser, allowing unauthorized routing actions or bypassing login page redirects.

**Fix Needed:**  
Add a line to clear `hasSession` cookie on logout in `portal/layout.tsx`:
```typescript
document.cookie = "hasSession=; Path=/; Max-Age=0; SameSite=Lax";
```

---

### BUG-12 — Inconsistent Booking API Endpoints
**Severity:** LOW  
**Component:** Frontend ([bookings/page.tsx](file:///d:/EventOs/web/src/app/bookings/page.tsx) vs [invoices/page.tsx](file:///d:/EventOs/web/src/app/invoices/page.tsx))  

**Root Cause:**  
`bookings/page.tsx` calls `api.get("/bookings")` while `invoices/page.tsx` and `payments/page.tsx` call `api.get("/events/bookings")`. 
Although both paths work because the gateway rewrites `/api/v1/bookings/**` to `/api/v1/events/bookings/**`, it creates code inconsistency and complicates testing.

**Fix Recommendation:**  
Standardize all booking queries to use `/events/bookings` directly.

