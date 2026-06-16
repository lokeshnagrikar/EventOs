-- Alter budget_estimates to support venue selections and client contact details
ALTER TABLE budget_estimates ADD COLUMN venue_type VARCHAR(100);
ALTER TABLE budget_estimates ADD COLUMN venue_total DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE budget_estimates ADD COLUMN client_name VARCHAR(255);
ALTER TABLE budget_estimates ADD COLUMN client_email VARCHAR(255);
ALTER TABLE budget_estimates ADD COLUMN client_phone VARCHAR(50);

-- Create pricing_rules table for configurable pricing rules
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL, -- EVENT_TYPE, VENUE_TYPE, DECOR_STYLE, ADD_ON
    rule_key VARCHAR(100) NOT NULL, -- e.g. WEDDING, HOTEL, ROYAL, COLD_PYRO
    base_price DECIMAL(12, 2) NOT NULL,
    price_type VARCHAR(50) NOT NULL, -- FLAT_RATE, PER_GUEST
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UQ_pricing_rules_tenant_cat_key UNIQUE (tenant_id, category, rule_key)
);

CREATE INDEX IDX_pricing_rules_tenant ON pricing_rules(tenant_id);
