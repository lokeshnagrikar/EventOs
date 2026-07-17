-- Migration V10: Create Multi-Tenant SaaS Tables

-- 1. Create Plans Table
CREATE TABLE plans (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    billing_interval VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    max_users INT NOT NULL DEFAULT 5,
    max_storage BIGINT NOT NULL DEFAULT 5368709120, -- 5GB
    max_gallery_uploads INT NOT NULL DEFAULT 100,
    max_events INT NOT NULL DEFAULT 10,
    max_leads INT NOT NULL DEFAULT 50,
    max_ai_credits INT NOT NULL DEFAULT 100,
    max_automation_runs INT NOT NULL DEFAULT 200,
    max_api_calls INT NOT NULL DEFAULT 1000,
    custom_domain_supported BOOLEAN NOT NULL DEFAULT FALSE,
    white_label_supported BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Create Subscriptions Table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID UNIQUE NOT NULL,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on subscription tenant_id
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);

-- 3. Create Payment Methods Table
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    last4 VARCHAR(4),
    card_brand VARCHAR(20),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on payment methods tenant_id
CREATE INDEX idx_payment_methods_tenant ON payment_methods(tenant_id);

-- 4. Create Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'PAID',
    billing_period_start TIMESTAMP NOT NULL,
    billing_period_end TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    paid_at TIMESTAMP,
    pdf_url VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on invoices tenant_id
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);

-- 5. Create Billing History Table
CREATE TABLE billing_history (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    payment_method_id UUID REFERENCES payment_methods(id),
    transaction_reference VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on billing history tenant_id
CREATE INDEX idx_billing_history_tenant ON billing_history(tenant_id);

-- 6. Create Workspace Settings Table
CREATE TABLE workspace_settings (
    id UUID PRIMARY KEY,
    tenant_id UUID UNIQUE NOT NULL,
    custom_domain VARCHAR(255),
    custom_domain_verified BOOLEAN NOT NULL DEFAULT FALSE,
    white_label_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    custom_login_url VARCHAR(255),
    custom_email_sender VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on workspace settings tenant_id
CREATE INDEX idx_workspace_settings_tenant ON workspace_settings(tenant_id);

-- 7. Create Tenant Usages Table
CREATE TABLE tenant_usages (
    id UUID PRIMARY KEY,
    tenant_id UUID UNIQUE NOT NULL,
    users_count INT NOT NULL DEFAULT 0,
    storage_bytes BIGINT NOT NULL DEFAULT 0,
    gallery_uploads INT NOT NULL DEFAULT 0,
    events_count INT NOT NULL DEFAULT 0,
    leads_count INT NOT NULL DEFAULT 0,
    ai_credits_used INT NOT NULL DEFAULT 0,
    automation_runs INT NOT NULL DEFAULT 0,
    api_calls INT NOT NULL DEFAULT 0,
    emails_sent INT NOT NULL DEFAULT 0,
    sms_sent INT NOT NULL DEFAULT 0,
    billing_period_start TIMESTAMP NOT NULL,
    billing_period_end TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on tenant usages tenant_id
CREATE INDEX idx_tenant_usages_tenant ON tenant_usages(tenant_id);

-- Seed predefined SaaS Plan tiers
INSERT INTO plans (id, name, code, price, currency, billing_interval, max_users, max_storage, max_gallery_uploads, max_events, max_leads, max_ai_credits, max_automation_runs, max_api_calls, custom_domain_supported, white_label_supported)
VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Free Trial', 'free_trial', 0.00, 'INR', 'MONTHLY', 3, 5368709120, 20, 5, 10, 50, 100, 1000, FALSE, FALSE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Starter', 'starter', 1999.00, 'INR', 'MONTHLY', 5, 10737418240, 50, 15, 50, 200, 500, 5000, FALSE, FALSE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Professional', 'professional', 5999.00, 'INR', 'MONTHLY', 15, 53687091200, 200, 50, 200, 1000, 2500, 25000, TRUE, FALSE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Business', 'business', 11999.00, 'INR', 'MONTHLY', 50, 214748364800, 1000, 200, 1000, 5000, 10000, 100000, TRUE, TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Enterprise', 'enterprise', 24999.00, 'INR', 'MONTHLY', 999, 1099511627776, 99999, 99999, 99999, 50000, 100000, 1000000, TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;
