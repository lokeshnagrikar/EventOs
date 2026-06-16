-- Create Leads Table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    assigned_user_id UUID,
    lead_source VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    event_type VARCHAR(100),
    event_date DATE,
    budget NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create Lead Activities Table
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index definitions for high-performance tenant filtering
CREATE INDEX IDX_leads_tenant ON leads(tenant_id);
CREATE INDEX IDX_leads_status ON leads(status);
CREATE INDEX IDX_lead_activities_lead ON lead_activities(lead_id);
