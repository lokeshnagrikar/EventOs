ALTER TABLE share_links ADD COLUMN IF NOT EXISTS allow_download BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS share_link_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    share_link_id UUID REFERENCES share_links(id) ON DELETE SET NULL,
    token VARCHAR(255) NOT NULL,
    accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS IDX_share_link_access_logs_token ON share_link_access_logs(token);
CREATE INDEX IF NOT EXISTS IDX_share_link_access_logs_tenant ON share_link_access_logs(tenant_id);
