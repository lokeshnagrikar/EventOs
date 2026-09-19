-- ==============================================================================
-- EventOS - Master Database CRUD Queries Script
-- Supported Databases: auth_db, crm_db, event_db, gallery_db
-- ==============================================================================

-- ==============================================================================
-- 1. AUTH_DB (Users, Roles, Workspaces, Memberships)
-- ==============================================================================
\c auth_db;

-- 1.1 READ: View all active users with Role & Workspace
SELECT 
    u.id AS user_id,
    u.email,
    u.first_name || ' ' || COALESCE(u.last_name, '') AS full_name,
    u.phone,
    r.name AS role,
    t.name AS workspace_name,
    u.status,
    u.is_email_verified,
    u.created_at
FROM users u
LEFT JOIN memberships m ON u.id = m.user_id
LEFT JOIN roles r ON m.role_id = r.id
LEFT JOIN tenants t ON m.tenant_id = t.id
WHERE u.is_deleted = false
ORDER BY u.created_at DESC;

-- 1.2 READ: View OWNER users only
SELECT 
    u.email, 
    u.first_name, 
    u.last_name, 
    r.name AS role, 
    t.name AS workspace_name, 
    u.status
FROM users u
JOIN memberships m ON u.id = m.user_id
JOIN roles r ON m.role_id = r.id
JOIN tenants t ON m.tenant_id = t.id
WHERE r.name = 'OWNER' AND u.is_deleted = false
ORDER BY u.created_at DESC;

-- 1.3 READ: View CLIENT users only
SELECT 
    u.email, 
    u.first_name, 
    u.last_name, 
    r.name AS role, 
    t.name AS workspace_name, 
    u.status
FROM users u
JOIN memberships m ON u.id = m.user_id
JOIN roles r ON m.role_id = r.id
JOIN tenants t ON m.tenant_id = t.id
WHERE r.name = 'CLIENT' AND u.is_deleted = false
ORDER BY u.created_at DESC;

-- 1.4 UPDATE: Manually verify email
-- UPDATE users SET is_email_verified = true, email_verification_token = NULL WHERE email = 'target@example.com';

-- 1.5 UPDATE: Change User Status (ACTIVE, SUSPENDED, PENDING_SETUP)
-- UPDATE users SET status = 'ACTIVE' WHERE email = 'target@example.com';

-- 1.6 UPDATE: Change User Role (OWNER, ADMIN, CLIENT, STAFF)
-- UPDATE memberships 
-- SET role_id = (SELECT id FROM roles WHERE name = 'OWNER' LIMIT 1)
-- WHERE user_id = (SELECT id FROM users WHERE email = 'target@example.com');

-- 1.7 DELETE: Safely remove user and all memberships
-- DELETE FROM memberships WHERE user_id IN (SELECT id FROM users WHERE email = 'target@example.com');
-- DELETE FROM users WHERE email = 'target@example.com';


-- ==============================================================================
-- 2. CRM_DB (Leads, Contacts, Quotes, Activities)
-- ==============================================================================
\c crm_db;

-- 2.1 READ: View all leads with contact info
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

-- 2.2 READ: Filter leads by status (NEW, CONTACTED, QUALIFIED, CONVERTED, LOST)
SELECT l.id, l.name, c.email, c.phone, l.status, l.budget 
FROM leads l 
JOIN contacts c ON l.contact_id = c.id 
WHERE l.status = 'NEW' AND l.is_deleted = false;

-- 2.3 UPDATE: Change lead status
-- UPDATE leads SET status = 'CONVERTED', updated_at = NOW() WHERE id = 'YOUR_LEAD_UUID';

-- 2.4 READ: View all quotes
SELECT 
    q.quote_number,
    q.title,
    q.total_amount,
    q.status,
    q.valid_until,
    q.share_token,
    q.created_at
FROM quotes q
ORDER BY q.created_at DESC;

-- 2.5 READ: View quote items for a quote
-- SELECT qi.description, qi.quantity, qi.unit_price, qi.total_price
-- FROM quote_items qi
-- JOIN quotes q ON qi.quote_id = q.id
-- WHERE q.quote_number = 'Q-1001';

-- 2.6 UPDATE: Accept or decline quote (DRAFT, SENT, ACCEPTED, DECLINED, EXPIRED)
-- UPDATE quotes SET status = 'ACCEPTED' WHERE quote_number = 'Q-1001';


-- ==============================================================================
-- 3. EVENT_DB (Bookings, Events, Invoices, Payments)
-- ==============================================================================
\c event_db;

-- 3.1 READ: View all bookings
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

-- 3.2 UPDATE: Update booking status (CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)
-- UPDATE bookings SET status = 'CONFIRMED' WHERE id = 'YOUR_BOOKING_UUID';

-- 3.3 READ: View invoices
SELECT invoice_number, total_amount, status, due_date, created_at 
FROM invoices 
ORDER BY created_at DESC;

-- 3.4 READ: View payments
SELECT id, amount, payment_method, status, transaction_id, created_at 
FROM payments 
ORDER BY created_at DESC;


-- ==============================================================================
-- 4. GALLERY_DB (Albums, Media items, Share links)
-- ==============================================================================
\c gallery_db;

-- 4.1 READ: View all albums and public share tokens
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

-- 4.2 READ: Count media items per album
SELECT 
    a.title,
    COUNT(gi.id) AS media_count
FROM albums a
LEFT JOIN gallery_items gi ON a.id = gi.album_id
GROUP BY a.id, a.title;
