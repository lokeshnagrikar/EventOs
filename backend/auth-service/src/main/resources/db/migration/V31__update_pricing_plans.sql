-- ==============================================================================
-- Migration: V31__update_pricing_plans.sql
-- Description: Synchronize SaaS Plan tiers to finalized EventOS pricing strategy
-- (Starter: 1999 INR, Professional: 5999 INR, Agency: 11999 INR)
-- ==============================================================================

-- 1. Insert or update the Agency plan tier
INSERT INTO plans (
    id, name, code, price, currency, billing_interval,
    max_users, max_storage, max_gallery_uploads, max_events, max_leads,
    max_ai_credits, max_automation_runs, max_api_calls,
    custom_domain_supported, white_label_supported,
    created_at, updated_at
)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Agency', 'agency', 11999.00, 'INR', 'MONTHLY',
    999, 536870912000, 10000, 99999, 99999,
    10000, 25000, 250000,
    TRUE, TRUE,
    NOW(), NOW()
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    max_users = EXCLUDED.max_users,
    max_storage = EXCLUDED.max_storage,
    max_events = EXCLUDED.max_events,
    max_leads = EXCLUDED.max_leads,
    max_ai_credits = EXCLUDED.max_ai_credits,
    max_automation_runs = EXCLUDED.max_automation_runs,
    max_api_calls = EXCLUDED.max_api_calls,
    custom_domain_supported = EXCLUDED.custom_domain_supported,
    white_label_supported = EXCLUDED.white_label_supported,
    updated_at = NOW();

-- 2. Update Starter plan tier with exact finalized quotas (2 seats, 20 GB, 5 active events)
UPDATE plans
SET 
    name = 'Starter',
    price = 1999.00,
    currency = 'INR',
    max_users = 2,
    max_storage = 21474836480, -- 20 GB
    max_events = 5,
    updated_at = NOW()
WHERE code = 'starter';

-- 3. Update Professional plan tier with exact finalized quotas (5 seats, 100 GB, 20 active events)
UPDATE plans
SET 
    name = 'Professional',
    price = 5999.00,
    currency = 'INR',
    max_users = 5,
    max_storage = 107374182400, -- 100 GB
    max_events = 20,
    custom_domain_supported = TRUE,
    white_label_supported = FALSE,
    updated_at = NOW()
WHERE code = 'professional';

-- 4. Map any legacy business/enterprise tenants to the unified agency tier
UPDATE tenants
SET subscription_plan = 'AGENCY'
WHERE subscription_plan IN ('ENTERPRISE', 'BUSINESS');
