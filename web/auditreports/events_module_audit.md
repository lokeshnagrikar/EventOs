# Audit Report: EventOS Events Module

**Date**: June 16, 2026  
**Auditors**: Principal Security Engineer, Senior Product Designer, Senior Next.js Architect, Senior Spring Boot Architect, Senior QA Engineer  
**Scope**: Events Module (Backend: `event-service` APIs, Frontend: `events` list, calendar scheduler, and details pages)

---

## Overall Audit Score: 58 / 100 (D)

The Events module provides a visually rich workspace featuring Grid, Calendar, and Timeline views, as well as milestone tracking, task checklists, and resource/team assignments. However, the module suffers from several severe security and architectural issues: a complete lack of backend RBAC (role-based access control), database integrity failures from mock client-side UUID generation, un-bounded calendar queries that load the entire event history into memory, and standard Next.js navigation anti-patterns.

---

## Findings by Severity

### 🔴 CRITICAL SEVERITY

#### 1. Lack of Backend Role Validation (RBAC Bypass)
* **Component**: Security ([EventController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/EventController.java), [BookingController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/BookingController.java), [BudgetController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/BudgetController.java))
* **Role**: Principal Security Engineer / Senior Spring Boot Architect
* **Details**: 
  * Although `@EnableMethodSecurity` is enabled in [SecurityConfig.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/config/SecurityConfig.java), there are no `@PreAuthorize` or `@Secured` annotations present in the controller layers. All endpoints are mapped under `.anyRequest().authenticated()`.
  * Mutating endpoints (such as `POST /events`, `PUT /events/{id}`, `DELETE /events/{id}/assignments/{assignmentId}`, and booking status/pricing rule modifications) are wide open to any authenticated user.
* **Impact**: A client (with the role `CLIENT`) can construct direct HTTP requests to bypass frontend blocks and modify team assignments, delete tasks, create mock bookings, or alter company pricing rules.
* **Remediation**: Guard mutating controller mappings with annotations such as `@PreAuthorize("hasAnyRole('ADMIN', 'PLANNER')")`.

#### 2. Severe Calendar Query Performance Bottleneck (No Date Range Boundaries)
* **Component**: Performance / Scalability ([EventController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/EventController.java#L29-L75), [EventService.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/service/EventService.java#L57-L79), [page.tsx](file:///d:/EventOs/web/src/app/events/page.tsx#L91-L100))
* **Role**: Senior Next.js Architect / Senior Spring Boot Architect
* **Details**: 
  * The frontend calendar view calls `api.get("/events")` without specifying date-range bounds (e.g. current month start/end dates).
  * The backend service fetches *every* event in the tenant's history from the database, and the client filters them in-memory via JavaScript: `events.filter((e) => e.startDate.startsWith(dateStr))`.
* **Impact**: As a tenant's database grows to thousands of historical events, this query will degrade severely, leading to huge JSON payloads, excessive JVM memory/CPU consumption, network latency, and browser thread lockups.
* **Remediation**: Introduce `startDate` and `endDate` query parameters to the `/events` API and enforce database-level date filtering in [EventRepository.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/repository/EventRepository.java).

#### 3. Fake Client-Side UUID Generation & Referential Integrity Failures
* **Component**: Database Integrity / Assignment Logic ([page.tsx](file:///d:/EventOs/web/src/app/events/%5Bid%5D/page.tsx#L353-L355))
* **Role**: Senior Spring Boot Architect / Senior QA Engineer
* **Details**: 
  * In the team assignment and task creation handlers, the frontend generates a mock random UUID client-side using `UUID_fallback()` (`"00000000-0000-0000-0000-" + randomValue`) and sends it to the backend as `userId` or `assignedUserId`.
  * The backend accepts and persists these fake UUIDs without verifying whether the user ID actually exists in the auth/user database.
* **Impact**: Completely breaks database referential integrity. In addition, no tenant isolation checks ensure that the assigned user belongs to the same tenant as the event, opening up cross-tenant assignment vulnerability.
* **Remediation**: Connect the team assignment interface to a real user directory microservice and enforce backend-level validation of assigned user IDs and tenant scopes.

---

### 🟡 HIGH SEVERITY

#### 4. Insecure Tenant Context Header Fallback
* **Component**: Tenant Isolation ([EventController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/EventController.java#L342-L356))
* **Role**: Principal Security Engineer
* **Details**: 
  * The `getTenantId` helper in controllers attempts to extract the tenant ID from the signed JWT principal. However, if the principal is absent, it falls back to the HTTP request header `X-Tenant-ID`.
* **Impact**: If the API gateway fails to strip/overwrite user-supplied headers, a malicious user could bypass token validation, supply a customized `X-Tenant-ID` header, and access or modify data belonging to another tenant.
* **Remediation**: Rely strictly on the security principal context derived from the cryptographically verified JWT token.

#### 5. Hardcoded Inter-Service URLs
* **Component**: Portability / Microservice Architecture ([BookingService.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/service/BookingService.java#L170-L174))
* **Role**: Senior Spring Boot Architect
* **Details**: 
  * All inter-service communications (fetching quotes/leads and cache invalidation) call `localhost:8082` directly (e.g. `http://localhost:8082/api/v1/crm/quotes/{id}`).
* **Impact**: The services cannot be deployed in staging or production environments (such as Kubernetes or Docker Compose) where hostname discovery is required, without modifying the source code.
* **Remediation**: Inject URL configurations via Spring `@Value` from properties or configure Eureka/Spring Cloud Gateway service discovery.

#### 6. Next.js Routing Anti-Pattern (Wiped State and Page Reloads)
* **Component**: Next.js Architecture ([page.tsx](file:///d:/EventOs/web/src/app/events/page.tsx#L449))
* **Role**: Senior Next.js Architect
* **Details**: 
  * Screen transitions (e.g., clicking on an event card or navigating back to the dashboard) are implemented using `window.location.href` rather than the Next.js `<Link>` component or `useRouter()` hook.
* **Impact**: Triggers a full browser reload, tearing down the DOM, wiping the React Query memory cache, and forcing re-download of assets, defeating the performance benefits of a Single Page Application.
* **Remediation**: Replace all occurrences of `window.location.href` with Next.js client-side `<Link>` components or `router.push()`.

---

### 🔵 MEDIUM SEVERITY

#### 7. Missing Global Exception Handler (Inconsistent API Payloads)
* **Component**: Error Handling ([event-service](file:///d:/EventOs/backend/event-service/))
* **Role**: Senior Spring Boot Architect / Senior QA Engineer
* **Details**: 
  * The `event-service` lacks a global `@ControllerAdvice` or exception translation layer.
  * When validation errors occur (e.g., `@NotBlank` fails on `CreateEventDto`), Spring Boot returns Tomcat's default nested validation response, whereas caught runtime exceptions return a custom `{ success: false, error: { code, message } }` format.
* **Impact**: The client has to parse two different error shapes, and raw JVM exception details are exposed during 500 errors.
* **Remediation**: Implement a unified `@ControllerAdvice` and override `handleMethodArgumentNotValid` to return a standardized validation error payload.

#### 8. Lack of Date Validation on Milestone Schedules
* **Component**: Timeline Accuracy ([EventService.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/service/EventService.java#L212-L225))
* **Role**: Senior QA Engineer
* **Details**: 
  * The backend accepts and persists timeline milestones (`EventTimelineItem`) without verifying that their `scheduledTime` falls between the associated event's `startDate` and `endDate`.
* **Impact**: Planners can add event milestones set years in the future or past, corrupting the timeline chronology.
* **Remediation**: Add validator logic in the service layer to reject milestones with dates outside the parent event bounds.

#### 9. Absence of External Calendar Synchronization
* **Component**: Calendar Synchronization ([page.tsx](file:///d:/EventOs/web/src/app/events/page.tsx))
* **Role**: Senior Product Designer / Senior QA Engineer
* **Details**: 
  * The application does not offer any calendar synchronization integrations (Google Calendar, Apple iCal, Outlook) or export formats (like `.ics` feeds).
* **Impact**: Planners must manually copy dates, leading to potential schedule conflicts.
* **Remediation**: Implement a basic iCal feed generation endpoint or integrate an OAuth-based calendar synchronization service.

---

### 🟢 LOW SEVERITY

#### 10. Unsecured cache invalidation call
* **Component**: Security / Cache Integrity ([BookingService.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/service/BookingService.java#L444-L458))
* **Role**: Principal Security Engineer
* **Details**: 
  * The method `invalidateDashboardCache` makes an unauthenticated HTTP POST call to `localhost:8082` to clear cache.
* **Impact**: If the target route is secured, the call fails silently. If it is unsecured, it represents a security loophole where unauthorized requests can trigger cache evictions.
* **Remediation**: Secure the endpoint and attach a service-to-service authentication token.

#### 11. Accessibility Barriers in Calendar grid
* **Component**: Accessibility ([page.tsx](file:///d:/EventOs/web/src/app/events/page.tsx#L232-L241))
* **Role**: Senior Product Designer
* **Details**: 
  * Calendar grid days are interactive `div` elements with `onClick` but lack `tabIndex`, ARIA roles, or keyboard navigation handlers.
* **Impact**: Keyboard-only and screen-reader users are completely locked out of selecting dates and scheduling events.
* **Remediation**: Add `tabIndex={0}`, `role="button"`, and `onKeyDown` listeners to all interactive cells.

#### 12. Lack of Status Transition Rules
* **Component**: Business Logic ([EventService.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/service/EventService.java#L197-L203))
* **Role**: Senior QA Engineer
* **Details**: 
  * Event status updates are applied directly without validating the transition (e.g. from `CANCELLED` back to `IN_PROGRESS`). Furthermore, cancelling an event does not cascade status changes to the associated Booking record.
* **Impact**: Inconsistent state mappings where bookings can remain active while parent events are cancelled.
* **Remediation**: Implement a transition validator map or state machine logic in the service layer.
