-- V8__settings_tables.sql
-- Add new enterprise settings columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cover_url VARCHAR(1000);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS favicon_url VARCHAR(1000);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS accent_color VARCHAR(50);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS gradient_presets VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS font_selection VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS dark_theme_logo VARCHAR(1000);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pan_number VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_hours VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS date_format VARCHAR(50);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS language VARCHAR(50);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_branding TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS invoice_branding TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pdf_branding TEXT;

-- Create API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    prefix VARCHAR(50) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    scopes VARCHAR(255),
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create User 2FA table
CREATE TABLE IF NOT EXISTS user_2fa (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    backup_codes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS IDX_api_keys_tenant ON api_keys(tenant_id);
