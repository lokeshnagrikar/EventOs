-- 1. Alter users table to add security columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Create password history table
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seed new enterprise roles: PLANNER, PHOTOGRAPHER, VENDOR
INSERT INTO roles (id, name, description, permissions_json) VALUES
('b27c62d0-798a-4d2a-89a1-77889b7b7a12', 'PLANNER', 'Logistical Coordinator and Planner', '["dashboard:read", "crm:read", "crm:write", "quotes:read", "quotes:write", "bookings:read", "bookings:write", "events:read", "events:write", "payments:read", "invoices:read", "gallery:read", "gallery:write", "settings:read", "analytics:read"]'),
('c38d73e0-809b-5e3b-90b2-88990c8c8b23', 'PHOTOGRAPHER', 'Field Photographer managing galleries', '["events:read", "gallery:read", "gallery:write"]'),
('d49e84f0-910c-6f4c-01c3-99001d9d9c34', 'VENDOR', 'External Vendor managing tasks', '["events:read", "gallery:read"]')
ON CONFLICT (name) DO NOTHING;

-- 4. Create index for query performance
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);
