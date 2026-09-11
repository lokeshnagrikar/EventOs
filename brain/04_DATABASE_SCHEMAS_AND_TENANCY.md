# 🗄️ Database Schemas, Multi-Tenancy & Data Isolation

> **Complete documentation of the PostgreSQL database topology, schema migrations (Flyway), and tenant isolation mechanisms.**

---

## 1. Multi-Database Architecture

EventOS follows a **Database-per-Service** design to guarantee bounded contexts and decoupled service lifecycles:

```
                               ┌───────────────────────────┐
                               │   PostgreSQL 17 Database  │
                               │        (Port 5433)        │
                               └─────────────┬─────────────┘
                                             │
         ┌───────────────────┬───────────────┴───────────────┬───────────────────┐
         ▼                   ▼                               ▼                   ▼
  ┌─────────────┐     ┌─────────────┐                 ┌─────────────┐     ┌─────────────┐
  │   auth_db   │     │   crm_db    │                 │  event_db   │     │ gallery_db  │
  │ auth-service│     │ crm-service │                 │event-service│     │gallery-serv.│
  └─────────────┘     └─────────────┘                 └─────────────┘     └─────────────┘
```

---

## 2. Multi-Tenancy & Tenant Isolation Principles

1. **`tenant_id` Column on Every Domain Entity**:
   * Every business record belongs to a specific tenant (`UUID tenant_id`).
   * No query is executed without scoping to the current tenant ID:
     ```sql
     SELECT * FROM leads WHERE tenant_id = :tenantId;
     SELECT * FROM events WHERE tenant_id = :tenantId AND id = :eventId;
     ```
2. **Context Propagation via `TenantContext`**:
   * Downstream microservices parse the `X-Tenant-Id` header sent by `api-gateway`.
   * Stored in a thread-local `TenantContext` during request execution.
3. **Superadmin Bypass**:
   * Platform superadmins (`ROLE_SUPERADMIN`) can access cross-tenant audit feeds via dedicated administrative endpoints.

---

## 3. Database Schemas by Service

### 3.1 `auth_db` (`backend/auth-service`)
* **`users`**: Platform user accounts (`id`, `email`, `password_hash`, `first_name`, `last_name`, `is_email_verified`, `created_at`).
* **`tenants`**: Agency organizations (`id`, `name`, `subdomain`, `plan`, `subscription_status`, `stripe_customer_id`).
* **`workspaces`**: Individual operational workspaces within an agency (`id`, `tenant_id`, `name`, `currency`).
* **`user_tenants`**: Many-to-many relationship mapping users to tenants with specific roles (`user_id`, `tenant_id`, `role`).
* **`verification_tokens`**: 6-digit OTP codes and magic link tokens with expiration timestamps.
* **`subscriptions`**: Active billing plans (`STARTER`, `PROFESSIONAL`, `AGENCY`, `ENTERPRISE`).

### 3.2 `crm_db` (`backend/crm-service`)
* **`leads`**: Potential event clients (`id`, `tenant_id`, `client_name`, `email`, `phone`, `stage`, `budget`, `event_date`).
* **`proposals`**: Digital proposals (`id`, `tenant_id`, `lead_id`, `title`, `token`, `status`, `valid_until`, `total_amount`).
* **`proposal_items`**: Categorized line items for event proposals (`proposal_id`, `category`, `description`, `price`, `quantity`).
* **`lead_activities`**: Timeline notes, calls, follow-ups, and email logs.

### 3.3 `event_db` (`backend/event-service`)
* **`events` / `bookings`**: Confirmed events (`id`, `tenant_id`, `name`, `client_name`, `client_email`, `venue`, `event_date`, `status`).
* **`event_timeline_items`**: Run-of-show cues (`id`, `event_id`, `start_time`, `cue_title`, `description`, `performer_assigned`).
* **`vendors`**: Vendor directory (`id`, `tenant_id`, `vendor_name`, `category`, `email`, `phone`, `rating`).
* **`event_vendors`**: Vendor assignments to specific events with contracted amounts.
* **`invoices`**: Milestone billing records (`id`, `event_id`, `tenant_id`, `invoice_number`, `amount`, `due_date`, `payment_status`).
* **`payments`**: Transaction records (`id`, `invoice_id`, `amount`, `payment_method`, `transaction_reference`, `paid_at`).
* **`email_templates`**: Tenant-customized email notification templates (`tenant_id`, `template_name`, `subject`, `html_body`).

### 3.4 `gallery_db` (`backend/gallery-service`)
* **`albums`**: Photo collections (`id`, `tenant_id`, `event_id`, `title`, `cover_image_url`, `is_published`).
* **`photos`**: Individual image assets (`id`, `album_id`, `cloudinary_public_id`, `original_url`, `watermarked_url`, `file_size`).
* **`photo_favorites`**: Client favoriting and print selections (`photo_id`, `client_email`, `favorited_at`).
* **`gallery_shares`**: PIN-protected shareable links (`album_id`, `share_token`, `pin_hash`, `can_download_original`).

---

## 4. Flyway Schema Migrations Strategy

* Each service maintains its own Flyway migrations under `src/main/resources/db/migration/`.
* Migrations run automatically during service container boot.
* **Key Flyway Rule**: Never mutate historical SQL files (`V1` to `V34`). Always append a new sequential version file (e.g., `V35__add_feature.sql`).
