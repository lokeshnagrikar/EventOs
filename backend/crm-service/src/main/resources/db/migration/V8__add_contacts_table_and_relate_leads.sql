-- Create Contacts Table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    company_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index and Unique constraints for contacts
CREATE INDEX IDX_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IDX_contacts_email ON contacts(email);
CREATE UNIQUE INDEX uq_contacts_tenant_email ON contacts (tenant_id, email) 
    WHERE is_deleted = FALSE AND email IS NOT NULL;

-- Alter Leads Table to add contact association
ALTER TABLE leads ADD COLUMN contact_id UUID REFERENCES contacts(id);

-- Migrate existing client details from leads into contacts
INSERT INTO contacts (tenant_id, first_name, last_name, email, phone, created_at, updated_at)
SELECT DISTINCT 
    tenant_id,
    CASE 
        WHEN position(' ' in name) > 0 THEN substring(name from 1 for position(' ' in name) - 1)
        ELSE name
    END AS first_name,
    CASE 
        WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
        ELSE NULL
    END AS last_name,
    email,
    phone,
    MIN(created_at),
    MIN(updated_at)
FROM leads
GROUP BY tenant_id, name, email, phone;

-- Associate leads with their newly created contacts
UPDATE leads l
SET contact_id = c.id
FROM contacts c
WHERE l.tenant_id = c.tenant_id 
  AND (l.email = c.email OR (l.email IS NULL AND c.email IS NULL))
  AND (
      (position(' ' in l.name) > 0 AND c.first_name = substring(l.name from 1 for position(' ' in l.name) - 1) AND c.last_name = substring(l.name from position(' ' in l.name) + 1))
      OR (position(' ' in l.name) = 0 AND c.first_name = l.name AND c.last_name IS NULL)
  );

-- For any remaining leads that did not match (fallback), create a default contact
INSERT INTO contacts (id, tenant_id, first_name, email, phone, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    tenant_id,
    name as first_name,
    email,
    phone,
    created_at,
    updated_at
FROM leads
WHERE contact_id IS NULL;

-- Update remaining fallbacks
UPDATE leads l
SET contact_id = c.id
FROM contacts c
WHERE l.contact_id IS NULL 
  AND l.tenant_id = c.tenant_id 
  AND l.name = c.first_name 
  AND (l.email = c.email OR (l.email IS NULL AND c.email IS NULL));

-- Make contact_id NOT NULL after successful migration
ALTER TABLE leads ALTER COLUMN contact_id SET NOT NULL;

-- Drop legacy phone and email columns on leads
ALTER TABLE leads DROP COLUMN IF EXISTS phone;
ALTER TABLE leads DROP COLUMN IF EXISTS email;

-- Create Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by UUID,
    payload_diff TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IDX_audit_logs_entity ON audit_logs(entity_name, entity_id);
