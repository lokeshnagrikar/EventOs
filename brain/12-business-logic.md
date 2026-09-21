# EventOS — Business Logic

## Multi-Tenancy

**FACT:**
- Every workspace (agency) is a **Tenant** with a unique UUID
- All data is scoped by `tenantId` — no tenant can see another's data
- `AbstractTenantAwareEntity` provides tenantId field in event-service and crm-service
- `X-Tenant-ID` header sent with every authenticated API request
- `TenantContext` (ThreadLocal) holds current tenant for service-layer scoping
- Default tenant ID (pre-workspace): `00000000-0000-0000-0000-000000000000`

## Sequential Numbering

**FACT:**
- **Quote numbers:** `QT-XXXX-v1` (per tenant, with revision support)
- **Booking numbers:** Unique per tenant (via `TenantSequence`)
- **Invoice numbers:** `INV-YYYY-XXXXXX` (uses pessimistic write lock for concurrency safety)
- `TenantSequence` entity tracks per-tenant, per-type counters

Source: `crm-service/.../service/QuoteService.java`, `event-service/.../service/InvoiceService.java`

## Quote → Booking Conversion

**FACT:**
- Quote accepted → status set to APPROVED → `approvedAt` timestamp set
- RabbitMQ event published to `event.booking.queue`
- `QuoteAcceptedConsumer` in event-service creates Booking with:
  - Lead data (client name, email, phone, event type)
  - Quote reference (quoteId, totalAmount)
  - Status: INQUIRY
  - Auto-generated booking number

Source: `crm-service/.../service/QuoteService.java`, `event-service/.../consumer/QuoteAcceptedConsumer.java`

## Budget Calculator → Lead Conversion

**FACT:**
- Public budget calculator generates `BudgetEstimate` with category allocations
- Estimate can be converted to CRM lead via RabbitMQ (`crm.lead.queue`)
- `BudgetConvertedToLeadConsumer` creates Lead in crm_db

Source: `event-service/.../controller/BudgetCalculatorController.java`, `crm-service/.../consumer/BudgetConvertedToLeadConsumer.java`

## Payment → Gallery Access

**FACT:**
- When payment is recorded, event published to `payment.recorded.queue`
- `PaymentRecordedConsumer` in gallery-service updates gallery access

Source: `gallery-service/.../consumer/PaymentRecordedConsumer.java`

## Plan Limit Enforcement

**FACT:**
- `TenantUsage` tracks current usage metrics per billing period
- `Plan` defines maximum limits per metric
- Frontend `billingStore.checkLimit()` compares usage vs plan limits before create operations
- Backend returns 402 (Payment Required) with `LIMIT_EXCEEDED` error code when limits breached
- Frontend intercepts 402 → opens `LimitExceededModal` with upgrade prompt

Source: `web/src/store/billingStore.ts`, `web/src/lib/api-client.ts` (402 interceptor)

## Optimistic Concurrency

**FACT:**
- `Booking` entity has `@Version` field for optimistic locking
- `Quote` entity has `@Version` field
- Prevents concurrent modification conflicts

## Audit Logging

**FACT:**
- Entity listeners (`AuditLogListener`) on Event, Booking, Lead, Quote entities
- Audit events published to RabbitMQ → consumed by `AuditLogConsumer` in auth-service
- `AuditLog` entities in both auth_db and event_db/crm_db
- Controller-level audit logs via `AuditLogController` and `AuditLogService`

Source: `event-service/.../config/AuditLogListener.java`, `auth-service/.../consumer/AuditLogConsumer.java`

## Token Refresh Strategy

**FACT:**
- Access token expires in ~15 minutes
- On 401 response, frontend attempts token refresh
- Concurrent requests queued during refresh (failedQueue pattern)
- Refresh token can be sent as body param or HttpOnly cookie
- On refresh failure with expired token → clear auth + redirect to login
- On refresh failure with valid token → keep session alive (graceful degradation)

Source: `web/src/lib/api-client.ts`

## Company Branding

**FACT:**
- Each workspace has a `Company` profile with extensive branding fields:
  - Visual: logoUrl, coverUrl, faviconUrl, primaryColor, secondaryColor, accentColor, gradientPresets, fontSelection, darkThemeLogo
  - Communication: emailBranding, invoiceBranding, pdfBranding, whatsappConfig
  - Business: gstNumber, registrationNumber, panNumber, businessHours, dateFormat, language

Source: `auth-service/.../entity/Company.java`

## Rate Limiting

**FACT:**
- Redis-backed rate limiting at API Gateway level
- Per-endpoint limits:
  - Login: 10 req/min
  - Register: 5 req/min
  - Password reset: 5 req/min
  - OTP: 5 req/min
  - Magic link: 5 req/min
  - Token refresh: 60 req/min
  - Default: 120 req/min
  - Superadmin mutations: 10 req/min
  - Superadmin reads: 30 req/min
- Also: `RateLimiterService` in auth-service for application-level throttling

Source: `api-gateway/.../resources/application.yml`, `auth-service/.../service/RateLimiterService.java`
