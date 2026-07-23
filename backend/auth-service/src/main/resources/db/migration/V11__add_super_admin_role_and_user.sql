-- Migration V11: Seed SUPER_ADMIN role, Platform Administration Tenant, and default administrator user
-- Role ID: e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99
-- Tenant ID: e5afcc88-5c4b-4df8-bb6d-6bb9bd380111
-- Company ID: e5afcc88-5c4b-4df8-bb6d-6bb9bd380222
-- User ID: e5afcc88-5c4b-4df8-bb6d-6bb9bd380333
-- Subscription ID: e5afcc88-5c4b-4df8-bb6d-6bb9bd380444
-- Settings ID: e5afcc88-5c4b-4df8-bb6d-6bb9bd380666
-- Usage ID: e5afcc88-5c4b-4df8-bb6d-6bb9bd380777
-- Membership ID: e5afcc88-5c4b-4df8-bb6d-6bb9bd380555

-- 1. Seed SUPER_ADMIN role
INSERT INTO roles (id, name, description, permissions_json) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'SUPER_ADMIN', 'Global Platform Super Administrator', '["all"]')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed Platform administration Tenant
INSERT INTO tenants (id, name, subscription_plan, subscription_status, max_users, max_storage) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'EventOS Administration', 'ENTERPRISE', 'ACTIVE', 9999, 1099511627776)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Enterprise Subscription for Platform Workspace (references enterprise plan 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55')
INSERT INTO subscriptions (id, tenant_id, plan_id, status, current_period_start, current_period_end) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380444', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'ACTIVE', NOW(), NOW() + interval '100 years')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed system company
INSERT INTO companies (id, tenant_id, name) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'EventOS HQ')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed default admin user (password: 'admin123', BCrypt hashed)
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380333', 'SaaS', 'Developer', 'admin@eventos.com', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE)
ON CONFLICT (email) DO NOTHING;

-- 6. Seed user membership to Platform Workspace under the SUPER_ADMIN role
INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380555', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380333', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 7. Seed workspace settings
INSERT INTO workspace_settings (id, tenant_id, custom_domain, custom_domain_verified, white_label_enabled) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380666', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'admin.eventos.com', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 8. Seed tenant usages
INSERT INTO tenant_usages (id, tenant_id, users_count, storage_bytes, gallery_uploads, events_count, leads_count, billing_period_start, billing_period_end) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380777', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 1, 0, 0, 0, 0, NOW(), NOW() + interval '1 month')
ON CONFLICT (id) DO NOTHING;
