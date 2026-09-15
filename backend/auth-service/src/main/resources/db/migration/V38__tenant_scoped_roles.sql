-- Phase 2P: Tenant-scoped roles and system role immutability

ALTER TABLE roles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark all existing roles as system roles (they have no tenant_id)
UPDATE roles SET is_system_role = TRUE WHERE tenant_id IS NULL;

-- Drop legacy global unique constraint on name if present
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_key;
ALTER TABLE roles DROP CONSTRAINT IF EXISTS uk_roles_name;

-- System roles (tenant_id IS NULL) must have globally unique names
CREATE UNIQUE INDEX IF NOT EXISTS uk_roles_system_name ON roles(UPPER(name)) WHERE tenant_id IS NULL;

-- Custom tenant roles (tenant_id IS NOT NULL) must be unique within their tenant
CREATE UNIQUE INDEX IF NOT EXISTS uk_roles_tenant_name ON roles(tenant_id, UPPER(name)) WHERE tenant_id IS NOT NULL;

-- Performance index for tenant role lookups
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);
