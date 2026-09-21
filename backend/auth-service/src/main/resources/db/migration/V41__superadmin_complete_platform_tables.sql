-- Migration V41: SuperAdmin Complete Operational Platform Tables
-- Provides persistent storage for Support Tickets, Feature Flags, Database Backups,
-- Platform Announcements, Security Blacklist, and Referral Coupons.

-- 1. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(30) NOT NULL UNIQUE,
    tenant_id UUID,
    tenant_name VARCHAR(255),
    customer_email VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    assigned_to VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);

-- 2. Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    rollout_percentage INT NOT NULL DEFAULT 100,
    scope VARCHAR(100) NOT NULL DEFAULT 'Global',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Database Backups
CREATE TABLE IF NOT EXISTS database_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archive_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    databases_included VARCHAR(255) DEFAULT 'auth_db,crm_db,event_db,gallery_db',
    sha256_checksum VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_database_backups_created ON database_backups(created_at DESC);

-- 4. Platform Announcements
CREATE TABLE IF NOT EXISTS platform_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    target_audience VARCHAR(50) NOT NULL DEFAULT 'ALL',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Security Blacklist
CREATE TABLE IF NOT EXISTS security_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(100) NOT NULL UNIQUE,
    reason VARCHAR(255) NOT NULL,
    threat_level VARCHAR(50) DEFAULT 'High',
    blocked_by VARCHAR(255) DEFAULT 'Super Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Platform Referral Coupons
CREATE TABLE IF NOT EXISTS platform_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE',
    discount_value DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
    redemptions_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Core Feature Flags
INSERT INTO feature_flags (flag_key, name, description, enabled, rollout_percentage, scope)
VALUES 
    ('ai-assistant-v2', 'AI Assistant V2 Conversational Copilot', 'Context-aware AI budget generation and event intelligence', TRUE, 100, 'Global'),
    ('stripe-subscriptions', 'Stripe Subscription Checkout', 'Live billing subscription engine for SaaS workspaces', TRUE, 100, 'Global'),
    ('ws-sync-engine', 'WebSockets Realtime Sync Engine', 'STOMP/WebSocket event streaming bus across all services', TRUE, 100, 'Global'),
    ('custom-domain', 'Workspace White-label Custom Domains', 'Custom CNAME and SSL generation for enterprise clients', TRUE, 100, 'Enterprise Tenants')
ON CONFLICT (flag_key) DO NOTHING;

-- Initial Seed Coupons
INSERT INTO platform_coupons (code, discount_type, discount_value, redemptions_count, is_active)
VALUES
    ('LAUNCH2026', 'PERCENTAGE', 25.00, 14, TRUE),
    ('ENTERPRISE_DISCOUNT', 'PERCENTAGE', 10.00, 2, TRUE),
    ('SUPERADMIN_VIP', 'PERCENTAGE', 50.00, 5, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Initial Seed Support Tickets
INSERT INTO support_tickets (ticket_number, tenant_name, customer_email, subject, description, priority, status, assigned_to, notes)
VALUES
    ('TKT-1001', 'Apex Events', 'support@apexevents.co', 'Custom Domain CNAME Resolution Fail', 'Client reported DNS verification delay on custom domain dashboard.', 'HIGH', 'OPEN', 'Support Bot', 'Awaiting domain verification DNS cache propagation.'),
    ('TKT-1002', 'Elevate Agency', 'billing@elevate.in', 'Invoice billing double charge discrepancy', 'Customer query regarding billing period switch from monthly to annual.', 'MEDIUM', 'OPEN', 'Finance Bot', 'Cross-referenced with Stripe ledger log entries.'),
    ('TKT-1003', 'Vercel Meetups', 'organizer@vercelmeetups.com', 'Unable to unlock photo gallery downloads', 'Client asked for high-resolution zip export limit increase.', 'LOW', 'RESOLVED', 'Support Bot', 'Resolved. Advised upgrading to Enterprise gallery package.')
ON CONFLICT (ticket_number) DO NOTHING;
