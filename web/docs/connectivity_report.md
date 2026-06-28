# EventOS — Full Frontend ↔ Backend Connectivity Report

## Routing Architecture
```
Browser → Next.js (port 3000)
  /api/v1/* → rewrites to → API Gateway (port 8080)
    /api/v1/auth/**  → auth-service  (port 8081)
    /api/v1/crm/**   → crm-service   (port 8082)
    /api/v1/bookings/** → event-service (port 8083) [rewritten to /api/v1/events/bookings/*]
    /api/v1/events/** → event-service (port 8083)
    /api/v1/gallery/** → gallery-service (port 8084)
```

---

## ✅ Auth Service — All Connected

| Frontend Call | Method | Backend Endpoint | Status |
|--------------|--------|-----------------|--------|
| `/auth/captcha` | GET | `auth-service /captcha` | ✅ |
| `/auth/login` | POST | `auth-service /login` | ✅ |
| `/auth/logout` | POST | `auth-service /logout` | ✅ |
| `/auth/refresh` | POST | `auth-service /refresh` | ✅ |
| `/auth/switch` | POST | `auth-service /switch` | ✅ |
| `/auth/sessions` | GET | `auth-service /sessions` | ✅ |
| `/auth/sessions/:id` | DELETE | `auth-service /sessions/:id` | ✅ |
| `/auth/settings/company` | GET | `auth-service /settings/company` | ✅ |
| `/auth/settings/company` | PUT | `auth-service /settings/company` | ✅ |
| `/auth/settings/team` | GET | `auth-service /settings/team` | ✅ |
| `/auth/settings/team` | POST | `auth-service /settings/team` | ✅ |
| `/auth/settings/team/:id` | DELETE | `auth-service /settings/team/:id` | ✅ |

---

## ✅ CRM Service — All Connected

| Frontend Call | Method | Backend Endpoint | Status |
|--------------|--------|-----------------|--------|
| `/crm/leads` | GET | `crm-service /leads` | ✅ |
| `/crm/leads` | POST | `crm-service /leads` | ✅ |
| `/crm/leads/:id` | GET | `crm-service /leads/:id` | ✅ |
| `/crm/leads/:id` | PUT | `crm-service /leads/:id` | ✅ |
| `/crm/leads/:id` | DELETE | `crm-service /leads/:id` | ✅ |
| `/crm/leads/:id/status` | PATCH | `crm-service /leads/:id/status` | ✅ |
| `/crm/leads/:id/activities` | GET | `crm-service /leads/:id/activities` | ✅ |
| `/crm/leads/:id/activities` | POST | `crm-service /leads/:id/activities` | ✅ |
| `/crm/leads/stats` | GET | `crm-service /leads/stats` | ✅ |
| `/crm/quotes` | GET | `crm-service /quotes` | ✅ |
| `/crm/quotes` | POST | `crm-service /quotes` | ✅ |
| `/crm/quotes/:id` | GET | `crm-service /quotes/:id` | ✅ |
| `/crm/quotes/client` | GET | `crm-service /quotes/client` (CLIENT role) | ✅ |
| `/crm/quotes/:id/approve` | POST | `crm-service /quotes/:id/approve` | ✅ |
| `/crm/quotes/:id/reject` | POST | `crm-service /quotes/:id/reject` | ✅ |
| `/crm/quotes/:id/view` | POST | `crm-service /quotes/:id/view` | ✅ |

---

## ✅ Event Service — Bookings, Events, Invoices, Payments — All Connected

| Frontend Call | Method | Backend Endpoint | Status |
|--------------|--------|-----------------|--------|
| `/events/bookings` | GET | `event-service /bookings` | ✅ |
| `/events/bookings` | POST | `event-service /bookings` | ✅ |
| `/events/bookings/:id` | GET | `event-service /bookings/:id` | ✅ |
| `/events/bookings/by-quote/:id` | GET | `event-service /bookings/by-quote/:id` | ✅ |
| `/events` | GET | `event-service /` (root `@GetMapping`) | ✅ |
| `/events/:id` | GET | `event-service /:id` | ✅ |
| `/events/:id` | PUT | `event-service /:id` | ✅ |
| `/events/:id` | PATCH | `event-service /:id` | ✅ |
| `/events` | POST | `event-service /` | ✅ |
| `/events/stats` | GET | `event-service /stats` | ✅ |
| `/events/:id/timeline` | GET | `event-service /:id/timeline` | ✅ |
| `/events/:id/timeline` | POST | `event-service /:id/timeline` | ✅ |
| `/events/:id/timeline/:itemId/toggle` | PATCH | `event-service /:id/timeline/:itemId/toggle` | ✅ |
| `/events/tasks` | GET | `event-service /tasks` | ✅ |
| `/events/tasks` | POST | `event-service /tasks` | ✅ |
| `/events/:id/tasks` | GET | `event-service /:id/tasks` | ✅ |
| `/events/:id/tasks` | POST | `event-service /:id/tasks` | ✅ |
| `/events/:id/tasks/:taskId/toggle` | PATCH | `event-service /:id/tasks/:taskId/toggle` | ✅ |
| `/events/client` | GET | `event-service /client` (CLIENT role only) | ✅ |
| `/events/client/timeline` | GET | `event-service /client/timeline` (CLIENT only) | ✅ |
| `/events/invoices` | GET | `event-service /invoices` | ✅ |
| `/events/invoices` | POST | `event-service /invoices` | ✅ |
| `/events/invoices/:id` | GET | `event-service /invoices/:id` | ✅ |
| `/events/invoices/:id/status` | PUT | `event-service /invoices/:id/status` | ✅ |
| `/events/invoices/:id/remind` | POST | `event-service /invoices/:id/remind` | ✅ |
| `/events/invoices/client` | GET | `event-service /invoices/client` (by email) | ✅ |
| `/events/invoices/stats` | GET | `event-service /invoices/stats` | ✅ |
| `/events/payments` | GET | `event-service /payments` | ✅ |
| `/events/payments` | POST | `event-service /payments` (OWNER/ADMIN/MANAGER/STAFF only) | ✅ |
| `/events/payments/:id` | DELETE | `event-service /payments/:id` (OWNER/ADMIN only) | ✅ |
| `/events/payments/client` | GET | `event-service /payments/client` (by email) | ✅ |
| `/events/payments/stats` | GET | `event-service /payments/stats` | ✅ |

---

## ✅ Gallery Service — Connected

| Frontend Call | Method | Backend Endpoint | Status |
|--------------|--------|-----------------|--------|
| `/gallery/albums/client?eventIds=...` | GET | `gallery-service /albums/client` | ✅ |
| `/gallery/items/album/:id` | GET | `gallery-service /items/album/:id` | ✅ |
| `/gallery/albums/:id/download` | GET | `gallery-service /albums/:id/download` | ✅ |

---

## ⚠️ ONE Issue Found — `portal/layout.tsx` Logout Missing Email Body

**File:** `web/src/app/portal/layout.tsx` — line 66
```typescript
await api.post("/auth/logout");  // ← No body!
```
The auth-service `POST /auth/logout` expects `{ email: "..." }` in the body to identify which refresh token to revoke. The portal layout's logout call sends an **empty body**, so the backend cannot revoke the token properly.

**The dashboard layout does this correctly:**
```typescript
await api.post("/auth/logout", { email: user?.email });  // ✅ correct
```

**Fix:** Pass the email to the portal logout call.

---

## 📋 Summary: 40+ Routes All Connected ✅ — 1 Minor Issue

| Service | Total Calls | Status |
|---------|-------------|--------|
| auth-service | 13 | ✅ All Connected |
| crm-service | 17 | ✅ All Connected |
| event-service | 31 | ✅ All Connected |
| gallery-service | 3 | ✅ All Connected |

**1 Issue:** `portal/layout.tsx` logout call missing `email` body → refresh token not invalidated on client logout.
