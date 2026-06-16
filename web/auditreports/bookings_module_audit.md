# Audit Report: EventOS Bookings Module

**Date**: June 16, 2026  
**Auditors**: Principal Security Engineer, Senior Product Designer, Senior Next.js Architect, Senior Spring Boot Architect, Senior QA Engineer  
**Scope**: Bookings Module (Backend: `event-service` Booking APIs, Frontend: `bookings` list and details pages)

---

## Overall Audit Score: 62 / 100 (D+)

The Bookings module provides a functional ledger mapping event budgets, payment clearances, contract timeline milestones, and resource assignments, supported by a pessimistic-locked sequence generator and an audit logging framework. However, critical vulnerabilities exist due to a complete lack of method-level RBAC, an insecure tenant ID fallback header, and a lack of state transition guards that allow users to override COMPLETED/CANCELLED statuses or force booking conversion from unapproved quotes.

---

## Findings by Severity

### 🔴 CRITICAL SEVERITY

#### 1. Lack of Backend Role Validation (RBAC Bypass)
* **Component**: Security ([BookingController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/BookingController.java))
* **Role**: Principal Security Engineer / Senior Spring Boot Architect
* **Details**: 
  * Although `@EnableMethodSecurity` is active, no `@PreAuthorize` or `@Secured` annotations protect the endpoints in `BookingController.java`.
  * Operations such as modifying booking statuses (`PATCH /{id}/status`), logging collected payments (`PATCH /{id}/payment`), and assigning resources are open to any authenticated user under the tenant.
* **Impact**: External client portal accounts (authenticated as `CLIENT`) can construct direct HTTP requests to bypass frontend blocks, log fake payments (clear outstanding balances to zero), or modify assignment allocations.
* **Remediation**: Guard mutating mappings with Spring Security annotations, e.g., `@PreAuthorize("hasAnyRole('ADMIN', 'PLANNER')")`.

#### 2. Insecure Client Identity Extraction (Header Dependency)
* **Component**: Security ([BookingController.java#L310-L324], [BookingService.java#L427-L438])
* **Role**: Principal Security Engineer
* **Details**: 
  * The controllers and services attempt to resolve user details from the authenticated principal. However, if the principal is absent, the system falls back to the client-provided HTTP headers `X-Tenant-ID` and `X-User-ID`.
* **Impact**: If the API gateway fails to strip/overwrite user-supplied headers, a malicious client could bypass security tokens, supply customized headers, and access or modify booking records belonging to other tenants.
* **Remediation**: Rely strictly on the secure token principal context (`SecurityContextHolder`), never on HTTP headers that can be spoofed.

#### 3. Unsecured Backchannel Cache Invalidation call
* **Component**: Performance / Security ([BookingService.java#L444-L458])
* **Role**: Principal Security Engineer
* **Details**: 
  * In `invalidateDashboardCache`, the service makes an asynchronous HTTP POST call to `localhost:8082` to clear the CRM dashboard metrics.
  * This call is made as a raw HTTP request without attaching any authentication token or secret keys.
* **Impact**: If the CRM metrics invalidation route is properly secured, the cache eviction will fail silently (401/403). If it is unsecured, it represents a security loophole where unauthorized requests can trigger cache thrashing.
* **Remediation**: Implement secure backchannel communication using WebClient configured with a system token or API keys.

---

### 🟡 HIGH SEVERITY

#### 4. Quote-to-Booking Conversion Integrity Bypass
* **Component**: Workflow Integrity ([QuoteService.java#L202-L224])
* **Role**: Senior QA Engineer
* **Details**: 
  * The conversion endpoint `POST /bookings/from-quote/{quoteId}` in `BookingController.java` does not verify the current status of the Quote before provisioning a booking.
* **Impact**: A user (or client) can bypass the approval workflow and trigger booking creation for quotes that are currently in `DRAFT`, `REJECTED`, or `EXPIRED` status.
* **Remediation**: Verify in the backend that the quote status is strictly `ACCEPTED` before permitting conversion.

#### 5. Next.js Routing Anti-Pattern (Wiped State and Page Reloads)
* **Component**: Next.js Architecture ([page.tsx](file:///d:/EventOs/web/src/app/bookings/page.tsx#L178), [page.tsx](file:///d:/EventOs/web/src/app/bookings/%5Bid%5D/page.tsx#L258))
* **Role**: Senior Next.js Architect
* **Details**: 
  * Screen transitions (e.g., clicking on a booking card or navigating back to the dashboard) are implemented using `window.location.href` rather than the Next.js `<Link>` component or `useRouter()` hook.
* **Impact**: Triggers a full browser reload, tearing down the DOM, wiping the React Query memory cache, and forcing re-download of assets, defeating the performance benefits of a Single Page Application.
* **Remediation**: Replace all occurrences of `window.location.href` with Next.js client-side `<Link>` components or `router.push()`.

#### 6. Hardcoded Inter-Service URLs
* **Component**: Portability / Microservice Architecture ([BookingService.java#L37], [BookingService.java#L201-L203])
* **Role**: Senior Spring Boot Architect
* **Details**: 
  * Inter-service communications (fetching quotes/leads and cache invalidation) call `localhost:8082` directly (e.g. `http://localhost:8082/api/v1/crm/leads/{id}`).
* **Impact**: The services cannot be deployed in staging or production environments (such as Kubernetes or Docker Compose) where hostname discovery is required, without modifying the source code.
* **Remediation**: Inject URL configurations via Spring `@Value` from properties or configure Eureka/Spring Cloud Gateway service discovery.

---

### 🔵 MEDIUM SEVERITY

#### 7. Hardcoded Dates in Proposal Conversions (Date Desync)
* **Component**: Booking Creation Workflow ([BookingService.java#L224-L233])
* **Role**: Senior Product Designer / Senior QA Engineer
* **Details**: 
  * When a booking is converted from an approved quote, the associated Event is auto-provisioned with hardcoded start and end dates (`LocalDateTime.now().plusDays(30)`).
* **Impact**: The system completely ignores the target event date that was recorded in the lead or quote. Planners must manually adjust dates on the event details page, which can lead to conflicts.
* **Remediation**: Capture the planned event date from the CRM lead entity and map it to the event start/end dates during conversion.

#### 8. Broken Status Transitions on Payment Events
* **Component**: Status Transition Integrity ([BookingService.java#L320-L328])
* **Role**: Senior Spring Boot Architect / Senior QA Engineer
* **Details**: 
  * When a payment is recorded, the service automatically updates the booking status to `CONFIRMED` if `paidAmount >= totalAmount`.
  * However, there is no check for the booking's current status.
* **Impact**: If a booking was already marked as `COMPLETED` or `CANCELLED`, recording a payment will transition the status back to `CONFIRMED`.
* **Remediation**: Restrict the automatic status upgrade to bookings that are currently in the `PENDING` state.

#### 9. Missing Database Unique Constraints on Booking Numbers
* **Component**: Database Integrity ([Booking.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/entity/Booking.java))
* **Role**: Senior Spring Boot Architect
* **Details**: 
  * The system uses `TenantSequence` with pessimistic locking to generate unique booking numbers per tenant.
  * However, there is no composite unique constraint `(tenant_id, booking_number)` on the `bookings` database table.
* **Impact**: If sequence generation is bypassed or manipulated manually in the database, the system will allow duplicate booking numbers to persist within the same tenant.
* **Remediation**: Define a unique constraint at the JPA level: `@Table(name = "bookings", uniqueConstraints = {@UniqueConstraint(columnNames = {"tenant_id", "booking_number"})})`.

---

### 🟢 LOW SEVERITY

#### 10. Inconsistent Routing Path Scheme (API Inconsistency)
* **Component**: API Consistency ([BookingController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/BookingController.java))
* **Role**: Senior Spring Boot Architect
* **Details**: 
  * Bookings are exposed under `/api/v1/events/bookings/...` because of the `event-service` context path `/api/v1/events`.
* **Impact**: Inconsistent with the frontend where bookings are a top-level module (`/bookings`). It incorrectly implies that bookings are sub-resources of events, even though the database treats them as separate entities.
* **Remediation**: Restructure routes at the gateway level or remove the microservice context-path prefix.

#### 11. Accessibility Barriers on Timeline Milestone Checklist
* **Component**: Accessibility ([page.tsx](file:///d:/EventOs/web/src/app/bookings/%5Bid%5D/page.tsx#L495-L502))
* **Role**: Senior Product Designer
* **Details**: 
  * Milestone list elements are interactive `div` elements with `onClick` but lack `tabIndex`, ARIA roles, or keyboard navigation handlers.
* **Impact**: Keyboard-only and screen-reader users are unable to toggle milestone completion status.
* **Remediation**: Add `tabIndex={0}`, `role="button"`, and `onKeyDown` listeners to the milestone cards.

#### 12. Non-Responsive Flex Layout on Resource Inputs
* **Component**: MobileUX ([page.tsx](file:///d:/EventOs/web/src/app/bookings/%5Bid%5D/page.tsx#L447-L458))
* **Role**: Senior Product Designer
* **Details**: 
  * The input fields for assigning resources use a non-collapsing `grid-cols-2` layout on mobile screens.
* **Impact**: Causes the input fields to get extremely squished on small mobile devices, making text entry difficult.
* **Remediation**: Wrap inputs in a vertical flex layout (`flex-col`) on small screens, adapting to a horizontal layout (`md:flex-row`) on desktops.
