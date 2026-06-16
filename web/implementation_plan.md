# Implementation Plan: EventOS Security & Multi-Tenant Remediation Sprint

Remediation plan to address critical security, multi-tenancy, database consistency, and performance concerns across the EventOS platform.

---

## User Review Required

> [!IMPORTANT]
> **Breaking Changes & Refactoring Scope**:
> 1. **User Identity vs Tenant Membership**: Changing from a direct single-tenant model (`User -> Tenant`) to a membership model (`User -> Membership -> Tenant`) requires database schema changes and refactoring the authentication/registration flow. This will change the registration API payload and login responses.
> 2. **Removal of permitAll() on Settings**: Restricting `/api/v1/auth/settings/**` to `ADMIN` and `MANAGER` roles means the frontend must supply valid JWT credentials for these endpoints.
> 3. **Validation of JWT Downstream**: Microservices will no longer trust gateway headers blindly. Each service will parse and validate the JWT signature, requiring they have access to the JWT secret environment variables.
> 4. **Sequential Counter Row Locks**: Replacing simple `.countByTenantId()` lookups with a row-locked sequence table (`tenant_sequences`) will prevent database race conditions but introduces pessimistic transaction locks, which must be kept short to avoid blocking DB connection pools.

---

## Open Questions

> [!NOTE]
> **Phase 3 Design Decisions**:
> 1. **Dynamic Pagination Defaults**: When `page` and `size` parameters are missing on list queries, should we fall back to a full list or return a default page (e.g. page 0, size 10)?
>    * *Proposed Approach*: Keep pagination optional. If `page` and `size` are omitted, return the full list. This preserves compatibility with the initial frontend dashboards and lookup selector dropdowns without complex client refactoring.
> 2. **Toast Component Design**: Should we implement a custom lightweight React toast system using Tailwind CSS and Zustand (already a dependency) or introduce an external library?
>    * *Proposed Approach*: Create a custom Zustand-based toast system. This avoids introducing unneeded third-party libraries, keeps the client bundle size small, and allows exact UI style integration matching the existing dark theme.

---

## Proposed Changes

### 1. API Gateway (`api-gateway`)
* **Objective**: Eliminate HMAC key construction overhead in `JwtAuthFilter` on every single request.
* **Scope of Changes**:
  * **[MODIFY] [JwtAuthFilter.java](file:///d:/EventOs/backend/api-gateway/src/main/java/com/eventos/gateway/config/JwtAuthFilter.java)**:
    * Cache the `SecretKey` and `JwtParser` instance using thread-safe double-checked lazy initialization.
    * Re-use the cached `JwtParser` instance to parse and validate token claims.

---

### 2. CRM Service (`crm-service`)
* **Objective**: Implement server-side pagination for leads/quotes and database-level stats aggregations.
* **Scope of Changes**:
  * **[MODIFY] [LeadRepository.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/repository/LeadRepository.java)** & **[QuoteRepository.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/repository/QuoteRepository.java)**:
    * Add paginated finder methods returning `Page<Lead>` and `Page<Quote>` taking a `Pageable` parameter.
    * Add custom jpql/native aggregation queries in `LeadRepository` to count leads grouped by status, count by source, and average budget totals.
  * **[MODIFY] [LeadService.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/service/LeadService.java)** & **[QuoteService.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/service/QuoteService.java)**:
    * Support paginated listings in service methods.
    * Implement a stats summary retrieval method in `LeadService` executing database aggregation queries.
  * **[MODIFY] [CrmLeadController.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/controller/CrmLeadController.java)** & **[QuoteController.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/controller/QuoteController.java)**:
    * Update `GET /leads` and `GET /quotes` endpoints to accept optional `page` and `size` parameters.
    * Add `GET /leads/stats` endpoint in `CrmLeadController` to return compiled analytics.

---

### 3. Event Service (`event-service`)
* **Objective**: Implement server-side pagination and aggregates for events, invoices, and payments.
* **Scope of Changes**:
  * **[MODIFY] [EventRepository.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/repository/EventRepository.java)**, **[InvoiceRepository.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/repository/InvoiceRepository.java)**, and **[PaymentRepository.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/repository/PaymentRepository.java)**:
    * Add paginated methods for events, invoices, and payments.
    * Add database aggregation queries (sums, counts, monthly sums, payment method groupings).
  * **[MODIFY] [EventService.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/service/EventService.java)**, **[InvoiceService.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/service/InvoiceService.java)**, and **[PaymentService.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/service/PaymentService.java)**:
    * Integrate pagination and database-level aggregations in service layers.
  * **[MODIFY] [EventController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/EventController.java)**, **[InvoiceController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/InvoiceController.java)**, and **[PaymentController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/PaymentController.java)**:
    * Support paginated requests for events, invoices, and payments.
    * Add `GET /events/stats`, `GET /invoices/stats`, and `GET /payments/stats` endpoints.

---

### 4. Web Frontend (`web`)
* **Objective**: Switch reports page to use stats endpoints, optimize cache times, and replace browser alert boxes with premium toast alerts.
* **Scope of Changes**:
  * **[MODIFY] [providers.tsx](file:///d:/EventOs/web/src/app/providers.tsx)**:
    * Adjust React Query global `staleTime` from 5 minutes to 10 seconds, ensuring near real-time dashboard updates.
  * **[MODIFY] [reports/page.tsx](file:///d:/EventOs/web/src/app/reports/page.tsx)**:
    * Refactor to fetch aggregated analytics from the backend `/stats` endpoints rather than performing client-side calculations on full datasets.
  * **[NEW] [toastStore.ts](file:///d:/EventOs/web/src/lib/toastStore.ts)**:
    * A Zustand store managing active toast notifications (`addToast`, `removeToast`, toast type states).
  * **[NEW] [ToastContainer.tsx](file:///d:/EventOs/web/src/components/ToastContainer.tsx)**:
    * Floating container component rendering beautiful, animated toast banners (success/error/info) in the bottom-right corner.
  * **[MODIFY] [layout.tsx](file:///d:/EventOs/web/src/app/layout.tsx)**:
    * Embed `ToastContainer` globally in the application body.
  * **[MODIFY] [portal/page.tsx](file:///d:/EventOs/web/src/app/portal/page.tsx)** & **[settings/page.tsx](file:///d:/EventOs/web/src/app/settings/page.tsx)**:
    * Replace browser `alert(...)` popups with sleek trigger calls to the custom toast store (`addToast`).

---

## Updated Folder Structure (Impacted Files)

```text
EventOs/
├── backend/
│   ├── api-gateway/.../gateway/config/
│   │   └── JwtAuthFilter.java                  # Cached JWT keys and parser
│   ├── crm-service/.../crm/
│   │   ├── repository/
│   │   │   ├── LeadRepository.java             # Paginated queries & stats counts
│   │   │   └── QuoteRepository.java            # Paginated quote lookup
│   │   ├── service/
│   │   │   ├── LeadService.java                # Pagination & stats logic
│   │   │   └── QuoteService.java               # Pagination logic
│   │   └── controller/
│   │       ├── CrmLeadController.java          # Paginated list & stats endpoints
│   │       └── QuoteController.java            # Paginated list endpoint
│   └── event-service/.../event/
│       ├── repository/
│       │   ├── EventRepository.java            # Paginated events & stats queries
│       │   ├── InvoiceRepository.java          # Paginated invoices & stats queries
│       │   └── PaymentRepository.java          # Paginated payments & stats queries
│       ├── service/
│       │   ├── EventService.java               # Paginated events & stats logic
│       │   ├── InvoiceService.java             # Paginated invoices & stats logic
│       │   └── PaymentService.java             # Paginated payments & stats logic
│       └── controller/
│           ├── EventController.java            # Paginated list & stats endpoints
│           ├── InvoiceController.java          # Paginated list & stats endpoints
│           └── PaymentController.java          # Paginated list & stats endpoints
└── web/
    └── src/
        ├── app/
        │   ├── layout.tsx                      # Register ToastContainer
        │   ├── providers.tsx                   # Adjust React Query staleTime
        │   ├── portal/page.tsx                 # Replace alerts with toasts
        │   ├── reports/page.tsx                # Query stats endpoints instead of full lists
        │   └── settings/page.tsx               # Replace alerts with toasts
        ├── components/
        │   └── ToastContainer.tsx              # Toast UI rendering component
        └── lib/
            └── toastStore.ts                   # Zustand toast state hook
```

---

## Verification Plan

### Automated Tests
* Verify gateway compilation and downstreams:
  `mvn clean compile`
* Run test suites on crm and event services:
  `mvn test -pl crm-service,event-service`

### Manual Verification
1. **JWT Key Caching**: Confirm gateway routes traffic successfully and validates JWTs without latency degradation.
2. **Server-side Pagination**: Send requests to `GET /api/v1/crm/leads?page=0&size=5` and verify that only 5 items are returned along with paginated metadata. Check that omitting parameters still returns the full dataset.
3. **Database Aggregations**: Call `/api/v1/crm/leads/stats` and `/api/v1/events/payments/stats` to verify that calculations like conversions and monthly sums are correctly aggregated on the server.
4. **Reports Analytics Page**: Load the dashboard reports page, verify it loads stats instantly and that network payloads are tiny compared to full datasets.
5. **Toast Notifications**: Trigger quote approvals, rejections, or settings saves and confirm that elegant animated toast banners pop up in the bottom-right corner instead of blocking browser dialog boxes.

