-- 1. Insert/Update SUPER_ADMIN role
INSERT INTO roles (id, name, description, permissions_json) VALUES 
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'SUPER_ADMIN', 'Global Platform Super Administrator', '["all"]') 
ON CONFLICT (name) DO UPDATE SET permissions_json = EXCLUDED.permissions_json;

-- 2. Insert/Update administration Tenant
INSERT INTO tenants (id, name, subscription_plan, subscription_status, max_users, max_storage) VALUES 
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'EventOS Administration', 'ENTERPRISE', 'ACTIVE', 9999, 1099511627776) 
ON CONFLICT (id) DO NOTHING;

-- 3. Insert/Update system company
INSERT INTO companies (id, tenant_id, name) VALUES 
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'EventOS HQ') 
ON CONFLICT (id) DO NOTHING;

-- 4. Force seed/reset main admin user (admin@eventos.com) - explicitly setting email verified
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted, is_email_verified, password_updated_at) VALUES 
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380333', 'SaaS', 'Developer', 'admin@eventos.com', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE, TRUE, NOW()) 
ON CONFLICT (email) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  status = 'ACTIVE',
  is_deleted = FALSE,
  is_email_verified = TRUE,
  password_updated_at = NOW();

-- 5. Force seed/reset main membership
INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status) VALUES 
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380555', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380333', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'ACTIVE') 
ON CONFLICT (id) DO UPDATE SET 
  user_id = EXCLUDED.user_id,
  tenant_id = EXCLUDED.tenant_id,
  company_id = EXCLUDED.company_id,
  role_id = EXCLUDED.role_id,
  status = 'ACTIVE';

-- 6. Seed/Reset sub-roles (Operations, Support, Finance, Developer, Auditor) - explicitly setting email verified
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted, is_email_verified, password_updated_at) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380b01', 'Operations', 'Admin', 'operations@eventos.co', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE, TRUE, NOW()),
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380b02', 'Support', 'Agent', 'support_agent@eventos.co', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE, TRUE, NOW()),
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380b03', 'Finance', 'Admin', 'finance_admin@eventos.co', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE, TRUE, NOW()),
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380b04', 'Developer', 'Admin', 'developer@eventos.co', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE, TRUE, NOW()),
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380b05', 'Auditor', 'Admin', 'auditor@eventos.co', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE, TRUE, NOW()),
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380b99', 'Jane', 'Client', 'client@eventos.co', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE, TRUE, NOW())
ON CONFLICT (email) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  status = 'ACTIVE',
  is_deleted = FALSE,
  is_email_verified = TRUE,
  password_updated_at = NOW();

INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380c01', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b01', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'ACTIVE'),
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380c02', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b02', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'ACTIVE'),
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380c03', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b03', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'ACTIVE'),
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380c04', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b04', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'ACTIVE'),
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380c05', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b05', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'ACTIVE'),
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380c99', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b99', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', (SELECT id FROM roles WHERE name = 'CLIENT' LIMIT 1), 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE';

-- 7. Workspace settings & usages
INSERT INTO workspace_settings (id, tenant_id, custom_domain, custom_domain_verified, white_label_enabled) VALUES 
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380666', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'admin.eventos.com', TRUE, TRUE) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_usages (id, tenant_id, users_count, storage_bytes, gallery_uploads, events_count, leads_count, billing_period_start, billing_period_end) VALUES 
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380777', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 1, 0, 0, 0, 0, NOW(), NOW() + interval '1 month') 
ON CONFLICT (id) DO NOTHING;
