-- Migration V13: Seed Super Admin sub-role users for local testing
-- All users are assigned under the SUPER_ADMIN role with password 'admin123'

-- 1. Seed Operations Admin (operations@eventos.co)
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380b01', 'Operations', 'Admin', 'operations@eventos.co', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380c01', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b01', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Support Agent (support_agent@eventos.co)
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380b02', 'Support', 'Agent', 'support_agent@eventos.co', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380c02', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b02', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Finance Admin (finance_admin@eventos.co)
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380b03', 'Finance', 'Admin', 'finance_admin@eventos.co', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380c03', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b03', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Developer (developer@eventos.co)
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380b04', 'Developer', 'Admin', 'developer@eventos.co', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380c04', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b04', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Auditor (auditor@eventos.co)
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380b05', 'Auditor', 'Admin', 'auditor@eventos.co', '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O', 'ACTIVE', FALSE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status) VALUES
('e5afcc88-5c4b-4df8-bb6d-6bb9bd380c05', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b05', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222', 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
