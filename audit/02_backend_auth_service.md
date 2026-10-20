# Phase 2: Backend Service Deep Dive — Auth & Identity Service (`auth-service`)

> **Service**: `backend/auth-service`  
> **Framework**: Spring Boot 3.3.0, Spring Security 6, Spring Data JPA / Hibernate 6, Spring WebSocket (STOMP)  
> **Port**: `8081` (Context path: `/api/v1/auth`)  
> **Database**: `auth_db` (PostgreSQL 17)  
> **Auditor**: Senior Staff Engineer & Security Auditor  

---

## 1. Controllers & Endpoints Inventory

### 1.1 `AuthController` (`/api/v1/auth`)
| Method | Path | Required Role / Authority | Notes |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public (PermitAll) | Creates new Tenant, Company, User, and assigns `OWNER` membership. |
| `POST` | `/login` | Public (PermitAll) | Authenticates credentials; returns access token + sets HTTP-only refresh cookie. |
| `POST` | `/2fa/verify` | Public (PermitAll) | Verifies TOTP code or temporary 2FA ticket. |
| `POST` | `/login/google` | Public (PermitAll) | Validates Google ID token via Google Token Verifier. |
| `GET` | `/verify-email` | Public (PermitAll) | Token-based email verification. |
| `POST` | `/resend-verification` | Public (PermitAll) | Resends email verification link. |
| `POST` | `/verify-otp` | Public (PermitAll) | 6-digit OTP verification for email. |
| `POST` | `/refresh` | Public (PermitAll) | Reads refresh token from HTTP-only cookie or body; rotates refresh token. |
| `POST` | `/logout` | Authenticated | Blacklists current JWT in Redis and clears refresh cookie. |
| `POST` | `/forgot-password` | Public (PermitAll) | Emits password reset token. |
| `POST` | `/reset-password` | Public (PermitAll) | Consumes reset token and updates password hash. |
| `POST` | `/bootstrap/superadmin`| Blocked by Spring Security | Gateway allows public pass, but `SecurityConfig.java` omits it from `permitAll()`. |
| `GET` | `/sessions` | Authenticated | Lists active session records for the current user. |
| `DELETE`| `/sessions/{id}` | Authenticated | Revokes a specific session in Redis (`session:revoked:<id>`). |
| `POST` | `/invitations` | `@PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")` | Creates team invitation token. |
| `POST` | `/accept-invite` | Public (PermitAll) | Accepts invite token and attaches user to tenant. |
| `POST` | `/switch` | Authenticated | Switches active tenant context and issues new scoped JWT. |
| `GET` | `/captcha` | Public (PermitAll) | Generates visual SVG/base64 captcha challenge. |
| `POST` | `/magic-link` | Public (PermitAll) | Dispatches passwordless magic login email. |
| `POST` | `/verify-magic-token`| Public (PermitAll) | Consumes magic link token and establishes session. |
| `POST` | `/send-whatsapp-otp` | Public (PermitAll) | Dispatches OTP via WhatsApp API. |
| `POST` | `/verify-whatsapp-otp`| Public (PermitAll) | Validates WhatsApp OTP. |
| `GET` | `/test-email` | `@PreAuthorize("hasRole('SUPER_ADMIN')")` | Diagnostic SMTP dispatch endpoint. |

### 1.2 `BillingController` (`/api/v1/auth/billing`)
| Method | Path | Required Role / Authority | Notes |
| :--- | :--- | :--- | :--- |
| `GET` | `/plans` | Public (PermitAll) | Returns platform subscription tiers (`STARTER`, `PRO`, `ENTERPRISE`). |
| `GET` | `/subscription` | `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'STAFF')")` | Tenant subscription metadata. |
| `POST` | `/razorpay/order` | `@PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'SUPER_ADMIN')")` | Creates Razorpay order for subscription upgrade. |
| `POST` | `/razorpay/verify`| `@PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'SUPER_ADMIN')")` | Verifies Razorpay payment signature and activates plan. |
| `POST` | `/razorpay/webhook`| Public (PermitAll) | Razorpay webhook consumer with HMAC-SHA256 signature verification. |
| `POST` | `/superadmin/backups/trigger` | `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEVOPS_ENGINEER')")` | **MOCK**: Injects hardcoded fake 4.85 GB backup into in-memory list. |

### 1.3 `SettingsController`, `TeamController`, `RoleController`, `ApiKeyController`
- `SettingsController`: Scoped to tenant via `TenantContext`. Role checked (`OWNER`, `ADMIN`).
- `TeamController`: Manages team memberships. Verifies that `userId` and `membershipId` belong to the calling tenant.
- `RoleController`: Retrieves granular permissions.
- `ApiKeyController`: Issues and revokes agency API keys.

---

## 2. Multi-Tenancy Enforcement & Data Isolation

### 2.1 Mechanism: Explicit Tenant Scoping via `TenantContext` & Queries
- `auth-service` uses `TenantContext` (backed by a `ThreadLocal<UUID>`), populated by `JwtRequestFilter.java:108` from the cryptographically verified JWT claim `tenantId` (or `X-Tenant-ID` header validated with `X-Gateway-Secret`).
- **Query Scoping**:
  - Repositories (`MembershipRepository`, `SessionRepository`, `WorkspaceSettingsRepository`, etc.) enforce isolation via method parameters:
    `findByTenantId(tenantId)` or `findByUserIdAndTenantId(userId, tenantId)`.
  - **Exempt Global Entities**: `users` and `roles` are global system entities; access to a tenant is strictly gated through `memberships` (`user_id` + `tenant_id` + `role_id`).

### 2.2 IDOR Review
- `TeamController.java`: Endpoints take `membershipId`. The service executes:
  `membershipRepository.findByIdAndTenantId(membershipId, tenantId)` ensuring users cannot delete or alter memberships in foreign tenants.
- `ApiKeyController.java`: Validates that the target key belongs to the caller's `tenantId`.

---

## 3. Security, Authentication & Session Revocation

### 3.1 Password Hashing
- **Implementation**: `SecurityConfig.java:37`:
  ```java
  @Bean
  public PasswordEncoder passwordEncoder() {
      return new BCryptPasswordEncoder(12);
  }
  ```
- **Evaluation**: ✅ Robust work factor (12 rounds).

### 3.2 Token Issuance & Refresh Rotation
- **Access Tokens**: Short-lived (1 hour, configurable via `JWT_EXPIRATION_MS`).
- **Refresh Tokens**:
  - Stored in PostgreSQL `refresh_tokens` table.
  - Stored in client browser as HTTP-only cookie (`ResponseCookie.from("refreshToken", ...).httpOnly(true).secure(secure)`).
  - Rotated on every use in `AuthService.java:430`: old refresh token is revoked immediately, and a replacement is issued.

### 3.3 Redis Revocation Plane
- Logout: Pushes JWT hash to `blacklist:<token>` with TTL equal to remaining token life.
- Global Logout / Password Reset: Writes timestamp to `user:revoked_before:<userId>`. Any token issued prior to this timestamp is rejected by Gateway.

---

## 4. Messaging & Message Broker (RabbitMQ)

- **Configuration**: `MessagingConfig.java`
- **Exchange**: `eventos.exchange` (TopicExchange)
- **Queues & Routing**:
  - `auth.audit.queue` bound to `eventos.exchange` with `auth.audit.#`
  - Dead Letter Queue: `auth.audit.dlq` with DLQ routing key `auth.audit.dlq`
  - `auth.booking.created.queue` bound with `booking.created`
- **Consumers**:
  - `AuditLogConsumer.java`: Receives async audit log events and persists them to `audit_logs` table.
  - `BookingCreatedConsumer.java`: Listens for `booking.created` events to track usage metrics and dispatch agency owner alerts.

---

## 5. Real-Time Collaboration & WebSockets (STOMP)

- **Configuration**: `WebSocketConfig.java`
- **Broker**: Simple in-memory broker (`/topic`, `/queue`). Application prefix: `/app`.
- **Handshake Authentication**:
  - Interceptor extracts native header `Authorization`.
  - Validates JWT signature.
  - **CRITICAL FLAW (Line 64)**:
    ```java
    if (!token.isEmpty() && !"guest-token".equalsIgnoreCase(token)) {
        if (!jwtService.validateToken(token)) {
            throw new AccessDeniedException("Invalid or expired JWT token");
        }
    ```
    Supplying `Authorization: Bearer guest-token` bypasses JWT verification completely!
  - **MISSING AUTH REJECTION**: If the client sends NO `Authorization` header, the condition `if (authorization != null)` is skipped, allowing completely unauthenticated WebSocket connections to connect and subscribe to `/topic/*`!

---

## 6. Findings & Vulnerabilities for `auth-service`

### Finding AUTH-1: [CRITICAL] Hardcoded Token Bypass in WebSocket Interceptor
- **Location**: `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\config\WebSocketConfig.java:64-67`
- **Evidence**:
  ```java
  if (!token.isEmpty() && !"guest-token".equalsIgnoreCase(token)) {
      if (!jwtService.validateToken(token)) {
          log.warn("[STOMP WS] Rejecting connection: Invalid or expired JWT token");
          throw new AccessDeniedException("Invalid or expired JWT token for WebSocket connection");
      }
  ```
- **Impact**: Any external user can supply `Authorization: guest-token` and establish a live STOMP connection without valid credentials. Furthermore, omitting the Authorization header entirely allows unauthenticated connection because there is no `else { throw AccessDeniedException }`.
- **Fix**: Require strict JWT token validation. Remove `!"guest-token".equalsIgnoreCase(token)` check. Reject the handshake immediately if `authorization` header is null or invalid.

---

### Finding AUTH-2: [HIGH] Mock Database Backup Trigger in Superadmin API
- **Location**: `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\controller\BillingController.java:953-971`
- **Evidence**:
  ```java
  @PostMapping("/superadmin/backups/trigger")
  @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEVOPS_ENGINEER') or hasAuthority('admin:all')")
  public ResponseEntity<?> triggerBackup() {
      String newId = "bak-" + System.currentTimeMillis();
      String name = "EventOS_Manual_Snapshot_" + ...;
      Map<String, Object> newBackup = new HashMap<>();
      newBackup.put("id", newId);
      newBackup.put("name", name);
      newBackup.put("size", "4.85 GB");
      newBackup.put("status", "SUCCESS");
      newBackup.put("created", "Just now (" + ... + ")");
      dynamicBackups.add(0, newBackup);
      return ResponseEntity.ok(...);
  }
  ```
- **Impact**: The UI displays "Database snapshot completed successfully" with a fake 4.85 GB backup file, but NO real database backup is triggered or stored. Administrators are misled into believing disaster recovery snapshots exist.
- **Fix**: Integrate with an actual PostgreSQL `pg_dump` pipeline / AWS S3 backup task, or disable the endpoint until a real backup worker is implemented.

---

### Finding AUTH-3: [MEDIUM] Spring Security Blocks Unauthenticated Admin Bootstrap Endpoint
- **Location**: `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\config\SecurityConfig.java:69-99`
- **Evidence**:
  - `AuthController.java:561` exposes `@PostMapping("/bootstrap/superadmin")`.
  - `SecurityConfig.java:69-99` omits `/bootstrap/superadmin` from `permitAll()`.
  - Gateway's `JwtAuthFilter.java:63` marks `/api/v1/auth/bootstrap` as public.
- **Impact**: If an operator attempts to run initial administrative bootstrap on a clean deployment, Spring Security rejects the unauthenticated request with `401 Unauthorized` before the bootstrap secret can be evaluated.
- **Fix**: Add `/bootstrap/**` to `requestMatchers(...).permitAll()` in `SecurityConfig.java`.

---

## 7. Files Reviewed in this Section

1. `d:\EventOs\backend\auth-service\src\main\resources\application.yml`
2. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\config\SecurityConfig.java`
3. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\config\JwtRequestFilter.java`
4. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\config\WebSocketConfig.java`
5. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\config\MessagingConfig.java`
6. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\config\TenantContext.java`
7. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\config\UserPrincipal.java`
8. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\controller\AuthController.java`
9. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\controller\BillingController.java`
10. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\controller\GlobalExceptionHandler.java`
11. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\service\AuthService.java`
12. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\service\BillingService.java`
13. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\consumer\AuditLogConsumer.java`
14. `d:\EventOs\backend\auth-service\src\main\java\com\eventos\auth\consumer\BookingCreatedConsumer.java`
