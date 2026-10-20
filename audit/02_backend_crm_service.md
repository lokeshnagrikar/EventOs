# Phase 2: Backend Service Deep Dive — CRM Service (`crm-service`)

> **Service**: `backend/crm-service`  
> **Framework**: Spring Boot 3.3.0, Spring Security 6, Spring Data JPA / Hibernate 6, RabbitMQ AMQP  
> **Port**: `8082` (Context path: `/api/v1/crm`)  
> **Database**: `crm_db` (PostgreSQL 17)  
> **Auditor**: Senior Staff Engineer & Security Auditor  

---

## 1. Controllers & Endpoints Inventory

### 1.1 `CrmLeadController` (`/api/v1/crm/leads`)
| Method | Path | Required Role / Authority | Notes |
| :--- | :--- | :--- | :--- |
| `GET` | `/leads` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")` | Paginated lead list. Filtered by `tenant_id` and assigned user if `STAFF`. |
| `POST` | `/leads` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")` | Creates new Lead. Validates required fields (`name`, `status`). |
| `GET` | `/leads/{id}` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")` | Retrieves Lead by ID. Enforces `id` + `tenant_id` + `isDeleted=false`. |
| `PUT` | `/leads/{id}` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")` | Updates Lead details and stage. |
| `PATCH`| `/leads/{id}/status` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")` | Quick transition for Kanban drag-and-drop. Emits activity log. |
| `DELETE`| `/leads/{id}` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")` | Soft delete (`isDeleted = true`). |

### 1.2 `QuoteController` (`/api/v1/crm/quotes`)
| Method | Path | Required Role / Authority | Notes |
| :--- | :--- | :--- | :--- |
| `GET` | `/quotes` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")` | Lists quotations for tenant. |
| `POST` | `/quotes` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")` | Creates quote with itemized lines. Emits sequence `QT-YYYY-XXXXXX`. |
| `GET` | `/quotes/{id}` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")` | Retrieves quote by ID with line items. |
| `PUT` | `/quotes/{id}` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")` | Updates quotation if still in `DRAFT` status. |
| `POST` | `/quotes/{id}/send` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")` | Marks status `SENT`, generates PDF, logs email dispatch. |
| `POST` | `/quotes/{id}/approve` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")` | Internal agency on-spot approval. Marks `WON` and publishes event. |
| `GET` | `/quotes/public/{token}` | Public (`permitAll()`) | Allows client to view proposal by 64-character unguessable share token. |
| `POST` | `/quotes/public/{token}/approve` | Public (`permitAll()`) | Client digital e-signature approval. Marks lead `WON` and triggers booking creation. |
| `POST` | `/quotes/public/{token}/reject` | Public (`permitAll()`) | Client proposal rejection with optional feedback notes. |
| `GET` | `/quotes/{id}/pdf` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','STAFF')")` | Generates on-the-fly downloadable PDF proposal. |
| `DELETE`| `/quotes/{id}` | `@PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")` | Only permits deleting quotes in `DRAFT` status. |

---

## 2. Multi-Tenancy Enforcement & Repository Audit

### 2.1 Tenant Extraction & Context
- Extracted in `QuoteController.java:41-49` and `CrmLeadController.java` strictly from `SecurityContextHolder` via `UserPrincipal.getTenantId()`.
- Client-supplied `X-Tenant-ID` HTTP headers are NEVER trusted directly by the controller.

### 2.2 Repository Method Analysis
| Method in Repository | Enforces `tenant_id`? | Risk Assessment |
| :--- | :--- | :--- |
| `QuoteRepository.findByIdAndTenantId(id, tenantId)` | ✅ Yes | Safe |
| `QuoteRepository.findAllByTenantIdOrderByCreatedAtDesc` | ✅ Yes | Safe |
| `QuoteRepository.findByShareToken(shareToken)` | ⚠️ No (Global Token) | Safe because tokens are high-entropy 64-char hex strings (`UUID.randomUUID()`). |
| `QuoteRepository.findByQuoteNumber(quoteNumber)` | ❌ **NO** | **MEDIUM RISK**: `quote_number` sequences (`QT-2026-000001`) reset per tenant via `tenant_sequences` table. Two separate agencies can have identical quote numbers. Calling `findByQuoteNumber` without `tenantId` can leak quotes across tenants! |
| `LeadRepository.findByIdAndTenantIdAndIsDeletedFalse` | ✅ Yes | Safe |

---

## 3. Money & Tax Handling

### 3.1 Currency & Precision
- **Data Type**: `java.math.BigDecimal` is used across `Quote.java` and `QuoteItem.java` for `unitPrice`, `subtotal`, `discount`, `tax`, and `total`.
- **Rounding Mode**: `QuoteService.java:197`:
  ```java
  BigDecimal tax = taxableAmount.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
  ```
  ✅ Uses `RoundingMode.HALF_UP` with 2 decimal places.

### 3.2 Indian GST & Compliance Audit
- **Tax Rate**: Configurable via `dto.getTaxRate()` (defaults to `0` if null).
- **Compliance Gap**:
  - `crm-service` treats tax as a single lumped sum (`tax`).
  - **NOT IMPLEMENTED**: Split CGST (9%) / SGST (9%) for intra-state vs IGST (18%) for inter-state contracts.
  - **NOT IMPLEMENTED**: HSN / SAC codes (e.g. SAC 9985 for event catering/organization) on line items.
  - **NOT IMPLEMENTED**: Client GSTIN validation and reverse-charge mechanism (RCM).

---

## 4. Proposal to Booking Conversion & Distributed Transactions

### 4.1 Flow
When a client approves a proposal via `POST /quotes/public/{token}/approve`:
1. `quote.setStatus(QuoteStatus.ACCEPTED); quote.setApprovedAt(now); quoteRepository.save(quote);`
2. `leadService.updateLeadStatus(quote.getLeadId(), LeadStatus.WON, tenantId, null);`
3. `triggerBookingCreation(quote.getId(), tenantId);`
   - Emits `QuoteAcceptedEvent` to `eventos.exchange` with routing key `quote.accepted`.
4. Downstream `event-service` (`QuoteAcceptedConsumer.java`) listens and creates the master `Booking` record.

### 4.2 Distributed Transaction Failure Mode (No Outbox Pattern)
- **Location**: `QuoteService.java:522`:
  ```java
  rabbitTemplate.convertAndSend("eventos.exchange", "quote.accepted", event);
  ```
- **Vulnerability**: This RabbitMQ publish occurs *outside* a transactional outbox. If RabbitMQ is down, partitioned, or encounters a socket timeout during quote approval, the quote is marked `ACCEPTED` in `crm_db`, but the event is dropped. No `Booking` is ever created in `event_db`, leading to a silent cross-service state divergence with no automated retry or rollback!

---

## 5. Findings & Vulnerabilities for `crm-service`

### Finding CRM-1: [MEDIUM] Cross-Tenant Collision Risk on `findByQuoteNumber`
- **Location**: `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\repository\QuoteRepository.java:20`
- **Evidence**:
  ```java
  Optional<Quote> findByQuoteNumber(String quoteNumber);
  ```
- **Impact**: Since quote numbers are generated per tenant sequence (e.g., `QT-2026-000001`), multiple tenants will generate identical quote numbers. If any service logic looks up a quote by number without filtering by `tenantId`, it can return a different tenant's confidential quotation.
- **Fix**: Replace with `Optional<Quote> findByQuoteNumberAndTenantId(String quoteNumber, UUID tenantId)`.

---

### Finding CRM-2: [MEDIUM] Dual-Write Distributed Inconsistency on Proposal Approval
- **Location**: `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\service\QuoteService.java:673-690`
- **Evidence**:
  ```java
  quote.setStatus(QuoteStatus.ACCEPTED);
  quote = quoteRepository.save(quote);
  ...
  triggerBookingCreation(quote.getId(), tenantId); // rabbitTemplate.convertAndSend
  ```
- **Impact**: Lack of an Outbox table (`outbox_events`) means that if the AMQP broker fails during quotation approval, the client sees an approved contract, but the operations team receives no booking in `event-service`.
- **Fix**: Persist an `outbox_events` record in the same local database transaction as `quoteRepository.save(quote)`, and dispatch asynchronously via Debezium or a scheduled Spring publisher.

---

## 6. Files Reviewed in this Section

1. `d:\EventOs\backend\crm-service\src\main\resources\application.yml`
2. `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\config\SecurityConfig.java`
3. `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\controller\QuoteController.java`
4. `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\controller\CrmLeadController.java`
5. `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\controller\GlobalExceptionHandler.java`
6. `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\service\QuoteService.java`
7. `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\entity\Quote.java`
8. `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\entity\QuoteItem.java`
9. `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\entity\Lead.java`
10. `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\repository\QuoteRepository.java`
11. `d:\EventOs\backend\crm-service\src\main\java\com\eventos\crm\repository\LeadRepository.java`
