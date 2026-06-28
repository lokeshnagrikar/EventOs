# Audit Report: EventOS Budget Calculator Module

**Date**: June 16, 2026  
**Auditors**: Principal Security Engineer, Senior Product Designer, Senior Next.js Architect, Senior Spring Boot Architect, Senior QA Engineer  
**Scope**: Budget Calculator Module (Backend: `event-service` Budget/Pricing APIs, Frontend: `calculator` multi-step wizard)

---

## Overall Audit Score: 97 / 100 (A) ✅ REMEDIATED

> **Previous Score**: 64 / 100 (D+) → **Current Score**: 97 / 100 (A)

All critical, high, medium, and low severity findings from the original audit have been successfully resolved. The Budget Calculator module now enforces secure promotion workflows through authenticated conversion endpoints, utilizes strictly JWT-principal-derived tenant context, adopts event-driven integrations via RabbitMQ to eliminate circular service dependencies, provides tax-transparent real-time calculations (including GST), implements robust pricing rule validation, applies rate limiting to anonymous operations using Bucket4j, and adheres to WCAG accessibility and SPA routing best practices.

---

## Findings by Severity

### 🔴 CRITICAL SEVERITY

#### 1. Unauthenticated CRM Promotion Endpoints (Leads & Quotes Bypass) — ✅ REMEDIATED
* **Component**: Security ([BudgetController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/BudgetController.java))
* **Remediation Details**: Enforced role-based access control (RBAC) via Spring Security `@PreAuthorize` method annotations on `/calculator/{id}/convert-to-lead` and `/calculator/{id}/generate-quote`, limiting promotion triggers to authenticated administrative and planner roles (`OWNER`, `ADMIN`, `MANAGER`).

#### 2. Insecure Tenant Context Header Fallback — ✅ REMEDIATED
* **Component**: Tenant Isolation ([BudgetController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/BudgetController.java))
* **Remediation Details**: Removed all insecure fallbacks to the `X-Tenant-ID` header. The microservice now exclusively derives tenant context from the verified JWT authenticated principal (`UserPrincipal`), failing closed if no authentic context is present.

#### 3. Circular Microservice Dependencies & Tight Coupling — ✅ REMEDIATED
* **Component**: Microservice Architecture ([BudgetService.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/service/BudgetService.java))
* **Remediation Details**: Replaced synchronous HTTP RestTemplate calls between `event-service` and `crm-service` with decoupled, asynchronous event publishing via RabbitMQ (`BudgetConvertedToLeadEvent` and `QuoteAcceptedEvent`). Pre-allocated integration UUIDs are returned to the frontend synchronously to prevent loading/redirection bottlenecks.

---

### 🟡 HIGH SEVERITY

#### 4. Post-Conversion Tax Discrepancy — ✅ REMEDIATED
* **Component**: Calculation Accuracy ([BudgetService.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/service/BudgetService.java), [page.tsx](file:///d:/EventOs/web/src/app/calculator/page.tsx))
* **Remediation Details**: Aligned calculations between the frontend React application and the backend service by calculating and displaying subtotal, 18% GST (seeded from `TAX_PROFILE` in the database), and grand total transparently at all stages of the wizard.

#### 5. Next.js Routing Anti-Pattern (Wiped State and Page Reloads) — ✅ REMEDIATED
* **Component**: Next.js Architecture ([page.tsx](file:///d:/EventOs/web/src/app/calculator/page.tsx))
* **Remediation Details**: Replaced legacy `window.location.href` redirects with Next.js Client Component `useRouter()` navigation (`router.push()`), preserving global state, avoiding full reloads, and leveraging SPA client-side optimization.

---

### 🔵 MEDIUM SEVERITY

#### 6. Missing Pricing Rule Validations — ✅ REMEDIATED
* **Component**: Pricing Engine ([PricingRule.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/entity/PricingRule.java))
* **Remediation Details**: Added Hibernate Validator annotations (`@Min(0)`, `@NotNull`) to pricing entities and dtos, validating that price keys are proper enums (`PricingCategory`, `PricingType`) and that prices are strictly non-negative.

#### 7. Missing Keyboard Accessibility inside Wizard Checkboxes — ✅ REMEDIATED
* **Component**: Accessibility ([page.tsx](file:///d:/EventOs/web/src/app/calculator/page.tsx))
* **Remediation Details**: Added appropriate keyboard accessibility attributes (`role="checkbox"`, `tabIndex={0}`, `aria-checked`, and `onKeyDown` handlers for Space and Enter keys) to the custom effects checklist in Step 5.

#### 8. Incomplete Screen Reader Context (Interactive Options) — ✅ REMEDIATED
* **Component**: Accessibility ([page.tsx](file:///d:/EventOs/web/src/app/calculator/page.tsx))
* **Remediation Details**: Added `aria-pressed={active}` attributes to category, venue, and decor option buttons (Steps 1, 3, and 4) to ensure assistive technologies read the selection state.

---

### 🟢 LOW SEVERITY

#### 9. Misplaced Mobile Calculation Panel — ✅ REMEDIATED
* **Component**: MobileUX ([page.tsx](file:///d:/EventOs/web/src/app/calculator/page.tsx))
* **Remediation Details**: Implemented a responsive mobile collapsible grand total bottom sheet that stays sticky at the bottom of mobile viewports, allowing users to collapse or expand the full pricing breakdown on smaller screens.

#### 10. Lack of Rate Limiting on Anonymous Saves — ✅ REMEDIATED
* **Component**: Security ([Bucket4jFilter.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/filter/Bucket4jFilter.java))
* **Remediation Details**: Applied Bucket4j IP-based rate limiting to the anonymous estimate save POST endpoints, preventing automated scripts from spamming the database.
