-- Create generic audit logs table for event service
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by UUID,
    payload_diff TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS IDX_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS IDX_audit_logs_entity ON audit_logs(entity_name, entity_id);
