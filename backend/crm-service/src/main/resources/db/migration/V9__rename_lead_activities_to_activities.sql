-- Rename Lead Activities Table to Activities
ALTER TABLE lead_activities RENAME TO activities;

-- Add tenant_id column
ALTER TABLE activities ADD COLUMN tenant_id UUID;

-- Populate tenant_id from leads table
UPDATE activities a
SET tenant_id = l.tenant_id
FROM leads l
WHERE a.lead_id = l.id;

-- Make tenant_id NOT NULL
ALTER TABLE activities ALTER COLUMN tenant_id SET NOT NULL;

-- Add updated_at column
ALTER TABLE activities ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Rename existing index for consistency
ALTER INDEX IDX_lead_activities_lead RENAME TO IDX_activities_lead;

-- Create index for tenant filtering
CREATE INDEX IDX_activities_tenant ON activities(tenant_id);
