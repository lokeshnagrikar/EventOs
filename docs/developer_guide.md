# EventOS — Technical Developer Guide

This document covers the core architecture, programming patterns, code standards, and patterns used across the **EventOS** platform. It serves as an onboarding guide for new engineering team members.

---

## 1. Logical Multi-Tenancy Architecture

EventOS is built on a shared-database, shared-schema multi-tenant design. Tenant segregation is strictly enforced via a logical `tenant_id` UUID column present across almost all tables.

### 1.1 Context Interception & Thread Isolation
Each incoming HTTP request carries the `X-Tenant-ID` header.
* An interceptor or Filter in the backend services extracts this header and registers it in a `ThreadLocal` context wrapper called `ThreadLocalContext` or `TenantContext`.
* During database access (JPA/Hibernate), a custom Hibernate Filter or Hibernate interceptor reads the tenant context and attaches `WHERE tenant_id = ?` filters dynamically to all SELECT/UPDATE/DELETE commands.

#### Example: Dynamic Tenant Assignment
```java
// Setting the context manually in background tasks or message consumers
try {
    TenantContext.setTenantId(event.getTenantId());
    bookingService.process(event);
} finally {
    TenantContext.clear(); // Always clear ThreadLocal context to prevent memory leaks
}
```

---

## 2. Authentication & Method Security

Security is managed via Spring Security and standard JSON Web Tokens (JWT).

### 2.1 Asymmetric Token Validation (RSA)
The system uses asymmetric cryptography (RSA public/private keys) to sign and verify tokens:
* **Auth Service** holds the private key (`jwt_private.pem`) to sign the tokens at login/refresh.
* **API Gateway** and other downstream microservices load the public key (`jwt_public.pem`) to verify token integrity. Downstream services do not require contact with the Auth Service to validate a request.

### 2.2 Roles & Method Permissions
Endpoints are protected using method-level security annotation `@PreAuthorize`.
The platform has four key roles:
* `ROLE_OWNER`: Access to all resources, subscription tier upgrades, and company configurations.
* `ROLE_ADMIN`: Operations management, client invoicing, reporting, and staff provisioning.
* `ROLE_MANAGER`: Team management, quote builders, lead pipeline configurations.
* `ROLE_STAFF`: Standard operational permissions, view calendars, coordinate events, update checklist items.

---

## 3. Asynchronous Communication (RabbitMQ)

Services use Spring AMQP to dispatch messages across a direct exchange.

### 3.1 Exchange and Routing Details
* **Exchange Name**: `eventos.direct.exchange`
* **Common Routing Keys & Queues**:
  * Routing Key: `quote.accepted` $\rightarrow$ Queue: `event.booking.queue`
  * Routing Key: `budget.converted` $\rightarrow$ Queue: `crm.lead.queue`
  * Routing Key: `booking.created` $\rightarrow$ Queue: `auth.booking.created.queue`

### 3.2 Dead Letter Queues (DLQ)
All operational queues bind to a dead-letter exchange (DLX) to capture failed processing runs. If a message fails standard retry cycles, it is pushed to the `dead.letter.queue` where `DeadLetterQueueConsumer` records the trace and alerts developers.

---

## 4. Caching & Controls (Redis)

Redis is deployed for low-latency operational control:
1. **API Gateway Rate Limiting**: The gateway employs a sliding window algorithm implemented via Redis Sorted Sets (`ZSET`). Timestamps of incoming client IPs/user IDs are tracked, pruning entries outside the active window.
2. **JWT Blacklisting**: Deleted sessions or logged-out users place their tokens into Redis under the key prefix `blacklist:<token>` with a Time-To-Live (TTL) equal to the token's remaining validity duration.

---

## 5. Frontend Architecture & State (Next.js)

The client is a Next.js App Router project leveraging Tailwind CSS, Lucide icons, and Framer Motion.

### 5.1 Global State (Zustand)
State is segregated by domains:
* [authStore.ts](file:///d:/EventOs/web/src/store/authStore.ts): Manages user profile, active token, and active tenant membership toggles.
* `onboardingStore.ts`: Manages the state of the first-time setup checklist wizard.
* `helpStore.ts`: Manages bookmarks, recently viewed docs, and search settings.

### 5.2 API Interceptors (Axios)
A centralized API client intercepts requests to automatically attach authorization headers:
```typescript
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  const tenantId = useAuthStore.getState().activeTenantId;
  
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
  
  return config;
});
```
