# EventOS Bug Resolution Report

## 1. Summary of Fixed Client-Side Bugs

### Bug 1: Hydration Mismatch in Preloader State
* **File**: [app/page.tsx](file:///d:/EventOs/web/src/app/page.tsx)
* **Symptom**: React hydration warning because the server-rendered preloader layout differed from the client layout when bypass flags (`nopreload`) were processed during initialization.
* **Fix**: Standardized the initial preloader state to render identically on both server and client, moving search parameters/localStorage inspection into a `useEffect` hook.

---

### Bug 2: Hydration Mismatch in Dialog and Portal Overlays
* **File**: [app/providers.tsx](file:///d:/EventOs/web/src/app/providers.tsx)
* **Symptom**: Overlays like `OnboardingWizard` and `OnboardingChecklistWidget` checked local storage during store creation, resolving to `isOpen: true` on the browser but `isOpen: false` on the server.
* **Fix**: Implemented a `mounted` boolean tracker hook inside `providers.tsx` and wrapped all client-only floating portals and overlay widgets in `{mounted && ( ... )}` to defer rendering until hydration completes.

---

### Bug 3: Hydration Mismatch in Navigation `Sidebar.tsx`
* **File**: [components/dashboard/Sidebar.tsx](file:///d:/EventOs/web/src/components/dashboard/Sidebar.tsx)
* **Symptom**: The client-side menu rendered links based on the authenticated user's role (`OWNER` permissions), while the server rendered fallback links (`CLIENT` permissions), throwing a DOM layout discrepancy error.
* **Fix**: Tracked mounting inside the sidebar component and forced the menu items to evaluate using the public fallback state (`CLIENT` role with no permissions) during hydration, transitioning smoothly to the actual active user session once mounted.

---

### Bug 4: Invaliding Console Warning (setState during render)
* **File**: [app/dashboard/page.tsx](file:///d:/EventOs/web/src/app/dashboard/page.tsx)
* **Symptom**: `Cannot update a component (ToastContainer) while rendering a different component (DashboardPage)`. This warning was triggered because the `addToast` function was being invoked inside the state updater callback parameter of `setPriorityTasks`.
* **Fix**: Refactored `handleTogglePriority` to find the completed task and trigger the toast message outside of the state modifier callback function.

---

## 2. Summary of Runtime System warnings (OTel 404/401)
* **OTel Exporter warnings**: OpenTelemetry connection errors (`Failed to connect to localhost:4318` or `HTTP status 404`) in microservice terminal consoles are caused by local runs not starting Tempo. These logs are non-blocking warnings that cease once the Docker-compose Tempo service is spun up.
* **Billing API 401s**: Hard-reloading the browser clears in-memory JWT tokens, triggering transient `401 Unauthorized` responses on automatic dashboard data fetches. The Axios egress interceptor automatically captures these 401s, silently requests a token refresh (`/auth/refresh`), and retries the requests to successfully load data (`200 OK`).
