# Audit Report: EventOS Payments & Invoices Module

**Date**: June 16, 2026  
**Auditors**: Principal Security Engineer, Senior Product Designer, Senior Next.js Architect, Senior Spring Boot Architect, Senior QA Engineer  
**Scope**: Payments & Invoices Module (Backend: `event-service` Invoice & Payment APIs, Frontend: `invoices` list and detail pages)

---

## Overall Audit Score: 58 / 100 (D)

The Payments & Invoices module provides core transactional mechanics, including invoice numbering based on pessimistic database locks, partial payment calculations, and integration with a financial ledger. However, several critical vulnerabilities degrade its stability: a complete lack of method-level RBAC leaves billing endpoints open to privilege escalation, spoofable header fallbacks threaten tenant isolation, and physical database deletions of payments and ledger transactions violate standard accounting practices. Additionally, state machine desynchronization and client-side floating-point logic compromise data reliability.

---

## Findings by Severity

### 🔴 CRITICAL SEVERITY

#### 1. Lack of Backend Role Validation (RBAC Bypass)
* **Component**: Security ([InvoiceController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/InvoiceController.java), [PaymentController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/PaymentController.java))
* **Role**: Principal Security Engineer / Senior Spring Boot Architect
* **Details**: 
  * Although `@EnableMethodSecurity` is enabled in [SecurityConfig.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/config/SecurityConfig.java#L15), none of the endpoints in `InvoiceController` or `PaymentController` are guarded with `@PreAuthorize` or `@Secured`.
  * Operations such as recording a payment (`POST /payments`), deleting invoices/payments (`DELETE /invoices/{id}`, `DELETE /payments/{id}`), or altering invoice statuses (`PUT /invoices/{id}/status`) are open to any authenticated user with a valid JWT token.
* **Impact**: A client (with a low-privilege `CLIENT` role token) can construct direct HTTP requests to record fake successful payments, wiping out their outstanding balance, or delete invoices to erase billing records.
* **Remediation**: Annotate endpoints with role checks, e.g., `@PreAuthorize("hasAnyRole('ADMIN', 'PLANNER')")` for write and delete actions.

#### 2. Physical Deletion of Financial Ledger Records (Ledger Mutability)
* **Component**: Financial Integrity ([PaymentService.java#L221-L242])
* **Role**: Senior Spring Boot Architect / Senior QA Engineer
* **Details**: 
  * When a payment record is deleted, `PaymentService.deletePayment` executes `paymentRepository.delete(payment)` and physically deletes the linked `Transaction` entries from the database using `transactionRepository.delete(tx)`.
* **Impact**: This violates standard double-entry bookkeeping and accounting audit compliance (e.g., SOX, GAAP). Financial records must be immutable; deletions make auditing impossible.
* **Remediation**: Redesign the ledger to be append-only. Voiding or deleting a payment must write a reversing entry (e.g., `DEBIT` to offset `CREDIT` or a `VOIDED` status update) instead of mutating historical DB rows.

#### 3. Insecure Tenant ID Extraction (Spoofing Risk)
* **Component**: Security ([InvoiceController.java#L208-L222], [PaymentController.java#L162-L176])
* **Role**: Principal Security Engineer
* **Details**: 
  * The `getTenantId` helper method extracts the tenant ID from the Spring Security context principal. If the principal is missing, it falls back to parsing the client-supplied `X-Tenant-ID` HTTP header.
* **Impact**: If the API gateway fails to strip/overwrite incoming headers, a malicious client can supply a custom header, spoof their tenant, and view or alter financial files of other tenants.
* **Remediation**: Rely exclusively on secure token claims within the `SecurityContextHolder` principal. Throw a `401 Unauthorized` error if the context is unauthenticated.

---

### 🟡 HIGH SEVERITY

#### 4. O(N) In-Memory Transaction Filtering on Payment Deletion
* **Component**: Performance ([PaymentService.java#L225-L231])
* **Role**: Senior Spring Boot Architect
* **Details**: 
  * To delete transactions associated with a payment, the service fetches *all* transactions for the tenant from the database (`transactionRepository.findAllByTenantIdOrderByTransactionDateDesc(tenantId)`) and filters them in memory using a Java loop.
* **Impact**: For mature tenants with thousands of transactions, loading the entire transaction ledger into memory triggers severe performance degradation, memory spikes, and garbage collection pauses.
* **Remediation**: Define a query method on the repository layer to delete transactions directly by payment ID: `transactionRepository.deleteByPaymentIdAndTenantId(paymentId, tenantId)`.

#### 5. Broken State Transitions Overriding Completed/Cancelled States
* **Component**: Workflow Integrity ([PaymentService.java#L244-L284])
* **Role**: Senior QA Engineer
* **Details**: 
  * The payment reconciliation methods `recalculateBookingPaidAmount` and `recalculateInvoicePaidAmount` update booking and invoice statuses based on the sum of successful payments. 
  * If the calculated paid amount matches or exceeds the total, a booking is automatically updated to `BookingStatus.CONFIRMED` and an invoice to `PAID`.
* **Impact**: If a booking or invoice was already manually marked as `COMPLETED`, `CANCELLED`, or `VOIDED`, recording or deleting a payment will force the status back to `CONFIRMED` or `PENDING`, violating workflow rules and desynchronizing histories.
* **Remediation**: Verify the current state before altering status. Do not auto-update the status of entities that are already `COMPLETED` or `CANCELLED`.

#### 6. Next.js Routing Anti-Pattern (Page Reloads)
* **Component**: Next.js Architecture ([page.tsx#L203], [page.tsx#L340], [[id]/page.tsx#L137], [[id]/page.tsx#L157])
* **Role**: Senior Next.js Architect
* **Details**: 
  * Back buttons and detail view triggers use direct assignments to `window.location.href` to route pages (e.g., `window.location.href = "/invoices"`).
* **Impact**: Triggers full page reloads, destroying the DOM, wiping the React Query cache, and forcing re-download of assets, eliminating Single Page Application benefits.
* **Remediation**: Replace all occurrences of `window.location.href` with Next.js `<Link>` components or `router.push()` from `useRouter()`.

#### 7. Unsecured Backchannel Cache Invalidation Call
* **Component**: Performance / Security ([PaymentService.java#L134-L146])
* **Role**: Principal Security Engineer / Senior Spring Boot Architect
* **Details**: 
  * During cache eviction, `evictCache` launches an asynchronous `CompletableFuture` to execute a raw POST connection to `localhost:8082/api/v1/crm/dashboard/metrics/invalidate`.
  * The call is hardcoded to `localhost:8082` and does not supply authorization tokens or credentials.
* **Impact**: If the CRM dashboard endpoint is secured, the invalidation call will fail silently with a `401`/`403` status, leaving dashboard metrics stale. If it succeeds without authorization, it represents an unsecured backchannel. Hardcoded URLs also prevent containerized deployment (e.g. Docker Compose/Kubernetes) where hostnames are dynamic.
* **Remediation**: Inject the CRM service base URL via Spring `@Value` properties, and use a configured `WebClient` that attaches a secret system authorization token.

---

### 🔵 MEDIUM SEVERITY

#### 8. Client-Side Floating-Point Math Vulnerabilities
* **Component**: Frontend Logic ([page.tsx#L153-L168])
* **Role**: Senior QA Engineer / Senior Next.js Architect
* **Details**: 
  * Invoice totals and input values are parsed using native JavaScript floating-point arithmetic:
    ```javascript
    const subNum = parseFloat(subtotal);
    const taxNum = parseFloat(tax);
    const discNum = parseFloat(discount);
    ```
* **Impact**: Binary floating-point representation can introduce precision errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). Invoicing calculations must remain exact to prevent rounding mismatches in ledger totals.
* **Remediation**: Perform calculations in cents/paisa internally (integers) or use math libraries designed for exact decimal precision (e.g., `decimal.js`).

#### 9. Absence of Database Unique Constraints on Invoice Numbers
* **Component**: Database Integrity ([Invoice.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/entity/Invoice.java))
* **Role**: Senior Spring Boot Architect
* **Details**: 
  * While `TenantSequence` with pessimistic locking is used to generate sequential invoice numbers, there is no database-level unique constraint on `(tenant_id, invoice_number)`.
* **Impact**: If invoice sequence generation is bypassed or database rows are directly modified, duplicate invoice numbers can be persisted under the same tenant.
* **Remediation**: Define a unique constraint at the JPA level: `@Table(name = "invoices", uniqueConstraints = {@UniqueConstraint(columnNames = {"tenant_id", "invoice_number"})})`.

#### 10. Lack of Column Precision and Scale Definition
* **Component**: Database Schema ([Invoice.java#L36-L50], [Payment.java#L35-L36], [Transaction.java#L38-L39])
* **Role**: Senior Spring Boot Architect
* **Details**: 
  * Financial amounts are stored using JPA `BigDecimal` properties, but their `@Column` mappings lack explicit `precision` and `scale` definitions.
* **Impact**: Hibernate defaults to varying database column scales, which can result in inconsistent rounding or truncations when persisting high-precision monetary data.
* **Remediation**: Explicitly define column definitions for all financial amounts, e.g., `@Column(nullable = false, precision = 19, scale = 4)`.

#### 11. Missing Validation on Negative Invoice Totals
* **Component**: Financial Logic ([InvoiceService.java#L180], [page.tsx#L144-L185])
* **Role**: Senior QA Engineer
* **Details**: 
  * When generating an invoice, the system calculates `totalAmount = subtotal + tax - discount`. 
  * Although `@DecimalMin("0.00")` is configured on individual fields in [CreateInvoiceDto.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/dto/CreateInvoiceDto.java), there is no validation to verify that `discount` is less than or equal to `subtotal + tax`.
* **Impact**: Users can enter a discount exceeding the sum of the subtotal and tax, resulting in negative invoice balances, which should be modeled as credit notes or refunds instead of negative invoices.
* **Remediation**: Add a class-level validation constraint on `CreateInvoiceDto` or a service check ensuring `totalAmount` is greater than or equal to zero.

---

### 🟢 LOW SEVERITY

#### 12. Non-Standard API Route Prefix Scheme
* **Component**: API Consistency ([InvoiceController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/InvoiceController.java), [PaymentController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/PaymentController.java))
* **Role**: Senior Next.js Architect / Senior Spring Boot Architect
* **Details**: 
  * Billing endpoints are mapped under the `event-service` prefix `/api/v1/events/invoices/...` and `/api/v1/events/payments/...`.
* **Impact**: This routing scheme is inconsistent with the frontend navigation hierarchy, where invoices are a top-level workspace component (`/invoices`). It incorrectly implies that invoices and payments are sub-resources nested under events, rather than tenant-level entities.
* **Remediation**: Re-align routing at the API Gateway level to expose invoices and payments as top-level paths (e.g., `/api/v1/invoices`).

#### 13. UI Lock Blocking Threads with Window Alerts
* **Component**: User Experience ([page.tsx#L348], [[id]/page.tsx#L106])
* **Role**: Senior Product Designer
* **Details**: 
  * User notifications and confirmations rely on native browser alerts (e.g., `alert(...)` and `confirm(...)`).
* **Impact**: Native alerts pause JavaScript execution, lock the UI thread, and present a low-end user experience that deviates from a modern, premium design system.
* **Remediation**: Replace native dialogs with non-blocking toast notifications or custom Tailwind/CSS modals.

#### 14. Insufficient Accessible Keyboard Controls on Modals
* **Component**: Accessibility ([page.tsx#L376-L538])
* **Role**: Senior Product Designer
* **Details**: 
  * The "Generate Invoice" modal is implemented as a simple conditional React component (`isModalOpen && ...`) without focus traps or key event listeners.
* **Impact**: Screen readers and keyboard-only users cannot navigate the form fields properly as focus is not trapped within the modal wrapper, and pressing the `Escape` key does not close the modal.
* **Remediation**: Use accessible component primitives (such as Radix UI's Dialog or Headless UI Modal) to manage focus trapping and keyboard shortcuts automatically.

#### 15. Non-Collapsing Form Layout on Mobile Viewports
* **Component**: Mobile UX ([page.tsx#L455-L489])
* **Role**: Senior Product Designer
* **Details**: 
  * The price input fields (Subtotal, Taxes, Discount) use a non-collapsing `grid-cols-3` layout on small screens.
* **Impact**: The inputs become extremely squished on small mobile devices, making numeric entry difficult for users.
* **Remediation**: Refactor the grid cols to wrap vertically on mobile viewports (`grid-cols-1 md:grid-cols-3`).
