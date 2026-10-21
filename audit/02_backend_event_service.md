# EventOS Audit Report: Backend - Event Service (`event-service`)

**Audit Date:** 2026-10-20  
**Service:** `event-service`  
**Port:** `8083`  
**Database:** `eventos_events`  
**Auditor:** Senior Staff Engineer & Security Auditor  

---

## 1. Service Overview & Architecture

`event-service` is the core operational engine of EventOS. It manages the full lifecycle of bookings, events, multi-day run-of-show timeline schedules, resource/crew allocations, budget calculation, invoices, payments, vendor contracts, client portal views, and tenant tax configurations.

### Tech Stack
- **Framework:** Spring Boot 3.4.3 / Java 21
- **Persistence:** Spring Data JPA / Hibernate, PostgreSQL 17, Flyway (27 migrations: `V1` to `V27`)
- **Messaging:** RabbitMQ (AMQP) for listening to `quote.accepted` events from `crm-service` and publishing event status updates.
- **Cache:** Redis for caching event dashboards and analytics.

---

## 2. Endpoints & Authorization Matrix

| Method | Path | Required Role / Annotation | DTO Validation | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/bookings` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')` | None | Lists bookings for current tenant |
| `GET` | `/bookings/{id}` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')` | None | Fetches booking by ID with assignment/client checks |
| `POST` | `/bookings` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | `@Valid CreateBookingDto` | Creates a new booking directly |
| `POST` | `/bookings/from-quote/{quoteId}` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | None | Converts CRM quote into booking |
| `GET` | `/bookings/by-quote/{quoteId}` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF','CLIENT')` | None | Fetches booking linked to quote ID |
| `PATCH` | `/bookings/{id}/status` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | Manual enum validation | Transitions booking lifecycle status |
| `PATCH` | `/bookings/{id}/payment` | `hasAnyRole('OWNER','ADMIN')` | Manual `BigDecimal` parse | Updates cumulative paid amount |
| `POST` | `/bookings/{id}/timeline` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | `@Valid CreateBookingTimelineEventDto` | Adds milestone to booking |
| `PATCH` | `/bookings/{id}/timeline/{milestoneId}/toggle` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | None | Toggles milestone completion |
| `GET` | `/bookings/{id}/resources` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | None | Lists assigned resources |
| `POST` | `/bookings/{id}/resources` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | `@Valid CreateBookingAssignmentDto` | Assigns crew/vendor |
| `DELETE` | `/bookings/{id}/resources/{resourceId}` | `hasAnyRole('OWNER','ADMIN')` | None | Removes resource assignment |
| `GET` | `/bookings/{id}/audit` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | None | Lists immutable booking audit trail |
| `GET` | `/bookings/{bookingId}/budget` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | None | Fetches booking financial breakdown |
| `GET` | `/events` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | None | Lists events |
| `GET` | `/events/{id}` | `hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')` | None | Detailed event schedule & stages |
| `POST` | `/events` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | `@Valid CreateEventDto` | Creates event |
| `PUT` | `/events/{id}` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | `@Valid CreateEventDto` | Updates event details |
| `DELETE` | `/events/{id}` | `hasAnyRole('OWNER','ADMIN')` | None | Deletes event |
| `POST` | `/events/{id}/stages` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | `@Valid CreateStageDto` | Adds run-of-show stage |
| `POST` | `/events/{id}/stages/{stageId}/cues`| `hasAnyRole('OWNER','ADMIN','MANAGER')` | `@Valid CreateCueDto` | Adds stage cue |
| `GET` | `/invoices` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | None | Lists tenant invoices |
| `GET` | `/invoices/{id}` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | None | Fetches invoice by ID |
| `POST` | `/invoices` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | `@Valid CreateInvoiceDto` | Generates invoice |
| `PATCH` | `/invoices/{id}/status` | `hasAnyRole('OWNER','ADMIN','MANAGER')` | Status validation | Updates invoice status (SENT, PAID, VOID) |
| `GET` | `/tax/settings` | `hasAnyRole('OWNER','ADMIN')` | None | Fetches tenant GST rate and GSTIN |
| `PUT` | `/tax/settings` | `hasAnyRole('OWNER','ADMIN')` | `@Valid TaxSettingsDto` | Updates tenant GST configuration |
| `GET` | `/client/dashboard` | `hasRole('CLIENT')` | None | Client portal summary |
| `GET` | `/client/bookings` | `hasRole('CLIENT')` | None | Client portal bookings |
| `GET` | `/client/invoices` | `hasRole('CLIENT')` | None | Client portal invoices |
| `GET` | `/client/payments` | `hasRole('CLIENT')` | None | Client portal payment history |
| `GET` | `/audit-logs` | `hasAnyRole('OWNER','ADMIN')` | None | Paginated tenant general audit logs |
| `POST` | `/audit-logs/retention` | `hasAnyRole('OWNER','ADMIN')` | Body validation | Purges audit logs older than N days |

---

## 3. Deep Dive Findings

### Finding 1: Lack of Idempotency Key in Payment Collection Leading to Duplicate Increments
- **Severity:** [HIGH]
- **Location:** `d:\EventOs\backend\event-service\src\main\java\com\eventos\event\controller\BookingController.java:163-186` & `service\BookingService.java:310-335`
- **Evidence:**
```java
@PatchMapping("/{id}/payment")
@PreAuthorize("hasAnyRole('OWNER','ADMIN')")
public ResponseEntity<?> updatePayment(@PathVariable UUID id, @RequestBody Map<String, String> request) {
    ...
    BigDecimal amount = new BigDecimal(amountStr);
    UUID tenantId = getTenantId();
    Booking booking = bookingService.updatePaidAmount(id, amount, tenantId);
```
In `BookingService.java`:
```java
@Transactional
public Booking updatePaidAmount(UUID id, BigDecimal paidAmount, UUID tenantId) {
    Booking booking = bookingRepository.findByIdAndTenantIdForUpdate(id, tenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    booking.setPaidAmount(paidAmount);
    if (paidAmount.compareTo(booking.getTotalAmount()) >= 0) {
        booking.setStatus(BookingStatus.CONFIRMED);
    }
    ...
}
```
- **Impact:** Although `updatePaidAmount` treats `amount` as the cumulative total, in the frontend installment collection dialog, double-clicking "Record Payment" or network retries without an `Idempotency-Key` or payment transaction reference can lead to duplicate payment log records and inconsistent client receipts.
- **Fix:** Require an `Idempotency-Key` header or pass a unique `paymentReferenceId` with each installment recording, storing individual installment records in a dedicated `payments` table with unique constraint on `(tenant_id, payment_reference_id)`.

---

### Finding 2: General Audit Log Retention Allows Deletion of Security Logs
- **Severity:** [MEDIUM]
- **Location:** `d:\EventOs\backend\event-service\src\main\java\com\eventos\event\controller\AuditLogController.java:69-80`
- **Evidence:**
```java
@PostMapping("/retention")
@PreAuthorize("hasAnyRole('OWNER','ADMIN')")
public ResponseEntity<?> enforceRetention(@RequestBody Map<String, Integer> payload) {
    UUID tenantId = getTenantId();
    Integer days = payload.get("retentionDays");
    if (days == null || days <= 0) {
        return ResponseEntity.badRequest().body(Map.of("error", "Valid retentionDays parameter is required"));
    }
    auditLogService.deleteAuditLogsOlderThan(days, tenantId);
    return ResponseEntity.ok(Map.of("success", true, "message", "Retention policy applied. Purged logs older than " + days + " days."));
}
```
- **Impact:** While `booking_audit_logs` is append-only, the general `audit_logs` table provides an active HTTP endpoint allowing an `ADMIN` or `OWNER` to purge records. A compromised admin account can submit `retentionDays: 1` to immediately wipe their own malicious activity logs.
- **Fix:** Disallow ad-hoc manual deletion via REST endpoints. Audit log retention should only be enforced via automated database-level retention policies or background cron jobs with a hard minimum (e.g. at least 90 or 365 days).

---

### Finding 3: Tax Engine Supports Configurable Rate but Lacks Indian Split CGST/SGST/IGST and HSN/SAC Codes
- **Severity:** [MEDIUM]
- **Location:** `d:\EventOs\backend\event-service\src\main\java\com\eventos\event\entity\TaxSettings.java:23-38`
- **Evidence:**
```java
@Column(name = "gst_rate", nullable = false, precision = 5, scale = 2)
private BigDecimal gstRate = new BigDecimal("18.00");

@Column(name = "gstin", length = 15)
private String gstin;

@Column(name = "is_composition_scheme")
private Boolean isCompositionScheme = false;
```
- **Impact:** In Indian event management and photography contracts, inter-state transactions require IGST (18%), whereas intra-state transactions mandate CGST (9%) + SGST (9%). Furthermore, SAC codes (e.g., 9983 for event photography, 9985 for event organization) must appear on tax invoices for GST compliance. The current schema stores only a flat `gstRate` without interstate tax logic or SAC breakdown.
- **Fix:** Expand `TaxSettings` and `Invoice` line items to compute `cgstRate`, `sgstRate`, and `igstRate` based on client state vs tenant state of supply, and store SAC codes per service line item.

---

### Finding 4: In-Memory WebClient Call Inside Proposal-to-Booking Flow Without Distributed Transaction / Outbox Pattern
- **Severity:** [HIGH]
- **Location:** `d:\EventOs\backend\event-service\src\main\java\com\eventos\event\service\BookingService.java:108,157-165`
- **Evidence:**
```java
// BookingService.java
this.webClient = WebClient.builder().build();
...
String authHeader = getRequestingUserAuthHeader();
// Calls CRM service synchronously to verify quote details
```
In `createBookingFromQuote(UUID quoteId, UUID tenantId)`:
```java
// Fetches quote via synchronous HTTP WebClient/RestTemplate
// If CRM service is restarting or unavailable, booking creation fails synchronously
```
- **Impact:** If `crm-service` experiences network timeouts or is during a zero-downtime deployment rolling restart, quote conversion fails. Although RabbitMQ `QuoteAcceptedConsumer.java` exists to consume asynchronous acceptance events, the manual UI conversion button calls the synchronous endpoint.
- **Fix:** Standardize quote-to-booking transitions onto the asynchronous RabbitMQ message bus with an outbox pattern in `crm-service`, and make the HTTP conversion endpoint poll or await event completion.

---

## 4. Multi-Tenancy & Data Isolation Audit

### Tenant ID Enforcement
`BookingController`, `EventController`, `InvoiceController`, `TaxController`, and `AuditLogController` extract `tenantId` strictly from the validated `UserPrincipal` in Spring Security Context:
```java
private UUID getTenantId() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
        UUID tenantId = principal.getTenantId();
        if (tenantId != null) return tenantId;
    }
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context is missing");
}
```
No header fallback is allowed in production controllers.

### Repository Query Check
All primary repositories (`BookingRepository`, `EventRepository`, `InvoiceRepository`, `TaxSettingsRepository`) enforce `tenantId` in their query methods:
- `bookingRepository.findByIdAndTenantId(id, tenantId)`
- `eventRepository.findByIdAndTenantId(id, tenantId)`
- `invoiceRepository.findAllByTenantId(tenantId)`
- `bookingAuditLogRepository.findAllByBookingIdOrderByCreatedAtDesc(bookingId)` (the parent booking is verified for `tenantId` access before querying logs in `BookingService.java:760`).

---

## 5. Concurrency & Locking
- `Booking.java` includes `@Version private Long version;` for optimistic locking on booking state changes.
- `updatePaidAmount()` explicitly executes a pessimistic write lock:
  ```java
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT b FROM Booking b WHERE b.id = :id AND b.tenantId = :tenantId")
  Optional<Booking> findByIdAndTenantIdForUpdate(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
  ```
  This prevents concurrent balance corruptions when two payment webhooks arrive simultaneously.

---

## 6. Audit Trail Immutability Check (`booking_audit_logs`)
- **Table:** `booking_audit_logs`
- **Entity:** `BookingAuditLog.java`
- **Repository:** `BookingAuditLogRepository.java` defines only `save()` and `findAllByBookingIdOrderByCreatedAtDesc()`.
- **Controller:** Exposes only `GET /bookings/{id}/audit`. There is **no** `PUT`, `PATCH`, or `DELETE` endpoint for `BookingAuditLog`.
- **Transaction:** `logAudit()` is invoked directly inside the `@Transactional` boundary of `BookingService` methods (`updateBookingStatus`, `updatePaidAmount`, `addTimelineEvent`). If the business operation fails and rolls back, the audit entry also rolls back cleanly.

---

## 7. Files Reviewed in this Phase
1. `backend/event-service/src/main/java/com/eventos/event/controller/BookingController.java`
2. `backend/event-service/src/main/java/com/eventos/event/controller/AuditLogController.java`
3. `backend/event-service/src/main/java/com/eventos/event/controller/TaxController.java`
4. `backend/event-service/src/main/java/com/eventos/event/controller/InvoiceController.java`
5. `backend/event-service/src/main/java/com/eventos/event/controller/ClientPortalController.java`
6. `backend/event-service/src/main/java/com/eventos/event/controller/EventController.java`
7. `backend/event-service/src/main/java/com/eventos/event/controller/PaymentController.java`
8. `backend/event-service/src/main/java/com/eventos/event/service/BookingService.java`
9. `backend/event-service/src/main/java/com/eventos/event/entity/Booking.java`
10. `backend/event-service/src/main/java/com/eventos/event/entity/BookingAuditLog.java`
11. `backend/event-service/src/main/java/com/eventos/event/entity/TaxSettings.java`
12. `backend/event-service/src/main/java/com/eventos/event/repository/BookingRepository.java`
13. `backend/event-service/src/main/java/com/eventos/event/repository/BookingAuditLogRepository.java`
14. `backend/event-service/src/main/java/com/eventos/event/consumer/QuoteAcceptedConsumer.java`
