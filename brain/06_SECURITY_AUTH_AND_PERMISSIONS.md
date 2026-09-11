# 🔒 Security, Authentication & Role-Based Access Control (RBAC)

> **Deep dive into EventOS authentication tokens, asymmetric cryptographic keys, tenant boundaries, and permissions enforcement.**

---

## 1. Authentication Architecture & Token Lifecycle

EventOS implements a stateless, asymmetric JWT-based authentication system:

```
[ Client ] ──(POST /login)──► [ auth-service ]
                                      │
                       1. Validate BCrypt Password
                       2. Load Roles & Workspace Claims
                       3. Sign Access JWT with RSA Private Key
                       4. Store Refresh Token in Redis
                                      │
[ Client ] ◄──(Access Token + Refresh Token)──┘
    │
    ├── (Authorization: Bearer <JWT>) ──► [ api-gateway ]
                                                │
                                  1. Verify with Public Key
                                  2. Extract Claims:
                                     - userId
                                     - tenantId
                                     - roles
                                  3. Inject Downstream Headers:
                                     - X-User-Id
                                     - X-Tenant-Id
                                     - X-User-Roles
                                                │
                                                ▼
                                    [ Downstream Microservice ]
```

### 1.1 Token Expiration Times
* **Access Token**: `3600000 ms` (1 Hour)
* **Refresh Token**: `604800000 ms` (7 Days, stored in Redis with revocation capability)

### 1.2 Asymmetric Cryptography (RSA256)
* **`jwt_private.pem`**: Used solely by `auth-service` to sign access tokens.
* **`jwt_public.pem`**: Distributed to `api-gateway` and other services to verify token signatures without possessing the signing key.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Feature / Resource | `ROLE_SUPERADMIN` | `ROLE_OWNER` | `ROLE_ADMIN` | `ROLE_STAFF` | `ROLE_VENDOR` | `ROLE_CLIENT` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Platform Monitoring (`/superadmin`)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Tenant Billing & Subscriptions** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Workspace & Team Management** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Leads & Pipeline Management** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Proposal Creation & Editing** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Event Timeline & Cue Sheets** | ✅ | ✅ | ✅ | ✅ | Read Only | ❌ |
| **Invoice & Payment Recording** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Photo Upload & Watermarking** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Client Portal Access (`/portal`)** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Vendor Itinerary Access** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 3. Defense-in-Depth Security Measures

1. **Strict Multi-Tenant Boundary Checks**:
   * Downstream services inspect `TenantContext.getCurrentTenantId()`.
   * Cross-tenant query execution is blocked at the ORM repository layer.
2. **Password Hashing**:
   * Passwords are salted and hashed using `BCrypt` with a cost factor of 12. Plaintext passwords are never logged or stored.
3. **Bot & Spam Protection**:
   * Google reCAPTCHA integrated on registration and public proposal signing forms (`RECAPTCHA_ENABLED=true`).
4. **Internal Microservice Trust (`GATEWAY_TRUST_SECRET`)**:
   * Microservices reject direct HTTP calls unless the header `X-Gateway-Secret` matches `app.gateway.secret`.
5. **CORS Policy**:
   * Whitelist-only origin policy supporting `localhost:3000`, staging domains, and the production domain (`eventosapp.in`).
