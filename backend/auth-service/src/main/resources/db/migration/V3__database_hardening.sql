-- Add foreign key constraint on refresh_tokens(tenant_id)
ALTER TABLE refresh_tokens ADD CONSTRAINT fk_refresh_tokens_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Index definitions for database hardening
CREATE INDEX IF NOT EXISTS IDX_refresh_tokens_tenant ON refresh_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS IDX_memberships_role ON memberships(role_id);
