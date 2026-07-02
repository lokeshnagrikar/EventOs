-- V26__billing_settings.sql
-- Create Billing Profiles table
CREATE TABLE IF NOT EXISTS billing_profiles (
    tenant_id UUID PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL DEFAULT 'STARTER',
    billing_cycle VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
    renewal_date TIMESTAMP NOT NULL,
    card_last4 VARCHAR(4),
    card_brand VARCHAR(50),
    card_expiry VARCHAR(10),
    billing_email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Tax Settings table
CREATE TABLE IF NOT EXISTS tax_settings (
    tenant_id UUID PRIMARY KEY,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    invoice_format VARCHAR(100) NOT NULL DEFAULT 'INV-{{year}}-{{seq}}',
    payment_terms_days INTEGER NOT NULL DEFAULT 15,
    late_fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
    automatic_calculation BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_body TEXT NOT NULL,
    variables_list VARCHAR(255),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UK_email_templates_tenant_name UNIQUE (tenant_id, template_name)
);

-- Create Integrations table
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    provider_name VARCHAR(100) NOT NULL,
    credentials_json TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DISCONNECTED',
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UK_integrations_tenant_provider UNIQUE (tenant_id, provider_name)
);

CREATE INDEX IF NOT EXISTS IDX_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS IDX_integrations_tenant ON integrations(tenant_id);
