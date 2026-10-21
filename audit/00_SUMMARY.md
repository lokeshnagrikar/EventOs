# EventOS Comprehensive Security & Architectural Audit
## Executive Summary & Final Report

**Audit Completed:** 2026-10-20  
**Auditor:** Senior Staff Engineer & Security Auditor  
**Scope:** Complete EventOS Repository (Next.js 15 frontend, Spring Boot microservices `api-gateway`, `auth-service`, `crm-service`, `event-service`, `gallery-service`, PostgreSQL 17, Redis 7.2, RabbitMQ 3.13, Cloudinary, Docker Compose, Caddy)

---

## 1. Executive Summary

EventOS is an ambitious, modern enterprise operating system designed for event planning businesses, wedding coordinators, and creative agencies. The repository exhibits high engineering caliber in several domains: strict multi-tenant data isolation via `tenant_id` at both the gateway and repository layers, robust JWT RS256/HS256 dual-profile authentication, atomic Lua-based Redis sliding-window rate limiting on login, native `BigDecimal` financial mathematics, clean Flyway schema versioning across 4 isolated databases, and comprehensive Indian rupee formatting (`₹3,29,220`).

However, the audit identified **3 Critical and 4 High vulnerabilities** that must be resolved prior to handling live customer funds and confidential media:
1. **Live Production Secrets in Git/Docker**: Live Razorpay production merchant keys and secrets (`rzp_live_...`) are hardcoded in compose files and Dockerfiles.
2. **CORS SOP Bypass in Caddy**: Wildcard Origin reflection paired with `Access-Control-Allow-Credentials: true` allows any external malicious site to make authenticated requests with victim browser cookies.
3. **Stored XSS**: Unescaped `User-Agent` rendering via `dangerouslySetInnerHTML` in the client portal settings page.
4. **Denial-of-Service / Memory Crashes**: ZIP archive streaming buffers entire high-resolution media files into the JVM heap as raw byte arrays, creating immediate Out-Of-Memory container crashes on large albums.
5. **Brute-Force Passcode Vulnerability**: Public guest gallery links lack IP rate-limiting, exposing 4-digit PINs to automated enumeration.

---

## 2. Top 10 Critical Issues (Ranked)

### [CRITICAL] 1. Live Production Razorpay Keys Committed in Compose Files and Dockerfile
- **Location:** `d:\EventOs\docker-compose.prod.yml:98-99` & `d:\EventOs\web\Dockerfile:8`
- **Evidence:**
  ```yaml
  - NEXT_PUBLIC_RAZORPAY_KEY_ID=${NEXT_PUBLIC_RAZORPAY_KEY_ID:-rzp_live_TjIIttn39f18sO}
  - RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET:-c1B76Np8hv3Ckj8y2WxiZIIT}
  ```
- **Impact:** Live production merchant credentials granting complete access to capture charges, issue refunds, and withdraw funds are permanently recorded in the codebase and built container images.
- **Fix:** Immediately rotate Razorpay API keys in the Razorpay Dashboard. Remove all fallback default values from compose and Docker files, requiring mandatory environment injection (`${RAZORPAY_KEY_SECRET:?Mandatory Secret}`).

---

### [CRITICAL] 2. Sensitive Third-Party Secrets Committed in Environment File (`.env`)
- **Location:** `d:\EventOs\.env:1-35`
- **Evidence:**
  ```dotenv
  CLOUDINARY_API_KEY=947936662499252
  CLOUDINARY_API_SECRET=d8k23...
  SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
  RESEND_API_KEY=re_44Hxc...
  ```
- **Impact:** Attackers obtaining source access gain full administrative control over Cloudinary media, internal Slack alerting channels, and transactional email dispatch.
- **Fix:** Add `.env` to `.gitignore`. Revoke and re-issue the Cloudinary and Resend API keys. Store secrets in an encrypted secret manager (e.g., AWS Secrets Manager, Infisical, or Docker Secrets).

---

### [CRITICAL] 3. Arbitrary CORS Origin Reflection with Credentials in Caddyfile
- **Location:** `d:\EventOs\Caddyfile:4,13`
- **Evidence:**
  ```caddy
  @origin header Origin *
  header @origin Access-Control-Allow-Origin "{header.Origin}"
  header @origin Access-Control-Allow-Credentials "true"
  ```
- **Impact:** Any malicious website visited by an authenticated user can execute cross-origin authenticated requests, stealing sensitive booking records, invoices, and client data.
- **Fix:** Replace dynamic `{header.Origin}` reflection with an explicit whitelist:
  ```caddy
  @allowedOrigin header Origin https://eventosapp.in https://www.eventosapp.in https://admin.eventosapp.in
  header @allowedOrigin Access-Control-Allow-Origin "{header.Origin}"
  header @allowedOrigin Access-Control-Allow-Credentials "true"
  ```

---

### [HIGH] 4. Stored XSS via `dangerouslySetInnerHTML` on Session Browser Display
- **Location:** `d:\EventOs\web\src\app\portal\settings\page.tsx:386`
- **Evidence:**
  ```tsx
  <span className="text-[9px] text-zinc-555 block font-mono" dangerouslySetInnerHTML={{ __html: s.browser }} />
  ```
- **Impact:** An attacker can submit a login request with a malicious `User-Agent: <img src=x onerror=...>`, executing arbitrary JavaScript in the browser of any administrator or client viewing the session tab.
- **Fix:** Remove `dangerouslySetInnerHTML` and render `s.browser` as safe JSX text: `{s.browser}`.

---

### [HIGH] 5. Lack of Brute-Force Lockout on Public Passcode-Protected Guest Gallery Portals
- **Location:** `d:\EventOs\backend\gallery-service\src\main\java\com\eventos\gallery\service\ShareLinkService.java:118-125`
- **Evidence:**
  ```java
  if (!passwordEncoder.matches(passcode.trim(), shareLink.getPassword())) {
      throw new BadCredentialsException("Invalid passcode");
  }
  ```
- **Impact:** Failed passcode attempts are logged but never throttled or locked out. An attacker can brute-force a 4-digit PIN in minutes, compromising private wedding and family albums.
- **Fix:** Track failed attempts in Redis by `token:ip`. Lock passcode verification for 30 minutes after 5 consecutive failures.

---

### [HIGH] 6. Memory Exhaustion (OOM) via In-Memory Buffering in Batch ZIP Streaming
- **Location:** `d:\EventOs\backend\gallery-service\src\main\java\com\eventos\gallery\controller\AlbumController.java:206-212` & `ShareLinkController.java:195-200`
- **Evidence:**
  ```java
  byte[] fileBytes = galleryItemService.downloadFileBytes(item.getUrl());
  zipOut.write(fileBytes);
  ```
- **Impact:** Downloading high-resolution albums loads entire files into JVM heap memory as byte arrays. In a container restricted to 512MB RAM, large downloads will crash `gallery-service` with `java.lang.OutOfMemoryError`.
- **Fix:** Stream input bytes directly from Cloudinary's HTTP stream into `ZipOutputStream` using `InputStream.transferTo(zipOut)` without creating intermediate byte arrays.

---

### [HIGH] 7. Production PostgreSQL and RabbitMQ Ports Exposed to Public Internet
- **Location:** `d:\EventOs\docker-compose.prod.yml:13,49-51`
- **Evidence:**
  ```yaml
  postgres:
    ports:
      - "5432:5432"
  rabbitmq:
    ports:
      - "5672:5672"
      - "15672:15672"
  ```
- **Impact:** Production database and message broker ports listen on `0.0.0.0`, leaving them exposed to port scans, brute-force attacks, and network sniffing if firewall rules fail.
- **Fix:** Remove public `ports:` bindings from `postgres` and `rabbitmq`. Containers communicate internally via Docker network aliases.

---

### [MEDIUM] 8. Private Gallery Share Tokens Leaked to External Third-Party QR Service
- **Location:** `d:\EventOs\web\src\components\gallery\ShareQrModal.tsx:134` & `web/src/app/gallery/[id]/page.tsx:382`
- **Evidence:**
  ```typescript
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(shareUrl)}`;
  ```
- **Impact:** Private gallery URLs and access tokens are transmitted unencrypted to a third-party service (`api.qrserver.com`), allowing third-party server administrators to view private client albums.
- **Fix:** Generate QR codes locally in the browser using the `qrcode.react` package.

---

### [MEDIUM] 9. Mock Database Backup Endpoint Giving False Sense of Disaster Recovery
- **Location:** `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\controller\BillingController.java:953-971`
- **Evidence:**
  ```java
  // Returns simulated backup snapshot string "4.85 GB" without invoking pg_dump
  ```
- **Impact:** Platform administrators assume automated backups are functioning, but no actual database dump or offsite S3 archive is executed. Host hardware failure results in total, unrecoverable data loss.
- **Fix:** Deploy an automated backup sidecar container running `pg_dump` daily with encrypted streaming to an S3/Wasabi/B2 bucket.

---

### [MEDIUM] 10. WebSocket STOMP Handshake Bypass for `guest-token`
- **Location:** `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\config\WebSocketConfig.java:64-70`
- **Evidence:**
  ```java
  if ("guest-token".equals(token)) {
      accessor.setUser(new UsernamePasswordAuthenticationToken("guest", null, Collections.emptyList()));
      return message;
  }
  ```
- **Impact:** Anyone can establish a WebSocket connection to the production server by presenting `Bearer guest-token`, bypassing authentication.
- **Fix:** Disable `guest-token` evaluation when `spring.profiles.active=prod`.

---

## 3. Scorecards (0–10)

| Category | Score | Justification |
| :--- | :---: | :--- |
| **Security** | **5.5 / 10** | Strong JWT and rate limiting, but compromised by hardcoded live Razorpay keys, CORS reflection, and stored XSS. |
| **Multi-Tenancy** | **8.5 / 10** | Consistent `tenant_id` scoping across all repository queries and controllers without client header fallbacks. |
| **Data Integrity** | **7.5 / 10** | Native `BigDecimal` arithmetic, `@Version` optimistic locking, and append-only booking audit logs. |
| **Code Quality** | **7.0 / 10** | Modern Spring Boot and Next.js design system, but bloated 4,800-line single-file components in settings. |
| **Test Coverage** | **7.5 / 10** | 54 backend JUnit/Testcontainers test classes, Playwright E2E suites, and k6 load tests present. |
| **DevOps Maturity** | **5.0 / 10** | GitHub Actions present, but zero-downtime deploys absent, no container resource limits, and backup is a mock. |
| **Production-Readiness** | **6.0 / 10** | Highly functional for staging, but requires secret rotation, CORS hardening, and memory tuning before live production. |

---

## 4. Claims to Remove or Soften in Documentation

1. **"AI Copilot with RAG and Deep Knowledge Retrieval"**  
   *Current Reality:* Client makes direct calls to Google Gemini without database retrieval, falling back to static strings.  
   *Recommendation:* Soften to *"AI Assistant with contextual prompts (Knowledge Base RAG coming soon)"*.
2. **"Legally Binding Cryptographic E-Signatures"**  
   *Current Reality:* Captures only a plain typed name string (`/s/ John Doe`). Does not capture IP, User-Agent, document hash, or OTP verification.  
   *Recommendation:* Soften to *"Digital Proposal Acceptance & Typed Approval"*.
3. **"Frame-by-Frame Media Comments"**  
   *Current Reality:* Not implemented in backend schema or API.  
   *Recommendation:* Remove claim until dedicated comment entities and tables are built.
4. **"Automated Disaster Recovery & Database Backups"**  
   *Current Reality:* Superadmin backup endpoint returns a fake `4.85 GB` string.  
   *Recommendation:* Remove claim until an active `pg_dump` S3 sync job is deployed.
5. **"Inbound Lead Auto-Capture from Marketing Sites"**  
   *Current Reality:* Leads are only created internally via budget conversion or manual UI entry.  
   *Recommendation:* Soften to *"Internal CRM Lead Conversion"*.

---

## 5. Prioritized 2-Week Fix Roadmap

### Week 1: Critical Security Hardening & Secret Rotation
- **Day 1:** Revoke and re-issue live Razorpay, Cloudinary, and Resend API keys. Clean all fallback credentials from `docker-compose*.yml` and `web/Dockerfile`.
- **Day 2:** Fix Caddy CORS configuration: replace dynamic origin reflection with strict domain whitelist (`eventosapp.in`).
- **Day 3:** Eliminate stored XSS in `web/src/app/portal/settings/page.tsx:386` (remove `dangerouslySetInnerHTML`).
- **Day 4:** Remove public exposure of PostgreSQL (5432) and RabbitMQ (5672/15672) in `docker-compose.prod.yml`.
- **Day 5:** Add Redis-based brute-force rate-limiting and lockout for public guest gallery passcodes in `ShareLinkService.java`.

### Week 2: Reliability, Memory & Feature Completion
- **Day 6:** Refactor ZIP archive streaming in `AlbumController.java` to use stream-to-stream chunk transfer, eliminating JVM heap buffering.
- **Day 7:** Replace external `api.qrserver.com` calls with local browser-side QR generation (`qrcode.react`).
- **Day 8:** Deploy real automated `pg_dump` backup cron script archiving compressed dumps to an S3-compatible bucket.
- **Day 9:** Add `Idempotency-Key` tracking on payment installment collection to prevent double-click balance increments.
- **Day 10:** Set explicit Docker container memory and CPU limits (`deploy.resources.limits`) across all services in `docker-compose.prod.yml`.

---

## 6. Audit Index & Deliverables
All detailed phase audit documents have been saved to the `/audit/` directory:
- [Repository Map & Hygiene](file:///d:/EventOs/audit/01_repo_map.md)
- [Backend: API Gateway Audit](file:///d:/EventOs/audit/02_backend_api_gateway.md)
- [Backend: Auth Service Audit](file:///d:/EventOs/audit/02_backend_auth_service.md)
- [Backend: CRM Service Audit](file:///d:/EventOs/audit/02_backend_crm_service.md)
- [Backend: Event Service Audit](file:///d:/EventOs/audit/02_backend_event_service.md)
- [Backend: Gallery Service Audit](file:///d:/EventOs/audit/02_backend_gallery_service.md)
- [Security Deep Dive](file:///d:/EventOs/audit/03_security.md)
- [Frontend Architecture](file:///d:/EventOs/audit/04_frontend.md)
- [Gallery & Media Subsystem](file:///d:/EventOs/audit/05_gallery.md)
- [DevOps, Testing & Reliability](file:///d:/EventOs/audit/06_devops_quality.md)
- [Product Claims Verification Matrix](file:///d:/EventOs/audit/07_claims_verification.md)
- [Executive Summary & Final Report](file:///d:/EventOs/audit/00_SUMMARY.md)
