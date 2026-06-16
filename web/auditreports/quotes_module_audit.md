# Audit Report: EventOS Quotes & Proposals Module

**Date**: June 16, 2026  
**Auditors**: Principal Security Engineer, Senior Product Designer, Senior Next.js Architect, Senior Spring Boot Architect, Senior QA Engineer  
**Scope**: Quotes Module (Backend: `crm-service` Quote/Proposal APIs, Frontend: `quotes` list, builder, and details pages)

---

## Overall Audit Score: 60 / 100 (D)

The Quotes module provides a live calculation engine, drag-and-drop line item reordering, template switching, and automated PDF generation. However, critical vulnerabilities exist in security, including missing method-level RBAC, insecure tenant-ID fallback headers, and insecure client access validation. Furthermore, the module is exposed to severe performance problems due to synchronous PDF uploads to Cloudinary inside request threads, and a latent bug in the PDF generator's decimal scaling will cause 500 crashes under fractional numbers.

---

## Findings by Severity

### 🔴 CRITICAL SEVERITY

#### 1. Lack of Backend Role Validation (RBAC Bypass)
* **Component**: Security ([QuoteController.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/controller/QuoteController.java))
* **Role**: Principal Security Engineer / Senior Spring Boot Architect
* **Details**: 
  * Although `@EnableMethodSecurity` is active, no `@PreAuthorize` or `@Secured` annotations protect the endpoints in `QuoteController.java`.
  * Operations such as creating quotes, approving or rejecting proposals, and modifying statuses are exposed to any authenticated user under the tenant.
* **Impact**: External client portal accounts (authenticated as `CLIENT`) can construct direct HTTP requests to approve arbitrary proposals, bypass pricing validations, or delete/update other clients' drafts.
* **Remediation**: Annotate mutating methods with Spring Security expressions, e.g., `@PreAuthorize("hasAnyRole('ADMIN', 'PLANNER')")`.

#### 2. Insecure Client Identity Extraction (Header Dependency)
* **Component**: Client Access Controls / Security ([QuoteController.java#L192-L207])
* **Role**: Principal Security Engineer
* **Details**: 
  * The client portal endpoint `/quotes/client` retrieves quotes using the HTTP header `X-User-Email`.
  * The user ID parameter in `/quotes/{id}/approve` also falls back to the HTTP header `X-User-ID`.
* **Impact**: A client can easily modify the `X-User-Email` or `X-User-ID` request headers to view and approve quotes belonging to entirely different clients within the same tenant.
* **Remediation**: Extract the client's email and user ID directly from the cryptographically verified JWT token principal context (`SecurityContextHolder`), never from client-controlled headers.

#### 3. Latent Arithmetic Crash in PDF Generation
* **Component**: PDF Generation Reliability ([PdfGenerationService.java#L201-L204])
* **Role**: Senior Spring Boot Architect / Senior QA Engineer
* **Details**: 
  * The PDF layout service prints financial figures by calling `.setScale(2)` on fields:
    `quote.getSubtotal().setScale(2).toString()`
  * Calling `.setScale(2)` on a `BigDecimal` throws a JVM `ArithmeticException` ("Rounding necessary") if the number has a scale greater than 2 (e.g., fractional numbers generated from complex item calculations).
* **Impact**: If a line item or tax rate results in fractional numbers (like `150.1234`), generating the PDF proposal will fail with an unhandled exception, causing a 500 error when creating or viewing quotes.
* **Remediation**: Specify a rounding mode when calling `setScale`, for example: `.setScale(2, RoundingMode.HALF_UP)`.

---

### 🟡 HIGH SEVERITY

#### 4. Synchronous Third-Party Network I/O in Controller Thread (Performance Bottleneck)
* **Component**: Performance / PDF Generation ([QuoteService.java#L233-L247])
* **Role**: Senior Next.js Architect / Senior Spring Boot Architect
* **Details**: 
  * Every quote status update (including marking the quote as `VIEWED` when opened by a client, and clicking `Save` in the builder) triggers `regenerateAndUploadPdf(quote)` synchronously.
  * This blocks the request thread while it generates the PDF and uploads it over the network to Cloudinary.
* **Impact**: Slow response times (often 2–5 seconds depending on Cloudinary network latency) and thread starvation under concurrent loads.
* **Remediation**: Offload PDF generation and Cloudinary uploads to an asynchronous background worker using Spring's `@Async` or an event-driven queue.

#### 5. Insecure Tenant Context Fallback
* **Component**: Tenant Isolation ([QuoteController.java#L256-L270])
* **Role**: Principal Security Engineer
* **Details**: 
  * The `getTenantId` helper in controllers attempts to extract the tenant ID from the signed JWT principal. However, if the principal is absent, it falls back to the HTTP request header `X-Tenant-ID`.
* **Impact**: If the API gateway fails to strip/overwrite user-supplied headers, a malicious user could bypass token validation, supply a customized `X-Tenant-ID` header, and access or modify data belonging to another tenant.
* **Remediation**: Rely strictly on the security principal context derived from the cryptographically verified JWT token.

#### 6. Next.js Routing Anti-Pattern (Wiped State and Page Reloads)
* **Component**: Next.js Architecture ([page.tsx](file:///d:/EventOs/web/src/app/quotes/page.tsx#L88), [page.tsx](file:///d:/EventOs/web/src/app/quotes/%5Bid%5D/page.tsx#L228))
* **Role**: Senior Next.js Architect
* **Details**: 
  * Screen transitions (e.g., clicking on a quote card or navigating back to the dashboard) are implemented using `window.location.href` rather than the Next.js `<Link>` component or `useRouter()` hook.
* **Impact**: Triggers a full browser reload, tearing down the DOM, wiping the React Query memory cache, and forcing re-download of assets, defeating the performance benefits of a Single Page Application.
* **Remediation**: Replace all occurrences of `window.location.href` with Next.js client-side `<Link>` components or `router.push()`.

---

### 🔵 MEDIUM SEVERITY

#### 7. Missing Database Unique Constraints on Quote Numbers
* **Component**: Database Integrity ([Quote.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/entity/Quote.java))
* **Role**: Senior Spring Boot Architect
* **Details**: 
  * The system uses `TenantSequence` with pessimistic locking to generate unique quote numbers per tenant.
  * However, there is no composite unique constraint `(tenant_id, quote_number)` on the `quotes` database table.
* **Impact**: If sequence generation is bypassed or manipulated manually in the database, the system will allow duplicate quote numbers to persist within the same tenant.
* **Remediation**: Define a unique constraint at the JPA level: `@Table(name = "quotes", uniqueConstraints = {@UniqueConstraint(columnNames = {"tenant_id", "quote_number"})})`.

#### 8. Absence of Quote Versioning / Revision History
* **Component**: Quote Versioning ([QuoteService.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/service/QuoteService.java))
* **Role**: Senior Spring Boot Architect / Senior QA Engineer
* **Details**: 
  * The Quotes module does not support revisions or version tracking.
  * Since there is no edit endpoint, if a client requests changes to a quote, the planner must generate an entirely new quote, creating disconnected records (`QT-0001`, `QT-0002`) instead of a version chain (e.g., `QT-0001-v1`, `QT-0001-v2`).
  * In addition, the JPA entity lacks a `@Version` annotation to prevent concurrent modification conflicts (lost updates).
* **Remediation**: Add a `version` column to the `Quote` entity and implement optimistic locking.

#### 9. Weak Approval Workflow State Transitions
* **Component**: Approval Workflow Integrity ([QuoteService.java#L180-L200])
* **Role**: Senior QA Engineer
* **Details**: 
  * The `approveQuote` and `rejectQuote` methods apply status transitions directly without checking if the current status allows it.
  * A quote can transition directly from `DRAFT` to `ACCEPTED` without being sent or viewed. More critically, an `ACCEPTED` quote (which has already provisioned a booking in the event service) can be transitioned to `REJECTED` without rolling back the booking or lead status.
* **Remediation**: Enforce a strict state machine validator (e.g. `DRAFT -> SENT -> VIEWED -> ACCEPTED / REJECTED`) and prevent modification of accepted quotes.

---

### 🟢 LOW SEVERITY

#### 10. Unicode Render Limitation in PDF Fonts
* **Component**: PDF Generation Reliability ([PdfGenerationService.java#L60-L64])
* **Role**: Senior Product Designer
* **Details**: 
  * The PDF generation engine uses default Helvetica fonts. Helvetica does not support Unicode characters (such as local Indic languages or Indic rupee symbols).
* **Impact**: If item names or notes contain local text, OpenPDF will throw rendering exceptions or output garbled characters.
* **Remediation**: Register and configure a true-type Unicode font (like Noto Sans) as the primary PDF typeface.

#### 11. Accessibility Barriers in Quote Builder (Line Item Reordering)
* **Component**: Accessibility ([new/page.tsx](file:///d:/EventOs/web/src/app/quotes/new/page.tsx#L307-L330))
* **Role**: Senior Product Designer
* **Details**: 
  * Reordering line items utilizes native HTML5 Drag and Drop which lacks keyboard controls (e.g. space to grab, arrow keys to move, Enter to drop).
  * The reorder grab handle uses a `div` tag instead of an interactive `button` and lacks descriptive `aria-label` tags.
* **Impact**: Keyboard-only and screen-reader users are completely unable to reorder line items in the quote builder.
* **Remediation**: Add `tabIndex={0}`, `role="button"`, and keyboard handlers for grid focus and simulation.

#### 12. Non-Responsive Pricing Summary and Stacked Mobile Form
* **Component**: MobileUX ([new/page.tsx](file:///d:/EventOs/web/src/app/quotes/new/page.tsx#L331))
* **Role**: Senior Product Designer
* **Details**: 
  * On mobile screens, the line items collapse into single-column layouts, resulting in 5 stacked rows per item. This creates an extremely long form.
  * The live pricing summary collapses to the bottom of the page, preventing mobile users from seeing calculations in real-time as they edit rows.
* **Remediation**: Implement an accordion format for mobile line items and make the summary sticky at the top/bottom bar of the mobile viewport.
