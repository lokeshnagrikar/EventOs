# Audit Report: EventOS Client Portal Module

**Date**: June 16, 2026  
**Auditors**: Principal Security Engineer, Senior Product Designer, Senior Next.js Architect, Senior Spring Boot Architect, Senior QA Engineer  
**Scope**: Client Portal Module (Frontend: `portal` layouts and dashboards, Backend: Client endpoints across CRM, Event, and Gallery microservices)

---

## Overall Audit Score: 55 / 100 (D-)

The Client Portal module delivers a premium visual experience for clients, offering real-time progress indicators, interactive milestone checklists, and details for quotes and invoices. However, the module is undermined by critical security design flaws: client-side role checks can be bypassed by editing local storage, token session details are exposed to XSS, and a systemic lack of ownership validation creates Broken Object Level Authorization (BOLA/IDOR) vulnerabilities where portal users can access or approve quotes, invoices, and albums belonging to other clients.

---

## Findings by Severity

### 🔴 CRITICAL SEVERITY

#### 1. Broken Object Level Authorization (BOLA / IDOR) on Private Details
* **Component**: Security ([InvoiceController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/InvoiceController.java), [QuoteController.java](file:///d:/EventOs/backend/crm-service/src/main/java/com/eventos/crm/controller/QuoteController.java), [EventController.java](file:///d:/EventOs/backend/event-service/src/main/java/com/eventos/event/controller/EventController.java))
* **Role**: Principal Security Engineer
* **Details**: 
  * Endpoints like `GET /invoices/{id}`, `GET /quotes/{id}`, and `GET /events/{id}` retrieve details checking only that the entity matches the user's `tenantId`.
  * The backend does not verify that the authenticated client's email matches the client details recorded on the target invoice, quote, or event workspace.
* **Impact**: A client portal user can view private contracts, invoice statements, and event plans belonging to other clients under the same tenant by sending direct API calls with guessed UUIDs.
* **Remediation**: In service queries, restrict data fetching by checking both tenant ID and client email, e.g., `invoiceRepository.findByIdAndClientEmailAndTenantId(id, email, tenantId)`.

#### 2. Client-Side Role Checks Bypass (Privilege Escalation)
* **Component**: Security / Session ([layout.tsx#L33-L40])
* **Role**: Senior Next.js Architect / Principal Security Engineer
* **Details**: 
  * Layout navigation guards rely on values stored in `localStorage` to authorize access to client views:
    ```javascript
    const storedRole = localStorage.getItem("user_role");
    if (!storedName || (storedRole !== "CLIENT" && storedRole !== "ADMIN" && storedRole !== "MANAGER")) { ... }
    ```
* **Impact**: Low-privileged accounts can bypass frontend page locks and access administrative dashboards by manually modifying their `user_role` variable inside browser local storage keys.
* **Remediation**: Use JWT claim decoding inside route middleware to verify roles and permissions cryptographically instead of trusting local storage strings.

#### 3. BOLA Vulnerability on Client Album Retrieval
* **Component**: Tenant Isolation ([AlbumController.java#L123-L135], [AlbumService.java#L119-L127], [gallery/page.tsx])
* **Role**: Principal Security Engineer
* **Details**: 
  * The client album query endpoint `GET /gallery/albums/client` reads a comma-separated list of `eventIds` from query parameters and fetches associated albums without validating client assignments.
* **Impact**: Malicious portal users can inject event IDs associated with other clients and fetch their private gallery albums.
* **Remediation**: Verify that the authenticated client's email is linked to the requested `eventIds` before querying the database repository.

#### 4. Header Spoofing and Verification Fallbacks
* **Component**: Security ([EventController.java#L307-L335], [PaymentController.java#L143-L158], [QuoteController.java#L192-L207])
* **Role**: Principal Security Engineer
* **Details**: 
  * Client endpoints use downstream HTTP request headers like `X-User-Email` and `X-Tenant-ID` to filter data without validating JWT signatures or authentication state.
* **Impact**: If gateway security is bypassed or internal ports are exposed, an attacker can spoof these headers to retrieve, update, or approve documents of any user.
* **Remediation**: Downstream services must read user identity exclusively from the authenticated Spring Security Context Principal populated by a cryptographically secure token filter.

---

### 🟡 HIGH SEVERITY

#### 5. Session Exposure to Cross-Site Scripting (XSS)
* **Component**: Session Management ([layout.tsx#L60-L66])
* **Role**: Principal Security Engineer
* **Details**: 
  * Session variables including usernames, user roles, user IDs, and tenant contexts are saved and cleared from browser `localStorage`.
* **Impact**: If the frontend suffers an XSS injection (e.g., through unescaped client input or third-party scripts), an attacker can extract session keys and take over client portal accounts.
* **Remediation**: Store authentication tokens and user session indicators inside secure, HttpOnly, and SameSite-strict cookies instead of local storage.

#### 6. Next.js Routing Anti-Pattern (Page Reloads)
* **Component**: Next.js Architecture ([layout.tsx#L38], [layout.tsx#L65])
* **Role**: Senior Next.js Architect
* **Details**: 
  * Page redirects during authentication checks and logout actions are executed using `router.push()` or direct assignments to `window.location.href`.
* **Impact**: Full page reloads destroy the React virtual DOM tree, clear the query memory cache, and force re-fetching of all bundle resources.
* **Remediation**: Route navigation exclusively using Next.js client-side router redirects.

#### 7. Missing Quote Ownership Verification on Approval Endpoint
* **Component**: Workflow Integrity ([QuoteController.java#L145-L168], [QuoteService.java#L180-L200])
* **Role**: Senior QA Engineer / Senior Spring Boot Architect
* **Details**: 
  * The `POST /quotes/{id}/approve` endpoint accepts a quote ID and executes lead updates and booking provisioning without confirming the caller matches the client email on the quote.
* **Impact**: Any user under the tenant can approve random quotes, triggering automated CRM lead transitions and event-service bookings.
* **Remediation**: Add checks to `approveQuote` verifying that the caller's email matches `quote.getClientEmail()`.

---

### 🔵 MEDIUM SEVERITY

#### 8. Inter-Service Hardcoded URLs in Quote Approvals
* **Component**: Portability / Microservice Architecture ([QuoteService.java#L215-L219])
* **Role**: Senior Spring Boot Architect
* **Details**: 
  * When a quote is approved, the service invokes a booking generation endpoint in `event-service` using a hardcoded endpoint address `http://localhost:8083`.
* **Impact**: Restricts microservice routing in containerized environments (such as Kubernetes or Docker Compose) where services communicate via DNS hostnames instead of localhost.
* **Remediation**: Inject the event service base URL via Spring `@Value` properties.

#### 9. Transient Theme Configurations (Desynchronization)
* **Component**: User Experience ([layout.tsx#L53-L58])
* **Role**: Senior Product Designer
* **Details**: 
  * The dark/light theme state is toggled in the document root class list, but is not persisted in local storage or user profiles.
* **Impact**: Whenever a user navigates to a new page or reloads the client portal, the theme resets to the default dark mode, causing jarring page flashes.
* **Remediation**: Save the selected theme mode inside a cookie or local configuration variable and apply it during initial page load.

---

### 🟢 LOW SEVERITY

#### 10. Missing Modal Focus Traps
* **Component**: Accessibility ([quotes/page.tsx#L159-L290], [invoices/page.tsx#L187-L276])
* **Role**: Senior Product Designer
* **Details**: 
  * Detail panels and drawers are rendered as conditional overlay dialogs without keyboard focus controls.
* **Impact**: Keyboard-only users can navigate past the modal boundaries, making it difficult to read modal content or dismiss drawers.
* **Remediation**: Use focus-trap wrappers (e.g. Radix UI primitives) to trap focus inside active panels and allow Esc keys to dismiss overlays.

#### 11. Timeline UI Mobile Truncation
* **Component**: Mobile UX ([timeline/page.tsx#L61-L65])
* **Role**: Senior Product Designer
* **Details**: 
  * Timeline dot indicators use absolute positioning (`-left-[30px]`) relative to their container.
* **Impact**: On narrow mobile screens, these indicators can be truncated or overflow the viewport edges.
* **Remediation**: Increase the left padding of the timeline container or adjust spacing dynamically on mobile layouts.

#### 12. Lack of Touch Backdrops on Mobile Menus
* **Component**: Mobile UX ([layout.tsx#L103-L160])
* **Role**: Senior Product Designer
* **Details**: 
  * The mobile menu drawer is displayed as a top header expansion, but does not render a touch backdrop on the rest of the page.
* **Impact**: Users cannot dismiss the menu by tapping outside it, forcing them to precisely click the toggle button.
* **Remediation**: Add a semi-transparent overlay backdrop that closes the drawer when tapped.
