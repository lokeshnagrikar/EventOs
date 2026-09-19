# EventOS - Complete Database CRUD & Inspection Cheatsheet

This cheatsheet contains production-ready PostgreSQL queries and single-line `docker exec` commands for all microservices databases in EventOS.

---

## 📌 Database Overview

| Database Name | Microservice | Primary Tables |
| :--- | :--- | :--- |
| **`auth_db`** | `auth-service` | `users`, `roles`, `memberships`, `tenants`, `companies`, `subscriptions`, `invitations`, `inquiries` |
| **`crm_db`** | `crm-service` | `leads`, `contacts`, `quotes`, `quote_items`, `activities` |
| **`event_db`** | `event-service` | `bookings`, `events`, `invoices`, `payments`, `expenses`, `timeline_tasks`, `vendors` |
| **`gallery_db`** | `gallery-service` | `albums`, `gallery_items`, `share_links` |

---

## ⚡ Quick Connect (Interactive Terminal)

Run any of these in your SSH terminal to enter the interactive PostgreSQL shell (`psql`):

```bash
# Connect to Auth Database
docker exec -it eventos-postgres psql -U eventos_admin -d auth_db

# Connect to CRM Database
docker exec -it eventos-postgres psql -U eventos_admin -d crm_db

# Connect to Event & Billing Database
docker exec -it eventos-postgres psql -U eventos_admin -d event_db

# Connect to Gallery Database
docker exec -it eventos-postgres psql -U eventos_admin -d gallery_db

# (Type \q and press Enter to exit psql)
```

---

## 1. `auth_db` — Users, Roles & Workspaces

### 1.1 READ (Users & Roles)

#### View all active users with their Role and Workspace name:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d auth_db -c "
SELECT 
    u.id AS user_id,
    u.email,
    u.first_name || ' ' || COALESCE(u.last_name, '') AS full_name,
    u.phone,
    r.name AS role,
    t.name AS workspace_name,
    u.status,
    u.is_email_verified AS email_verified,
    u.created_at
FROM users u
LEFT JOIN memberships m ON u.id = m.user_id
LEFT JOIN roles r ON m.role_id = r.id
LEFT JOIN tenants t ON m.tenant_id = t.id
WHERE u.is_deleted = false
ORDER BY u.created_at DESC;
"
```

#### View only `OWNER` users:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d auth_db -c "
SELECT 
    u.email, 
    u.first_name || ' ' || COALESCE(u.last_name, '') AS owner_name, 
    u.phone, 
    t.name AS workspace_name, 
    u.status, 
    u.created_at
FROM users u
JOIN memberships m ON u.id = m.user_id
JOIN roles r ON m.role_id = r.id
JOIN tenants t ON m.tenant_id = t.id
WHERE r.name = 'OWNER' AND u.is_deleted = false
ORDER BY u.created_at DESC;
"
```

#### View only `CLIENT` users:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d auth_db -c "
SELECT 
    u.email, 
    u.first_name || ' ' || COALESCE(u.last_name, '') AS client_name, 
    u.phone, 
    t.name AS workspace_name, 
    u.status, 
    u.created_at
FROM users u
JOIN memberships m ON u.id = m.user_id
JOIN roles r ON m.role_id = r.id
JOIN tenants t ON m.tenant_id = t.id
WHERE r.name = 'CLIENT' AND u.is_deleted = false
ORDER BY u.created_at DESC;
"
```

#### Search user by email:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d auth_db -c "
SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.is_email_verified, r.name AS role
FROM users u
LEFT JOIN memberships m ON u.id = m.user_id
LEFT JOIN roles r ON m.role_id = r.id
WHERE u.email = 'example@gmail.com';
"
```

---

### 1.2 UPDATE (Users)

#### Manually verify an unverified user's email:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d auth_db -c "
UPDATE users 
SET is_email_verified = true, email_verification_token = NULL 
WHERE email = 'example@gmail.com';
"
```

#### Activate or Deactivate a user:
```bash
# Activate user
docker exec -it eventos-postgres psql -U eventos_admin -d auth_db -c "
UPDATE users SET status = 'ACTIVE' WHERE email = 'example@gmail.com';
"

# Deactivate user (Suspended)
docker exec -it eventos-postgres psql -U eventos_admin -d auth_db -c "
UPDATE users SET status = 'SUSPENDED' WHERE email = 'example@gmail.com';
"
```

#### Change user's Role (e.g., Promote to OWNER):
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d auth_db -c "
UPDATE memberships 
SET role_id = (SELECT id FROM roles WHERE name = 'OWNER' LIMIT 1)
WHERE user_id = (SELECT id FROM users WHERE email = 'example@gmail.com');
"
```

---

### 1.3 DELETE (Clean User & Memberships)

#### Complete cleanup of a test user (re-registration testing):
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d auth_db -c "
DELETE FROM memberships WHERE user_id IN (SELECT id FROM users WHERE email = 'test@example.com');
DELETE FROM users WHERE email = 'test@example.com';
"
```

---

## 2. `crm_db` — Leads, Contacts & Quotes

### 2.1 LEADS CRUD

#### View all Leads with Contact details:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d crm_db -c "
SELECT 
    l.id AS lead_id,
    l.name AS lead_name,
    c.email,
    c.phone,
    l.event_type,
    l.event_date,
    l.budget,
    l.status,
    l.created_at
FROM leads l
LEFT JOIN contacts c ON l.contact_id = c.id
WHERE l.is_deleted = false
ORDER BY l.created_at DESC;
"
```

#### Filter Leads by Status (`NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`):
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d crm_db -c "
SELECT l.name, c.email, c.phone, l.status, l.budget, l.created_at
FROM leads l
JOIN contacts c ON l.contact_id = c.id
WHERE l.status = 'NEW' AND l.is_deleted = false;
"
```

#### Update Lead status:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d crm_db -c "
UPDATE leads 
SET status = 'CONVERTED', updated_at = NOW() 
WHERE name = 'John Doe Wedding';
"
```

#### Soft-delete a Lead:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d crm_db -c "
UPDATE leads SET is_deleted = true WHERE id = 'YOUR_LEAD_UUID';
"
```

---

### 2.2 QUOTES CRUD

#### View all Quotes with total amount and status:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d crm_db -c "
SELECT 
    q.id AS quote_id,
    q.quote_number,
    q.title,
    q.total_amount,
    q.status,
    q.valid_until,
    q.share_token,
    q.created_at
FROM quotes q
ORDER BY q.created_at DESC;
"
```

#### View Quote Items for a specific Quote:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d crm_db -c "
SELECT 
    qi.description,
    qi.quantity,
    qi.unit_price,
    qi.total_price
FROM quote_items qi
JOIN quotes q ON qi.quote_id = q.id
WHERE q.quote_number = 'Q-1001';
"
```

#### Update Quote status (`DRAFT`, `SENT`, `ACCEPTED`, `DECLINED`, `EXPIRED`):
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d crm_db -c "
UPDATE quotes SET status = 'ACCEPTED' WHERE quote_number = 'Q-1001';
"
```

---

### 2.3 CONTACTS CRUD

#### View all Contacts:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d crm_db -c "
SELECT id, first_name, last_name, email, phone, company_name, created_at 
FROM contacts 
ORDER BY created_at DESC;
"
```

---

## 3. `event_db` — Bookings, Events, Invoices & Payments

### 3.1 BOOKINGS CRUD

#### View all Bookings:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d event_db -c "
SELECT 
    b.id AS booking_id,
    b.title,
    b.status,
    b.event_date,
    b.total_amount,
    b.paid_amount,
    b.created_at
FROM bookings b
ORDER BY b.created_at DESC;
"
```

#### View Client-specific Bookings:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d event_db -c "
SELECT id, title, status, event_date, total_amount, paid_amount 
FROM bookings 
WHERE client_user_id = 'YOUR_CLIENT_USER_UUID';
"
```

#### Update Booking status (`CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`):
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d event_db -c "
UPDATE bookings SET status = 'CONFIRMED' WHERE id = 'YOUR_BOOKING_UUID';
"
```

---

### 3.2 INVOICES & PAYMENTS

#### View all Invoices:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d event_db -c "
SELECT 
    invoice_number,
    total_amount,
    status,
    due_date,
    created_at
FROM invoices
ORDER BY created_at DESC;
"
```

#### View all recorded Payments:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d event_db -c "
SELECT 
    id AS payment_id,
    amount,
    payment_method,
    status,
    transaction_id,
    created_at
FROM payments
ORDER BY created_at DESC;
"
```

---

## 4. `gallery_db` — Albums & Media

### 4.1 ALBUMS CRUD

#### View all Albums and share links:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d gallery_db -c "
SELECT 
    a.id AS album_id,
    a.title,
    a.event_date,
    a.status,
    a.visibility,
    s.token AS public_share_token,
    a.created_at
FROM albums a
LEFT JOIN share_links s ON a.id = s.album_id
ORDER BY a.created_at DESC;
"
```

#### View count of photos/items per album:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d gallery_db -c "
SELECT 
    a.title,
    COUNT(gi.id) AS total_media_items
FROM albums a
LEFT JOIN gallery_items gi ON a.id = gi.album_id
GROUP BY a.id, a.title;
"
```

---

## 5. 🛠️ Useful Diagnostic & Maintenance Queries

### Check Database Size & Health across all microservices:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d eventos_root -c "
SELECT datname, pg_size_pretty(pg_database_size(datname)) AS size 
FROM pg_database 
WHERE datname IN ('auth_db', 'crm_db', 'event_db', 'payment_db', 'gallery_db');
"
```

### Check row counts across all main tables:
```bash
docker exec -it eventos-postgres psql -U eventos_admin -d auth_db -c "SELECT 'users' AS table_name, count(*) FROM users UNION ALL SELECT 'tenants', count(*) FROM tenants UNION ALL SELECT 'memberships', count(*) FROM memberships;"
docker exec -it eventos-postgres psql -U eventos_admin -d crm_db -c "SELECT 'leads' AS table_name, count(*) FROM leads UNION ALL SELECT 'quotes', count(*) FROM quotes UNION ALL SELECT 'contacts', count(*) FROM contacts;"
docker exec -it eventos-postgres psql -U eventos_admin -d event_db -c "SELECT 'bookings' AS table_name, count(*) FROM bookings UNION ALL SELECT 'invoices', count(*) FROM invoices UNION ALL SELECT 'payments', count(*) FROM payments;"
docker exec -it eventos-postgres psql -U eventos_admin -d gallery_db -c "SELECT 'albums' AS table_name, count(*) FROM albums UNION ALL SELECT 'gallery_items', count(*) FROM gallery_items;"
```
