# EventOS — Authentication & Authorization

## Authentication Mechanism

**FACT:**

### JWT Token System
- **Library:** JJWT 0.12.5 (backend), jose (frontend middleware verification)
- **Access Token:** Short-lived (~15 minutes, configurable via `JWT_EXPIRATION_MS=900000`)
- **Refresh Token:** Long-lived (~7 days, configurable via `JWT_REFRESH_EXPIRATION_MS=604800000`)
- **Signing:** HMAC-SHA with shared secret (`JWT_SECRET_KEY` env var, shared across all services)
- **Token contents:** userId, email, roles, tenantId, permissions

Source: `backend/auth-service/.../service/JwtService.java`, `backend/auth-service/.../config/JwtRequestFilter.java`

### Login Flows

**FACT:**

| Method | Endpoint | Description |
|---|---|---|
| Email/Password | `POST /auth/login` | Standard login with BCrypt(12) password verification |
| Google OAuth | `POST /auth/login/google` | Google ID token verification via `GoogleAuthService` |
| Magic Link | `POST /auth/magic-link` → `POST /auth/verify-magic-token` | Passwordless email link |
| WhatsApp OTP | `POST /auth/send-whatsapp-otp` → `POST /auth/verify-whatsapp-otp` | WhatsApp-based OTP |
| 2FA (TOTP) | `POST /auth/2fa/verify` | Time-based one-time password after initial login |

### Registration Flow
1. `POST /auth/register` with firstName, lastName, email, password
2. Email verification sent (`emailVerificationToken`)
3. `POST /auth/verify-email` with token
4. Account activated

### Token Refresh Flow
1. Frontend interceptor detects 401 response
2. Sends `POST /auth/refresh` with refresh token (body or HttpOnly cookie)
3. New access + refresh tokens returned
4. Failed requests are queued and replayed with new token
5. Concurrent refresh prevented (single `isRefreshing` lock)

Source: `web/src/lib/api-client.ts` (interceptor logic)

### Workspace Switching
- `POST /auth/switch` with target tenantId
- Returns new access token scoped to selected workspace
- Frontend updates `activeTenantId` and all storage

### Logout
1. `POST /auth/logout` (server-side session cleanup)
2. Client clears all storage (sessionStorage, localStorage, cookies)

Source: `web/src/store/authStore.ts` (logout method)

## Password Security

**FACT:**
- **Hashing:** BCrypt with strength 12 (`BCryptPasswordEncoder(12)`)
- **Password history:** Tracked via `PasswordHistory` entity (prevents reuse)
- **Account lockout:** `failedLoginAttempts` counter + `lockedUntil` timestamp
- **Password reset:** Token-based via email (`forgotPassword` → `resetPassword`)
- **Password age tracking:** `passwordUpdatedAt` field on User entity

Source: `backend/auth-service/.../config/SecurityConfig.java`, `backend/auth-service/.../entity/User.java`

## Authorization Model

### Multi-Tenant Isolation

**FACT:**
- Every API request includes `X-Tenant-ID` header
- Backend services scope all queries to the tenant context
- `AbstractTenantAwareEntity` base class provides `tenantId` field to event-service and crm-service entities
- `TenantContext` (ThreadLocal) stores current tenant in request scope

Source: `backend/event-service/.../entity/AbstractTenantAwareEntity.java`, `backend/auth-service/.../config/TenantContext.java`

### Role System

**FACT:**
Three role levels exist:

#### 1. Platform Roles (Superadmin)
Defined in `PlatformRole.java` and middleware `PLATFORM_ROLES` set:
- SUPER_ADMIN, PLATFORM_SUPER_ADMIN, SUPERADMIN
- PLATFORM_ADMIN
- OPERATIONS_LEAD, OPERATIONS, OPERATIONS_MANAGER, OPS
- SUPPORT_LEAD, SUPPORT_AGENT, SUPPORT, SUPPORT_ADMIN, TECH_SUPPORT, CUSTOMER_SUPPORT
- FINANCE_OFFICER, FINANCE_ADMIN, FINANCE
- DEVOPS_ENGINEER, DEVOPS, DEVELOPER
- COMPLIANCE_AUDITOR, AUDITOR, COMPLIANCE

#### 2. Workspace Roles (Agency Staff)
Custom roles per workspace via `Role` entity with granular permissions.

#### 3. Client Role
- `CLIENT` — Restricted to `/portal/*` routes only

### Route Protection

**FACT (from `web/src/middleware.ts`):**

| Route Group | Protection |
|---|---|
| `/superadmin/*` | Cryptographic JWT verification + platform role check |
| `/dashboard`, `/crm`, `/events`, etc. | `hasSession` or `accessToken` cookie required |
| `/portal/*` | Session required + CLIENT role enforcement |
| `/login`, `/register` | Redirect authenticated users to appropriate area |

### Role-Based Redirects
- **CLIENT** → always to `/portal`
- **Platform roles** → always to `/superadmin`
- **Agency staff** → to `/dashboard` or `/workspace-select`

### API-Level Security

**FACT:**
- `JwtRequestFilter` in auth-service validates JWT and sets SecurityContext
- `JwtAuthFilter` in api-gateway validates JWT before routing to services
- `@EnableMethodSecurity` enables `@PreAuthorize` annotations on controllers
- Session management: `STATELESS` (no server-side session)
- CSRF: Disabled (JWT-based auth)
- CORS: Configurable allowed origins

### Security Hardening

**FACT:**
- `XssRequestSanitizerFilter` — XSS input sanitization
- `ProductionSecurityValidator` — Validates security configuration in production
- `RateLimiterService` — Per-endpoint rate limiting (login: 10/min, register: 5/min, etc.)
- `AttributeEncryptor` — Field-level encryption for sensitive data
- `BlacklistedIp` — IP blocking capability
- Security headers: `X-Frame-Options: DENY`, HSTS, CSP
- `RecaptchaService` — Google reCAPTCHA verification

Source: `backend/auth-service/.../config/`, `backend/api-gateway/.../config/`

## Frontend Session Management

**FACT:**
- Access token stored in: sessionStorage, localStorage (`eventos_access_token`)
- Refresh token stored in: sessionStorage, localStorage (`eventos_refresh_token`)
- User profile: sessionStorage + localStorage (`eventos_user_profile`)
- Cookies set for SSR middleware: `hasSession` (7 days), `accessToken` (1 hour), `user_role` (7 days)
- Token expiry check: Client-side JWT decode with 10-second safety buffer
- `SessionTimeoutHandler` component — Monitors idle time
- `useIdleTimer` hook — Tracks user activity

Source: `web/src/store/authStore.ts`, `web/src/hooks/useIdleTimer.ts`
