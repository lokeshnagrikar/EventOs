# Phase 2: Backend Service Deep Dive — API Gateway (`api-gateway`)

> **Service**: `backend/api-gateway`  
> **Framework**: Spring Cloud Gateway (Spring Cloud 2023.0.1 on Spring Boot 3.3.0, Netty Reactive Engine)  
> **Port**: `8080` (Proxied to public internet or Caddy)  
> **Auditor**: Senior Staff Engineer & Security Auditor  

---

## 1. Routing & Endpoint Surface

The Gateway acts as the sole reverse proxy for all client traffic (`/api/v1/*`):

| Route ID | Path Predicate | Target URI | Rewrite Filters | Security / Auth Filter |
| :--- | :--- | :--- | :--- | :--- |
| `auth-websocket` | `/api/v1/auth/ws`, `/api/v1/auth/ws/**` | `ws://auth-service:8081` | None | Bypasses JWT filter (Public list line 74) |
| `auth-service` | `/api/v1/auth/**` | `http://auth-service:8081` | None (`sensitiveHeaders: ""`) | Evaluated by `JwtAuthFilter` |
| `crm-service` | `/api/v1/crm/**` | `http://crm-service:8082` | None | Evaluated by `JwtAuthFilter` |
| `bookings-route` | `/api/v1/bookings/**` | `http://event-service:8083` | `RewritePath=/api/v1/bookings(?<segment>.*), /api/v1/events/bookings${segment}` | Evaluated by `JwtAuthFilter` |
| `event-service` | `/api/v1/events/**` | `http://event-service:8083` | None | Evaluated by `JwtAuthFilter` |
| `client-portal-route`| `/api/v1/client/**` | `http://event-service:8083` | `RewritePath=/api/v1/client(?<segment>.*), /api/v1/events/client${segment}` | Evaluated by `JwtAuthFilter` |
| `audit-logs-route` | `/api/v1/audit-logs/**` | `http://event-service:8083` | `RewritePath=/api/v1/audit-logs(?<segment>.*), /api/v1/events/audit-logs${segment}` | Evaluated by `JwtAuthFilter` |
| `gallery-service` | `/api/v1/gallery/**` | `http://gallery-service:8084` | None | Evaluated by `JwtAuthFilter` |

---

## 2. Authentication, Authorization & Security Architecture

### 2.1 Header Stripping (Anti-Spoofing Protection)
- **Location**: `d:\EventOs\backend\api-gateway\src\main\java\com\eventos\gateway\config\JwtAuthFilter.java:201-222`
- **Mechanism**: The gateway intercepts every incoming request and removes any client-supplied internal headers (`X-Tenant-ID`, `X-User-ID`, `X-User-Roles`, `X-Gateway-Secret`, `X-Impersonated`, `X-Trace-ID`, etc.) before forwarding.
- **Evidence**:
  ```java
  ServerHttpRequest cleanRequest = request.mutate()
          .headers(headers -> {
              headers.remove("X-Tenant-ID");
              headers.remove("X-Tenant-Id");
              headers.remove("X-User-ID");
              headers.remove("X-User-Roles");
              headers.remove("X-Gateway-Secret");
              ...
          }).build();
  ```
- **Evaluation**: ✅ Correctly prevents external HTTP clients from injecting arbitrary tenant identities or administrative roles.

### 2.2 Public Endpoint Whitelist
- **Location**: `JwtAuthFilter.java:55-80`
- **Whitelisted Endpoints**:
  - Auth: `/api/v1/auth/login`, `/register`, `/inquiries`, `/refresh`, `/switch`, `/forgot-password`, `/reset-password`, `/bootstrap`, `/magic-link`, `/verify-magic-token`, `/verify-email`, `/verify-otp`, `/resend-verification`, `/accept-invite`, `/captcha`, `/2fa/verify`, `/send-whatsapp-otp`, `/verify-whatsapp-otp`, `/ws`, `/billing/webhook`, `/billing/plans`.
  - Public Client Portals: `/api/v1/crm/quotes/public/`, `/api/v1/gallery/share/public/`.
  - Observability: `/actuator`.

### 2.3 Cryptographic Verification & Secret Handling
- **Location**: `JwtAuthFilter.java:120-184`
- **Mechanism**:
  - In `prod` profile, strictly requires RS256 with an explicit RSA Public Key (`JWT_PUBLIC_KEY` or file `jwt_public.pem`).
  - In non-prod profiles, falls back to symmetric HS256 with `JWT_SECRET_KEY`, and generates an ephemeral in-memory RSA keypair if no secret is provided.
- **Finding**: Default fallback secret exists in `application.yml:88`:
  `secret: ${JWT_SECRET_KEY:9a4f2c8d7e6b5a3f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d}`.

### 2.4 Token Revocation Checks (Redis)
- **Location**: `JwtAuthFilter.java:277-318`
- **Checks Performed**:
  1. Token Blacklist: `redisTemplate.hasKey("blacklist:" + token)`.
  2. Session Revocation: `redisTemplate.hasKey("session:revoked:" + sessionId)`.
  3. Global User Revocation: `redisTemplate.opsForValue().get("user:revoked_before:" + userId)` compared against JWT `issuedAt`.
- **Fail-Open vs Fail-Closed Behavior**:
  - In `prod` profile: Fails closed (`401 Unauthorized`) if Redis encounters an exception during revocation checks (line 314-316).
  - In non-prod profiles: Fails open, allowing cryptographically valid tokens if Redis is offline (line 317).

---

## 3. Rate Limiting Engine (`RateLimitingFilter.java`)

- **Location**: `d:\EventOs\backend\api-gateway\src\main\java\com\eventos\gateway\config\RateLimitingFilter.java`
- **Algorithm**: Redis Sorted Set (ZSET) Sliding Window (`ZREMRANGEBYSCORE`, `ZCARD`, `ZADD`, `EXPIRE`).
- **Tiered Thresholds (Per 60s Window)**:
  - Default: 120 requests/min.
  - Login: 10 attempts/min per IP.
  - Register: 5 attempts/min.
  - Password Reset / OTP / Magic Link: 5 attempts/min.
  - Token Refresh: 60 requests/min.
  - Superadmin Mutations: 10 requests/min.
  - Public Portals: 60 requests/min.
- **IP Extraction**: Validates `X-Forwarded-For` against trusted proxies (`127.0.0.1, ::1`). Falls back to remote address if untrusted.

---

## 4. Findings & Vulnerabilities for `api-gateway`

### Finding GW-1: [MEDIUM] Fallback Shared Gateway Secret Enables Microservice Bypass
- **Location**: `d:\EventOs\backend\api-gateway\src\main\resources\application.yml:91`
- **Evidence**:
  ```yaml
  gateway:
    secret: ${GATEWAY_TRUST_SECRET:eventos_gateway_secure_shared_secret}
  ```
- **Impact**: If a downstream service (`auth-service`, `crm-service`, `event-service`) is exposed directly on the internal network or via a misconfigured Docker port, an attacker using the default `eventos_gateway_secure_shared_secret` header (`X-Gateway-Secret`) can spoof identity headers (`X-Tenant-ID`, `X-User-Roles: SUPER_ADMIN`) directly to the backend services.
- **Fix**: Remove the default string fallback in all `application.yml` files. Require `GATEWAY_TRUST_SECRET` to be provided dynamically by Docker Compose secrets or Kubernetes secrets.

---

### Finding GW-2: [LOW] Broad Path Prefix Matching on Actuator
- **Location**: `d:\EventOs\backend\api-gateway\src\main\java\com\eventos\gateway\config\JwtAuthFilter.java:79`
- **Evidence**:
  ```java
  private static final List<String> PUBLIC_ENDPOINTS = List.of(
      ...
      "/actuator"
  );
  ```
- **Impact**: Using `path::startsWith` on `/actuator` allows unauthenticated access to all exposed Actuator endpoints across services (e.g. `/actuator/health`, `/actuator/prometheus`, `/actuator/info`). While health and metrics are read-only, exposing heap or env endpoints (if enabled downstream) would leak sensitive data.
- **Fix**: Restrict the public whitelist to exact matches: `/actuator/health`, `/actuator/info`, `/actuator/prometheus`.

---

## 5. Files Reviewed in this Section

1. `d:\EventOs\backend\api-gateway\pom.xml`
2. `d:\EventOs\backend\api-gateway\src\main\resources\application.yml`
3. `d:\EventOs\backend\api-gateway\src\main\java\com\eventos\gateway\ApiGatewayApplication.java`
4. `d:\EventOs\backend\api-gateway\src\main\java\com\eventos\gateway\config\JwtAuthFilter.java`
5. `d:\EventOs\backend\api-gateway\src\main\java\com\eventos\gateway\config\RateLimitingFilter.java`
6. `d:\EventOs\backend\api-gateway\src\main\java\com\eventos\gateway\config\ProductionSecurityValidator.java`
7. `d:\EventOs\backend\api-gateway\src\main\java\com\eventos\gateway\config\GlobalErrorWebExceptionHandler.java`
8. `d:\EventOs\backend\api-gateway\src\main\java\com\eventos\gateway\config\RequestLoggingFilter.java`
