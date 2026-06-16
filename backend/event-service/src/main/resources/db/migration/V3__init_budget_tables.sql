-- Create Budget Estimates Table
CREATE TABLE budget_estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    guest_count INTEGER NOT NULL,
    decor_style VARCHAR(50) NOT NULL,
    effects_list VARCHAR(1000),
    catering_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    decor_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    effects_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant isolation filtering performance
CREATE INDEX IDX_budget_estimates_tenant ON budget_estimates(tenant_id);
