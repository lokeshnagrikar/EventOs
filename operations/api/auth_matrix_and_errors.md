# EventOS Role-Permission Matrix & Error Response Catalog

This document registers the endpoint security permissions and standardized error response models across the EventOS platform.

---

## 1. Role-Permission Access Matrix

Our system enforces method-level `@PreAuthorize` backend RBAC constraints combined with strict tenant isolation cross-checks.

| Endpoint Pattern | Http Method | Permitted Security Roles | Description | Tenant Context Filter |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | `POST` | Anonymous | Authenticates session and sets cookies | None (Global) |
| `/api/v1/auth/register` | `POST` | Anonymous | Provisions new Tenant + Admin user | None (Global) |
| `/api/v1/crm/leads/**` | `GET` | `OWNER`, `ADMIN`, `MANAGER`, `STAFF` | Retrieve leads list and profiles | Strict JWT `tenantId` |
| `/api/v1/crm/leads` | `POST` | `OWNER`, `ADMIN`, `MANAGER` | Create or convert prospect leads | Strict JWT `tenantId` |
| `/api/v1/crm/quotes/**` | `GET` | `OWNER`, `ADMIN`, `MANAGER`, `STAFF`, `CLIENT` | Access quote proposals. Clients limited to own. | Strict JWT `tenantId` + Owner check |
| `/api/v1/crm/quotes` | `POST`/`PUT` | `OWNER`, `ADMIN`, `MANAGER` | Generate or edit price estimate proposals | Strict JWT `tenantId` |
| `/api/v1/crm/quotes/{id}/approve`| `POST` | `OWNER`, `ADMIN`, `MANAGER`, `CLIENT` | Approve proposal, triggering auto-booking | Strict JWT `tenantId` + Client ownership check |
| `/api/v1/events/bookings/**` | `GET` | `OWNER`, `ADMIN`, `MANAGER`, `STAFF`, `CLIENT` | Read bookings/timeline. Staff/Clients limited to assigned. | Strict JWT `tenantId` + Assignment check |
| `/api/v1/events/bookings` | `POST` | `OWNER`, `ADMIN`, `MANAGER` | Manually provision client bookings | Strict JWT `tenantId` |
| `/api/v1/events/invoices/**` | `GET` | `OWNER`, `ADMIN`, `MANAGER`, `STAFF`, `CLIENT` | View invoices. Staff/Clients limited to assigned. | Strict JWT `tenantId` + Assignment check |
| `/api/v1/events/invoices` | `POST`/`PUT` | `OWNER`, `ADMIN`, `MANAGER` | Create or update invoice items | Strict JWT `tenantId` |
| `/api/v1/events/payments/**` | `GET` | `OWNER`, `ADMIN`, `MANAGER`, `STAFF` | Inspect transactional ledgers | Strict JWT `tenantId` |
| `/api/v1/events/payments` | `POST`/`DELETE`| `OWNER`, `ADMIN`, `MANAGER` | Collect payments or void ledger transactions | Strict JWT `tenantId` |
| `/api/v1/gallery/albums/**` | `GET` | `OWNER`, `ADMIN`, `MANAGER`, `STAFF`, `CLIENT` | View albums. Clients limited to assigned. | Strict JWT `tenantId` + Event cross-check |
| `/api/v1/gallery/albums` | `POST`/`DELETE`| `OWNER`, `ADMIN`, `MANAGER` | Create albums or trigger async cleanups | Strict JWT `tenantId` |
| `/api/v1/gallery/upload` | `POST` | `OWNER`, `ADMIN`, `MANAGER`, `STAFF` | Upload images/videos to Cloudinary | Strict JWT `tenantId` |
| `/api/v1/gallery/share` | `POST`/`DELETE`| `OWNER`, `ADMIN`, `MANAGER`, `STAFF` | Create or revoke sharing links | Strict JWT `tenantId` |

---

## 2. Standardized Error Response Catalog

All microservices catch controller-level exceptions and return a structured JSON response body matching this schema:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description explaining the error condition.",
    "details": {}
  }
}
```

### Registered Error Codes:

#### 1. `BAD_REQUEST` (HTTP 400)
- **Condition**: Input validation constraints failed (e.g. missing fields, bad email format, or discount exceeds allowed total limits).
- **Client Action**: Repair the payload and retry.

#### 2. `UNAUTHORIZED` (HTTP 401)
- **Condition**: Access Token is missing, expired, or cryptographically invalid.
- **Client Action**: Redirect user to `/login` to acquire a fresh JWT cookie.

#### 3. `FORBIDDEN` (HTTP 403)
- **Condition**: User is authenticated, but their assigned roles or context properties do not grant access to the requested object (e.g. Client trying to read another client's invoice).
- **Client Action**: Block access in the UI and log a security audit event.

#### 4. `NOT_FOUND` (HTTP 404)
- **Condition**: The requested database record (Lead, Quote, Booking, Album, or Payment) does not exist, or does not belong to the caller's tenant.
- **Client Action**: Report resource absence to user.

#### 5. `CONFLICT` (HTTP 409)
- **Condition**: Optimistic locking conflict (e.g. concurrent edits to the same budget estimate plan) or database unique constraint violation (e.g. duplicate invoice number under the same tenant ID).
- **Client Action**: Refresh target object state and retry.

#### 6. `TOO_MANY_REQUESTS` (HTTP 429)
- **Condition**: Triggered when a caller exceeds the Bucket4j rate limiting bucket threshold (e.g. brute force request flooding on `/calculator` saves).
- **Client Action**: Pause queries and backoff.

#### 7. `INTERNAL_SERVER_ERROR` (HTTP 500)
- **Condition**: Unhandled backend exception (e.g. Cloudinary upload network timeout, RabbitMQ broker disconnection).
- **Client Action**: Display error dialog and prompt user to contact support.
