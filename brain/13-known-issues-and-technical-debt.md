# EventOS — Known Issues & Technical Debt

## CRITICAL

### 1. Google OAuth Client ID Hardcoded as Fallback
**Source:** `web/src/app/providers.tsx:240`
**Issue:** Google OAuth client ID is hardcoded as a fallback string in the GoogleOAuthProvider. If `NEXT_PUBLIC_GOOGLE_CLIENT_ID` env var is not set, a real client ID is used directly in source code.
**Risk:** Credential exposure in public repository.
**RECOMMENDATION:** Remove hardcoded fallback; require env var or disable Google auth.

### 2. AI Provider Mock API Key in Default Config
**Source:** `web/src/lib/aiProvider.ts:49`
**Issue:** Default config includes `apiKey: "sk-proj-mockkey1234567890"` — while it's clearly mock, it sets a pattern that could lead to real keys being hardcoded.
**Risk:** Low (mock key), but bad pattern for future development.
**RECOMMENDATION:** Default to empty string; require explicit configuration.

### 3. No Database Migration System
**Source:** All backend services use Hibernate auto-DDL
**Issue:** No Flyway or Liquibase migrations. Schema changes are managed entirely by JPA entity definitions.
**Risk:** Difficult to track schema evolution, no rollback capability, potential data loss on entity changes in production.
**RECOMMENDATION:** Introduce Flyway or Liquibase before production data becomes critical.

---

## HIGH

### 4. Massive Single-File Pages
**Issue:** Several pages are extraordinarily large single files:
- `web/src/app/dashboard/page.tsx` — **138KB** (single file)
- `web/src/app/settings/page.tsx` — **218KB** (single file)
- `web/src/app/superadmin/page.tsx` — **105KB** (single file)
- `web/src/app/crm/page.tsx` — **56KB**
- `web/src/app/gallery/page.tsx` — **35KB**
**Risk:** Extremely difficult to maintain, debug, review, or test. IDE performance impact. Bundle size impact.
**RECOMMENDATION:** Decompose into smaller components/modules.

### 5. Unused `payment_db` Database
**Source:** `docker/postgres/init-db.sql:5`
**Issue:** `payment_db` is created during initialization but no service connects to it. Payment functionality is in event-service using `event_db`.
**Risk:** Confusion, wasted resources.
**RECOMMENDATION:** Remove from init-db.sql or migrate payment entities to dedicated service.

### 6. AuthService.java is 102KB
**Source:** `backend/auth-service/.../service/AuthService.java`
**Issue:** Single service class handling authentication, registration, OAuth, magic links, OTP, 2FA, workspace management, admin operations.
**Risk:** God class anti-pattern. Very difficult to maintain and test.
**RECOMMENDATION:** Decompose into focused service classes.

### 7. BillingService.java is 62KB
**Source:** `backend/auth-service/.../service/BillingService.java`
**Issue:** Single service handling all billing logic — subscriptions, plans, usage, invoices, payment methods, Stripe integration.
**Risk:** Similar to AuthService — too many responsibilities.
**RECOMMENDATION:** Decompose into SubscriptionService, UsageService, StripeService.

---

## MEDIUM

### 8. Dual Storage of Auth Tokens
**Source:** `web/src/store/authStore.ts`
**Issue:** Tokens are stored in both `sessionStorage` AND `localStorage` simultaneously (with different key names: `accessToken` vs `eventos_access_token`). This creates sync complexity.
**Risk:** Stale token usage, confusing debugging.
**RECOMMENDATION:** Standardize on one storage mechanism with consistent key names.

### 9. CORS Disabled in SecurityConfig
**Source:** `backend/auth-service/.../config/SecurityConfig.java:57`
**Issue:** `.cors(AbstractHttpConfigurer::disable)` — CORS is disabled at Spring Security level. CORS is instead handled by Caddy/Nginx at the proxy layer and at API Gateway level.
**Risk:** If proxy is bypassed, no CORS protection exists. This is intentional but could be dangerous in some deployment scenarios.

### 10. JVM Crash Logs in Repository
**Source:** Multiple `hs_err_pid*.log` and `replay_pid*.log` files in service directories and root
**Issue:** JVM crash dumps are committed to the repository.
**Risk:** Repository bloat, potentially sensitive information in crash dumps.
**RECOMMENDATION:** Add `hs_err_pid*.log` and `replay_pid*.log` to `.gitignore`.

### 11. Simulated AI Responses
**Source:** `web/src/lib/aiProvider.ts:109-153`
**Issue:** `generateAIResponse()` uses hardcoded responses with artificial 800ms delay. No actual LLM API calls are made.
**Risk:** Users may expect real AI functionality. Feature positioning mismatch.
**RECOMMENDATION:** Implement real LLM integration or clearly mark as demo/preview.

### 12. Frontend Redis Client
**Source:** `web/src/lib/redis.ts`
**Issue:** Frontend includes ioredis client for SSR-side caching. Requires Redis connection from Next.js server.
**Risk:** Additional infrastructure dependency for frontend deployment.

---

## LOW

### 13. Inconsistent Error Handling Pattern
**Issue:** Some controllers use `GlobalExceptionHandler`, others have inline try-catch. Response structure is generally consistent but exception handling depth varies.
**RECOMMENDATION:** Standardize error handling across all services.

### 14. Test Coverage Unknown
**Issue:** JaCoCo is configured but test coverage reports are in `target/` (gitignored). Integration tests exist for event-service but overall coverage is unknown.
**RECOMMENDATION:** Add coverage thresholds and CI enforcement.

### 15. Backup SQL in Repository Root
**Source:** `backup.sql` (root directory)
**Issue:** Large database backup file in repository root.
**Risk:** Repository bloat, potential data exposure.
**RECOMMENDATION:** Remove from repo, use proper backup infrastructure.

### 16. Lenis Scroll Exclusion List Maintenance
**Source:** `web/src/app/providers.tsx:120-138`
**Issue:** Long manually-maintained list of route prefixes where Lenis smooth scroll is disabled. Any new protected route must be added manually.
**RECOMMENDATION:** Invert logic — enable Lenis only on known public marketing routes.

### 17. `events/page.tsx` is a Redirect
**Source:** `web/src/app/events/page.tsx` (408 bytes)
**Issue:** Events page appears to be a very small file — likely a redirect or minimal wrapper.
**INFERENCE:** The actual event list view may be embedded in the dashboard or rendered differently.

Source: All files referenced above
