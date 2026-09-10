-- ==============================================================================
-- Migration: V34__standardize_canonical_pricing_plans.sql
-- Description: Standardize SaaS plans table to match the exact 3 Public Core Tiers
-- (Starter: ₹1,999, Professional: ₹4,999, Enterprise/Agency: ₹12,999)
-- ==============================================================================

-- 1. Free Trial Tier (₹0)
UPDATE plans
SET 
    name = 'Free Trial',
    price = 0.00,
    currency = 'INR',
    max_users = 3,
    max_storage = 5368709120, -- 5 GB
    max_events = 5,
    max_leads = 10,
    max_ai_credits = 50,
    custom_domain_supported = FALSE,
    white_label_supported = FALSE,
    updated_at = NOW()
WHERE code = 'free_trial';

-- 2. Starter Tier (₹1,999/mo)
UPDATE plans
SET 
    name = 'Starter',
    price = 1999.00,
    currency = 'INR',
    max_users = 3,
    max_storage = 21474836480, -- 20 GB
    max_events = 15,
    max_leads = 50,
    max_ai_credits = 200,
    custom_domain_supported = FALSE,
    white_label_supported = FALSE,
    updated_at = NOW()
WHERE code = 'starter';

-- 3. Professional Tier (₹4,999/mo)
UPDATE plans
SET 
    name = 'Professional',
    price = 4999.00,
    currency = 'INR',
    max_users = 10,
    max_storage = 107374182400, -- 100 GB
    max_events = 50,
    max_leads = 200,
    max_ai_credits = 1000,
    custom_domain_supported = TRUE,
    white_label_supported = FALSE,
    updated_at = NOW()
WHERE code = 'professional';

-- 4. Agency Tier (₹12,999/mo) - High Volume Production
INSERT INTO plans (
    id, name, code, price, currency, billing_interval,
    max_users, max_storage, max_gallery_uploads, max_events, max_leads,
    max_ai_credits, max_automation_runs, max_api_calls,
    custom_domain_supported, white_label_supported,
    created_at, updated_at
)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Agency', 'agency', 12999.00, 'INR', 'MONTHLY',
    999, 1099511627776, 99999, 99999, 99999,
    50000, 100000, 1000000,
    TRUE, TRUE,
    NOW(), NOW()
)
ON CONFLICT (code) DO UPDATE SET
    name = 'Agency',
    price = 12999.00,
    currency = 'INR',
    max_users = 999,
    max_storage = 1099511627776,
    max_events = 99999,
    custom_domain_supported = TRUE,
    white_label_supported = TRUE,
    updated_at = NOW();

-- 5. Enterprise Tier (₹12,999/mo) - Dedicated Infrastructure
INSERT INTO plans (
    id, name, code, price, currency, billing_interval,
    max_users, max_storage, max_gallery_uploads, max_events, max_leads,
    max_ai_credits, max_automation_runs, max_api_calls,
    custom_domain_supported, white_label_supported,
    created_at, updated_at
)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Enterprise', 'enterprise', 12999.00, 'INR', 'MONTHLY',
    999, 1099511627776, 99999, 99999, 99999,
    50000, 100000, 1000000,
    TRUE, TRUE,
    NOW(), NOW()
)
ON CONFLICT (code) DO UPDATE SET
    name = 'Enterprise',
    price = 12999.00,
    currency = 'INR',
    max_users = 999,
    max_storage = 1099511627776,
    max_events = 99999,
    custom_domain_supported = TRUE,
    white_label_supported = TRUE,
    updated_at = NOW();
