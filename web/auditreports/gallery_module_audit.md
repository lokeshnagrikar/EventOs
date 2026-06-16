# Audit Report: EventOS Gallery Module

**Date**: June 16, 2026  
**Auditors**: Principal Security Engineer, Senior Product Designer, Senior Next.js Architect, Senior Spring Boot Architect, Senior QA Engineer  
**Scope**: Gallery Module (Backend: `gallery-service` APIs, Frontend: `gallery` list, detail, and public share pages)

---

## Overall Audit Score: 52 / 100 (F)

The Gallery module provides functional media organization, including Cloudinary integration, passcode-protected share links, expiring links, and responsive grid layouts. However, the module contains severe architectural flaws: a complete lack of method-level RBAC leaves all write operations vulnerable to privilege escalation, client-supplied headers can bypass tenant validation, and a Broken Object Level Authorization (BOLA) loophole lets clients view other customers' private albums. Additionally, the service is vulnerable to memory exhaustion on file uploads, suffers from N+1 query loops, and blocks database connection pools during sequential external network calls.

---

## Findings by Severity

### 🔴 CRITICAL SEVERITY

#### 1. Lack of Backend Role Validation (RBAC Bypass)
* **Component**: Security ([GalleryItemController.java](file:///d:/EventOs/backend/gallery-service/src/main/java/com/eventos/gallery/controller/GalleryItemController.java), [AlbumController.java](file:///d:/EventOs/backend/gallery-service/src/main/java/com/eventos/gallery/controller/AlbumController.java), [ShareLinkController.java](file:///d:/EventOs/backend/gallery-service/src/main/java/com/eventos/gallery/controller/ShareLinkController.java))
* **Role**: Principal Security Engineer / Senior Spring Boot Architect
* **Details**: 
  * While `@EnableMethodSecurity` is enabled in `SecurityConfig.java`, none of the controllers or endpoints are protected by `@PreAuthorize` or `@Secured` annotations.
  * Mutating actions like creating/deleting albums, uploading or deleting media items, and generating or revoking share links are accessible to any user possessing a valid JWT token.
* **Impact**: Low-privileged portal users (e.g., accounts with the `ROLE_CLIENT` role) can call write endpoints directly to manipulate, upload, or delete media items belonging to planners or other clients.
* **Remediation**: Apply method-level protection to write endpoints, e.g., `@PreAuthorize("hasAnyRole('ADMIN', 'PLANNER')")`.

#### 2. Broken Object Level Authorization on Client Album Endpoint (BOLA / IDOR)
* **Component**: Security / Tenant Isolation ([AlbumController.java#L123-L135], [AlbumService.java#L119-L127])
* **Role**: Principal Security Engineer
* **Details**: 
  * The endpoint `GET /albums/client` accepts a list of `eventIds` in query parameters and returns matching albums belonging to the tenant.
  * The service layer executes `albumRepository.findAllByTenantIdAndEventIdIn(tenantId, eventIds)` without checking whether the authenticated client account has permission or is assigned to those specific events.
* **Impact**: An authenticated client can inject arbitrary event IDs belonging to other clients of the same tenant into the query string and download their private photos and design layouts.
* **Remediation**: Validate that the authenticated client's email or user ID matches the ownership properties of the supplied event IDs before querying the albums.

#### 3. Insecure Tenant ID Extraction (Header Spoofing)
* **Component**: Security ([GalleryItemController.java#L90-L104], [AlbumController.java#L137-L151], [ShareLinkController.java#L122-L136])
* **Role**: Principal Security Engineer
* **Details**: 
  * Helper methods resolve the tenant ID from the authenticated user principal. If the principal is missing, they fallback to the client-controlled HTTP header `X-Tenant-ID`.
* **Impact**: If microservices are exposed directly (or the gateway fails to clean headers), an attacker can supply a spoofed `X-Tenant-ID` header and access or delete media files across tenant boundaries.
* **Remediation**: Restrict context extraction to the JWT Security Context principal, and reject requests that lack a secure principal context.

---

### 🟡 HIGH SEVERITY

#### 4. OOM Vulnerability on File Uploads (In-Memory Buffering)
* **Component**: Performance / Reliability ([CloudinaryService.java#L93-L96])
* **Role**: Senior Spring Boot Architect / Senior QA Engineer
* **Details**: 
  * The media uploader calls `file.getBytes()` to load the entire uploaded file into the JVM heap before sending it to the Cloudinary API.
* **Impact**: When multiple users upload large video or image files (up to the 50MB request limit set in configurations), the JVM heap can be rapidly exhausted, causing garbage collection spikes or `OutOfMemoryError` crashes.
* **Remediation**: Stream the file using `file.getInputStream()` directly into the Cloudinary uploader, or write the upload to a temp file on disk first instead of buffering bytes in memory.

#### 5. Database Connection Pool Exhaustion on Album Deletion
* **Component**: Performance / Database ([AlbumService.java#L76-L91])
* **Role**: Senior Spring Boot Architect
* **Details**: 
  * When deleting an album, the method loops through every gallery item and executes a blocking HTTP delete call to Cloudinary (`cloudinaryService.delete(...)`) inside an active `@Transactional` database transaction.
* **Impact**: If an album contains dozens of items, the database connection is held open while making slow sequential network calls. Under load, this will exhaust the application connection pool, blocking other user transactions and causing timeouts.
* **Remediation**: Execute Cloudinary file deletions asynchronously (e.g., using `@Async` or an event queue) after committing the database transaction, or perform database deletes first and clean up Cloudinary assets out-of-band.

#### 6. Next.js Routing Anti-Pattern (Page Reloads)
* **Component**: Next.js Architecture ([page.tsx#L138], [page.tsx#L207], [[id]/page.tsx#L167], [[id]/page.tsx#L336], [[id]/page.tsx#L351])
* **Role**: Senior Next.js Architect
* **Details**: 
  * Frontend pages use `window.location.href` to transition between dashboard routes, gallery paths, and album detail lists.
* **Impact**: Tears down the React tree and browser DOM, wiping the React Query memory cache and forcing re-download of static assets, defeating the purpose of a Next.js Single Page Application.
* **Remediation**: Replace `window.location.href` assignments with Next.js client-side `<Link>` components or `router.push()` from `useRouter()`.

---

### 🔵 MEDIUM SEVERITY

#### 7. N+1 Query Loop in Album DTO Mapping
* **Component**: Database Performance ([AlbumService.java#L93-L117])
* **Role**: Senior Spring Boot Architect
* **Details**: 
  * Mapping an `Album` entity to its response DTO triggers `galleryItemRepository.findAllByTenantIdAndAlbumId(...)` to calculate the item count and retrieve the thumbnail URL.
* **Impact**: When listing albums (`GET /albums`), the database executes 1 query to fetch albums, and then N separate queries to fetch the items for each album. This results in severe latency scaling issues as the number of albums grows.
* **Remediation**: Use a custom JPQL query or a database view projection that retrieves the count and thumbnail URL using group-by aggregation in a single query.

#### 8. Raw, Unoptimized Media Delivery (Bandwidth Waste)
* **Component**: Performance / CDN ([CloudinaryService.java#L93-L96])
* **Role**: Senior Product Designer / Senior QA Engineer
* **Details**: 
  * Media files are uploaded directly to Cloudinary and served using raw secure URLs without applying automatic format or quality transformations.
* **Impact**: Browsers download original, uncompressed multi-megabyte files (e.g., raw high-res mobile photographs). This increases bandwidth costs, worsens mobile load times, and degrades page rendering performance.
* **Remediation**: Modify the Cloudinary URL generation or upload parameters to inject optimization transformations such as `q_auto` (quality auto-tuning) and `f_auto` (format auto-selection like WebP/AVIF).

#### 9. Timezone Desynchronization in Share Link Expirations
* **Component**: Security / Financial ([ShareLink.java#L49-L51])
* **Role**: Senior QA Engineer
* **Details**: 
  * The expiration check uses `expiresAt.isBefore(LocalDateTime.now())` to check validity.
* **Impact**: `LocalDateTime.now()` fetches the local time of the JVM. If the application server and the database run on different timezones, share links will expire hours earlier or later than scheduled.
* **Remediation**: Use UTC-based timestamp evaluations, such as `Instant` or `LocalDateTime.now(ZoneOffset.UTC)`.

---

### 🟢 LOW SEVERITY

#### 10. Modal and Lightbox Accessibility Barriers
* **Component**: Accessibility ([page.tsx#L292-L381], [[id]/page.tsx#L340-L436], [share/[token]/page.tsx#L340-L436])
* **Role**: Senior Product Designer
* **Details**: 
  * The create album modal and full-screen lightboxes are conditionally rendered without managing keyboard focus trapping or key press events.
* **Impact**: Screen readers and keyboard-only users cannot exit modals/lightboxes using the `Escape` key, and their keyboard focus will "leak" back into background elements, trapping interactive states.
* **Remediation**: Implement focus trap wrappers and map key event listeners (e.g., arrow keys for lightbox pagination, Escape for close actions).

#### 11. Blocking Thread Notifications in UI
* **Component**: User Experience ([[id]/page.tsx#L248], [[id]/page.tsx#L255], [[id]/page.tsx#L297])
* **Role**: Senior Product Designer
* **Details**: 
  * UI actions (such as album deletions or copy confirmations) trigger native browser dialogs like `confirm(...)` and `alert(...)`.
* **Impact**: Native browser alerts block JavaScript execution, freeze the page thread, and provide a generic UI look that conflicts with a premium design system.
* **Remediation**: Replace blocking alerts with non-blocking toast popups or elegant modal confirm overlays.

#### 12. Non-Collapsing Mobile Controls Layout
* **Component**: Mobile UX ([[id]/page.tsx#L365-L403])
* **Role**: Senior Product Designer
* **Details**: 
  * The action buttons in the detail page navigation bar (`Share Album`, `Delete Album`, `Add Media`) are arranged horizontally without collapsing on small screen widths.
* **Impact**: On small mobile devices, the buttons will wrap or overflow the screen, causing layout breakage or overlapping text.
* **Remediation**: Wrap mobile action buttons in a collapsable contextual dropdown menu on mobile viewports.
