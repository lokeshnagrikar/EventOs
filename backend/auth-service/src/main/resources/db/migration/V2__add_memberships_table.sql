-- Create memberships table
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index definitions for memberships
CREATE INDEX IDX_memberships_user ON memberships(user_id);
CREATE INDEX IDX_memberships_tenant ON memberships(tenant_id);
CREATE INDEX IDX_memberships_company ON memberships(company_id);

-- Migrate existing associations from users table to memberships table
INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status, created_at, updated_at)
SELECT uuid_generate_v4(), id, tenant_id, company_id, role_id, status, created_at, updated_at
FROM users;

-- Add tenant_id to refresh_tokens
ALTER TABLE refresh_tokens ADD COLUMN tenant_id UUID;

-- Update existing refresh_tokens with the tenant_id of their respective users
UPDATE refresh_tokens rt
SET tenant_id = u.tenant_id
FROM (
    SELECT id, tenant_id FROM users
) u
WHERE rt.user_id = u.id;

-- Make tenant_id in refresh_tokens NOT NULL
ALTER TABLE refresh_tokens ALTER COLUMN tenant_id SET NOT NULL;

-- Remove old foreign key constraints and drop columns from users
ALTER TABLE users DROP COLUMN tenant_id;
ALTER TABLE users DROP COLUMN company_id;
ALTER TABLE users DROP COLUMN role_id;
