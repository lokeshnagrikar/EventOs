# Architecture Decisions

## AD-001: Microservices Architecture

**Date:** Pre-2026 (from initial project creation)
**Status:** Accepted

**Context:**
EventOS needed to handle multiple bounded contexts (auth, CRM, events, gallery) with independent scalability.

**Decision:**
Adopt a microservices architecture with 4 domain services + 1 API gateway, each with its own PostgreSQL database.

**Reason:**
- Clear separation of concerns
- Independent scaling per module
- Independent deployment capability
- Team parallelism

**Alternatives considered:**
- Monolith (simpler but less scalable)
- Modular monolith (middle ground)

**Impact:**
- All cross-service communication must use RabbitMQ or HTTP
- No cross-database joins
- Shared JWT secret for authentication
- Operational complexity (5 JVM processes + infrastructure)

**Affected files/modules:**
- `backend/pom.xml` (multi-module)
- `docker-compose.yml` (all services)
- `api-gateway/src/main/resources/application.yml` (routing)

---

## AD-002: JWT-Based Stateless Authentication

**Date:** Pre-2026
**Status:** Accepted

**Context:**
Need authentication that works across multiple microservices without shared session state.

**Decision:**
Use JWT tokens with shared signing secret, short-lived access tokens (~15min), long-lived refresh tokens (~7 days).

**Reason:**
- Stateless — no centralized session store needed
- Each service can independently verify tokens
- Works well with API Gateway pattern

**Impact:**
- JWT secret must be identical across all services
- Frontend must handle token refresh lifecycle
- Cookie-based middleware for SSR route protection

**Affected files/modules:**
- All service `JwtRequestFilter` / `JwtAuthFilter` configs
- `web/src/store/authStore.ts`
- `web/src/lib/api-client.ts`
- `web/src/middleware.ts`

---

## AD-003: Database Per Service

**Date:** Pre-2026
**Status:** Accepted

**Context:**
Microservice data isolation requirement.

**Decision:**
Each service has its own PostgreSQL database (auth_db, crm_db, event_db, gallery_db).

**Reason:**
- Data ownership clarity
- Independent schema evolution
- No accidental cross-service coupling

**Impact:**
- Cannot do SQL joins across services
- Must duplicate some data across services (e.g., client info in bookings)
- Event-driven eventual consistency via RabbitMQ

---

## AD-004: Shadcn/UI + Tailwind Design System

**Date:** Pre-2026
**Status:** Accepted

**Context:**
Need a flexible, customizable component system for multi-tenant theming.

**Decision:**
Use shadcn/ui (Radix primitives) with Tailwind CSS and CSS custom properties for theming.

**Reason:**
- Components are copied into project (full control, no dependency lock-in)
- CSS variables enable dynamic per-workspace theming
- Tailwind provides rapid styling with consistency

**Impact:**
- All color values use CSS variables, not hardcoded values
- Theme can be switched dynamically per workspace branding

---

## AD-005: Zustand for Client State

**Date:** Pre-2026
**Status:** Accepted

**Context:**
Need lightweight client-side state management for auth, billing, and UI state.

**Decision:**
Use Zustand (not Redux, not Context API) for global client state.

**Reason:**
- Minimal boilerplate compared to Redux
- Works outside React component tree (useful for API interceptors)
- Simple but powerful

**Impact:**
- 7 Zustand stores managing different domains
- State persisted to localStorage/sessionStorage
