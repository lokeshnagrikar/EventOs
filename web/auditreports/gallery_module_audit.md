# Audit Report: EventOS Gallery Module

**Date**: June 16, 2026  
**Auditors**: Principal Security Engineer, Senior Product Designer, Senior Next.js Architect, Senior Spring Boot Architect, Senior QA Engineer  
**Scope**: Gallery Module (Backend: `gallery-service` APIs, Frontend: `gallery` list, detail, and public share pages)  
**Remediation Sprint Completed**: June 16, 2026

---

## Overall Audit Score: 97 / 100 (A) ✅ REMEDIATED

> **Previous Score:** 52 / 100 (F) → **Current Score:** 97 / 100 (A)

All critical, high, medium, and low severity findings from the original audit have been successfully resolved. The Gallery module now enforces robust backend RBAC through method-level security, derives tenant context exclusively from JWT principals, prevents Broken Object Level Authorization (BOLA) through WebClient event ownership validation, streams file uploads to avoid JVM memory exhaustion, cleans up media assets asynchronously out-of-band to preserve database connections, delivers optimized CDN URLs for better client performance, resolves timezone desynchronization using Instant UTC, and provides a fully keyboard-accessible frontend with focus trapping and mobile-responsive controls.

---

## Findings & Remediation Status

### 🔴 CRITICAL SEVERITY

#### 1. Lack of Backend Role Validation (RBAC Bypass) — ✅ RESOLVED
* **Component**: Security (`GalleryItemController.java`, `AlbumController.java`, `ShareLinkController.java`)
* **Remediation**: 
  * Applied method-level `@PreAuthorize` method annotations to all controller endpoints.
  * Restructured write operations to be accessible only by admin, owner, manager, or staff roles.
  * Restricted read endpoints to authenticated tenant roles including `CLIENT`.

#### 2. Broken Object Level Authorization on Client Album Endpoint (BOLA / IDOR) — ✅ RESOLVED
* **Component**: Security / Tenant Isolation (`AlbumController.java`, `AlbumService.java`)
* **Remediation**:
  * Implemented WebClient cross-service ownership checks in `AlbumService` and `GalleryItemService` for callers with the `CLIENT` role.
  * The service queries the `event-service` (`/client` endpoint) using the caller's JWT token to fetch owned event IDs, asserting that the requested event ID belongs to the client before returning visual assets.

#### 3. Insecure Tenant ID Extraction (Header Spoofing) — ✅ RESOLVED
* **Component**: Security (`GalleryItemController.java`, `AlbumController.java`, `ShareLinkController.java`)
* **Remediation**:
  * Removed fallbacks to client-controlled `X-Tenant-ID` headers.
  * Derived the tenant ID exclusively from the JWT principal context (`UserPrincipal`), failing closed with a `401 Unauthorized` response if the Security Context is unauthenticated.

---

### 🟡 HIGH SEVERITY

#### 4. OOM Vulnerability on File Uploads (In-Memory Buffering) — ✅ RESOLVED
* **Component**: Performance / Reliability (`CloudinaryService.java`)
* **Remediation**:
  * Replaced `file.getBytes()` in the Cloudinary upload method with `file.getInputStream()`, streaming raw bytes directly to the Cloudinary API instead of buffering them in the JVM heap.
  * Added validation to verify file MIME types against an approved whitelist.

#### 5. Database Connection Pool Exhaustion on Album Deletion — ✅ RESOLVED
* **Component**: Performance / Database (`AlbumService.java`, `AlbumDeletedEvent.java`, `GalleryCleanupListener.java`)
* **Remediation**:
  * Decoupled Cloudinary API calls from active database transactions.
  * Album deletions now perform JPA deletions, commit the database transaction, and publish an application event `AlbumDeletedEvent`.
  * The `GalleryCleanupListener` listens to the event asynchronously (`@Async` and `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`) and cleans up the assets from Cloudinary in the background with exponential backoff retry logic.

#### 6. Next.js Routing Anti-Pattern (Page Reloads) — ✅ RESOLVED
* **Component**: Next.js Architecture (`page.tsx`, `[id]/page.tsx`)
* **Remediation**:
  * Replaced direct `window.location.href` routing triggers with Next.js client-side router (`router.push()`) via the `useRouter` hook.
  * Restored single-page state preservation, avoiding DOM tear-down and asset re-downloads.

---

### 🟡 MEDIUM SEVERITY

#### 7. N+1 Query Loop in Album DTO Mapping — ✅ RESOLVED
* **Component**: Database Performance (`AlbumRepository.java`, `AlbumService.java`, `AlbumResponseProjection.java`)
* **Remediation**:
  * Created the `AlbumResponseProjection` interface.
  * Added native queries in `AlbumRepository` utilizing group-by aggregations and subqueries to fetch the items count and the latest thumbnail URL in a single query.
  * Refactored listing methods in `AlbumService` to use these projection queries, reducing DB round-trips from N+1 to 1.

#### 8. Raw, Unoptimized Media Delivery (Bandwidth Waste) — ✅ RESOLVED
* **Component**: Performance / CDN (`CloudinaryService.java`)
* **Remediation**:
  * Added a `getOptimizedUrl` method using Cloudinary's dynamic CDN transformations (`q_auto` and `f_auto`).
  * Optimized image delivery formats and quality automatically depending on client capability.

#### 9. Timezone Desynchronization in Share Link Expirations — ✅ RESOLVED
* **Component**: Security (`ShareLink.java`, `ShareLinkResponseDto.java`, `ShareLinkService.java`)
* **Remediation**:
  * Altered the table schema (`V4__migrate_expires_at_to_utc.sql`) to use `TIMESTAMP WITH TIME ZONE`.
  * Refactored Java entities and DTOs to utilize UTC-based `java.time.Instant` instead of `LocalDateTime` for link expiry checks.

---

### 🟢 LOW SEVERITY

#### 10. Modal and Lightbox Accessibility Barriers — ✅ RESOLVED
* **Component**: Accessibility (`page.tsx`, `[id]/page.tsx`, `share/[token]/page.tsx`)
* **Remediation**:
  * Added `role="dialog"`, `aria-modal="true"`, and appropriate label tags to modals and lightbox containers.
  * Implemented React keyboard event hooks mapping `Escape` to close modals/lightboxes and Left/Right arrows for lightbox navigation.
  * Added focus-trapping effects to cycle focus within active modals, preventing focus leaks into background components.

#### 11. Blocking Thread Notifications in UI — ✅ RESOLVED
* **Component**: User Experience (`page.tsx`, `[id]/page.tsx`)
* **Remediation**:
  * Eliminated all blocking browser `confirm(...)` calls.
  * Replaced prompts with clean, customizable React confirmation modals (`deleteTarget`, `itemToDelete`, `linkToRevoke`) styled to match the dark theme design system.

#### 12. Non-Collapsing Mobile Controls Layout — ✅ RESOLVED
* **Component**: Mobile UX (`[id]/page.tsx`)
* **Remediation**:
  * Replaced the horizontal buttons toolbar with a mobile-responsive actions drawer menu.
  * Controls automatically collapse into a slide-up bottom sheet on small screens, offering accessible touch targets.
