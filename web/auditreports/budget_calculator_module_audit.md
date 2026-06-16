# Audit Report: EventOS Budget Calculator Module

**Date**: June 16, 2026  
**Auditors**: Principal Security Engineer, Senior Product Designer, Senior Next.js Architect, Senior Spring Boot Architect, Senior QA Engineer  
**Scope**: Budget Calculator Module (Backend: `event-service` Budget/Pricing APIs, Frontend: `calculator` multi-step wizard)

---

## Overall Audit Score: 64 / 100 (D+)

The Budget Calculator module offers a visually premium, multi-step wizard with real-time client-side updates, a customizable pricing engine using pessimistic seeding, and direct CRM integrations for leads and quotes. However, severe security gaps exist—particularly in the unauthenticated lead/quote conversion endpoints—along with architectural issues such as circular microservice dependencies, low mobile usability due to misplaced calculation breakdowns, and calculation discrepancies where taxes are added post-conversion.

---

## Findings by Severity

### 🔴 CRITICAL SEVERITY

#### 1. Unauthenticated CRM Promotion Endpoints (Leads & Quotes Bypass)
* **Component**: Security ([BudgetController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/BudgetController.java#L111-L149))
* **Role**: Principal Security Engineer / Senior Spring Boot Architect
* **Details**: 
  * Endpoints `/calculator/{id}/convert-to-lead` and `/calculator/{id}/generate-quote` do not have `@PreAuthorize` security checks.
  * Although the calculator is designed to be public-facing, these promotion endpoints trigger direct updates and record creation inside the protected CRM domain.
* **Impact**: A malicious public user can query or script requests to these endpoints, causing massive spam in the CRM lead pipeline, generating duplicate quote proposals, and incurring significant Cloudinary/database costs.
* **Remediation**: Guard the promotion endpoints with appropriate checks, or restrict conversion permissions to authenticated administrative/planner roles.

#### 2. Insecure Tenant Context Header Fallback
* **Component**: Tenant Isolation ([BudgetController.java#L211-L225])
* **Role**: Principal Security Engineer
* **Details**: 
  * The `getTenantId` helper in controllers attempts to extract the tenant ID from the signed JWT principal. However, if the principal is absent, it falls back to the HTTP request header `X-Tenant-ID`.
* **Impact**: If the API gateway fails to strip/overwrite user-supplied headers, a malicious user could bypass token validation, supply a customized `X-Tenant-ID` header, and access or modify data belonging to another tenant.
* **Remediation**: Rely strictly on the security principal context derived from the cryptographically verified JWT token.

#### 3. Circular Microservice Dependencies & Tight Coupling
* **Component**: Microservice Architecture ([BudgetService.java#L135-L254])
* **Role**: Senior Spring Boot Architect
* **Details**: 
  * `event-service` calls `crm-service` via synchronous HTTP requests to create leads and quotes.
  * Concurrently, `crm-service` calls back to `event-service` to provision bookings when quotes are approved.
* **Impact**: Creates a tight, circular coupling between services, increasing the risk of distributed lockups, service failure cascades, and integration testing bottlenecks.
* **Remediation**: Refactor the architecture so that the calculator writes to a shared message queue (e.g. RabbitMQ/Kafka) or lives entirely within the CRM domain, decoupling the services.

---

### 🟡 HIGH SEVERITY

#### 4. Post-Conversion Tax Discrepancy
* **Component**: Calculation Accuracy ([BudgetService.java#L227], [page.tsx](file:///d:/EventOs/web/src/app/calculator/page.tsx#L187-L203))
* **Role**: Senior Product Designer / Senior QA Engineer
* **Details**: 
  * The frontend wizard calculates a simple sum of catering, venue, decor, and effects.
  * When converting to a quote, the backend injects an 18% standard GST tax rate:
    `quoteDto.put("taxRate", BigDecimal.valueOf(18.00));`
* **Impact**: Customers see a specific total price in the calculator wizard (e.g., INR 500,000) but are presented with a higher price in the generated quote proposal (e.g., INR 590,000) due to taxes, leading to confusion and lack of trust.
* **Remediation**: Add a toggle in the calculator wizard to show taxes and calculations including GST, ensuring pricing transparency.

#### 5. Next.js Routing Anti-Pattern (Wiped State and Page Reloads)
* **Component**: Next.js Architecture ([page.tsx](file:///d:/EventOs/web/src/app/calculator/page.tsx#L355))
* **Role**: Senior Next.js Architect
* **Details**: 
  * Screen transitions (e.g., navigating back to the dashboard or CRM) are implemented using `window.location.href` rather than the Next.js `<Link>` component or `useRouter()` hook.
* **Impact**: Triggers a full browser reload, tearing down the DOM, wiping the React Query memory cache, and forcing re-download of assets, defeating the performance benefits of a Single Page Application.
* **Remediation**: Replace all occurrences of `window.location.href` with Next.js client-side `<Link>` components or `router.push()`.

---

### 🔵 MEDIUM SEVERITY

#### 6. Missing Pricing Rule Validations
* **Component**: Pricing Engine ([BudgetService.java#L122-L125])
* **Role**: Senior Spring Boot Architect / Senior QA Engineer
* **Details**: 
  * `savePricingRule` persists rules directly without validating that the price is non-negative, or checking that the category and price types are valid enums.
* **Impact**: Planners could enter negative values or invalid configuration data, causing arithmetic exceptions or rendering errors in the calculator.
* **Remediation**: Enforce validation checks on price bounds and category strings in the service layer before saving pricing rules.

#### 7. Missing Keyboard Accessibility inside Wizard Checkboxes
* **Component**: Accessibility ([page.tsx](file:///d:/EventOs/web/src/app/calculator/page.tsx#L589-L614))
* **Role**: Senior Product Designer
* **Details**: 
  * Special effects selectors in Step 5 are built using `div` elements with `onClick` handlers.
  * They lack `tabIndex`, keypress event handlers (`onKeyDown`), and standard ARIA roles (e.g., `role="checkbox"`).
* **Impact**: Keyboard-only and screen-reader users are unable to focus, select, or toggle special effects within the wizard.
* **Remediation**: Replace the `div` containers with standard HTML `<button>` or `<input type="checkbox">` elements, or add explicit ARIA roles and keyboard listeners.

#### 8. Incomplete Screen Reader Context (Interactive Options)
* **Component**: Accessibility ([page.tsx](file:///d:/EventOs/web/src/app/calculator/page.tsx#L435-L455))
* **Role**: Senior Product Designer
* **Details**: 
  * Interactive category cards in Steps 1 and 3 use standard button elements but do not indicate their selection state to screen readers (e.g., via `aria-pressed` or `aria-selected` attributes).
* **Impact**: Visually impaired users cannot determine which option is currently active.
* **Remediation**: Set `aria-pressed={active}` on option buttons.

---

### 🟢 LOW SEVERITY

#### 9. Misplaced Mobile Calculation Panel
* **Component**: MobileUX ([page.tsx](file:///d:/EventOs/web/src/app/calculator/page.tsx#L791-L858))
* **Role**: Senior Product Designer
* **Details**: 
  * The calculation breakdown panel is positioned as a sidebar using `sticky top-6`.
  * On mobile viewports, the grid collapses and places this panel at the bottom of the page, below the wizard content.
* **Impact**: Mobile users must scroll to the bottom of the page to see how their selections affect the budget total, defeating the purpose of real-time calculations.
* **Remediation**: Render a floating header or summary bar at the top or bottom of the mobile viewport showing the live grand total.

#### 10. Lack of Rate Limiting on Anonymous Saves
* **Component**: Security ([BudgetController.java#L66-L88])
* **Role**: Principal Security Engineer
* **Details**: 
  * Public users can save estimates without authentication, but there is no rate limiting on the `/calculator` POST endpoint.
* **Impact**: Malicious scripts can repeatedly submit estimate saves to flood the database.
* **Remediation**: Integrate a rate-limiting filter (e.g. Bucket4j) or add reCAPTCHA validation for anonymous submissions.
