-- Migration V35: Register official custom domain superadmin & operational sub-role accounts under @eventosapp.in
-- Password for all accounts: 'admin123' ($2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O)
-- Role: SUPER_ADMIN (e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99)
-- Tenant: EventOS Administration (e5afcc88-5c4b-4df8-bb6d-6bb9bd380111)
-- Company: EventOS HQ (e5afcc88-5c4b-4df8-bb6d-6bb9bd380222)

-- 1. Root Super Admin (admin@eventosapp.in)
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted, is_email_verified)
VALUES (
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380399',
    'EventOS',
    'SuperAdmin',
    'admin@eventosapp.in',
    '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    'ACTIVE',
    FALSE,
    TRUE
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    status = 'ACTIVE',
    is_email_verified = TRUE;

INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status)
VALUES (
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380599',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380399',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Operations Admin (operations@eventosapp.in)
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted, is_email_verified)
VALUES (
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b11',
    'Operations',
    'Admin',
    'operations@eventosapp.in',
    '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    'ACTIVE',
    FALSE,
    TRUE
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    status = 'ACTIVE',
    is_email_verified = TRUE;

INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status)
VALUES (
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380c11',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b11',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Support Agent (support_agent@eventosapp.in)
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted, is_email_verified)
VALUES (
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b12',
    'Support',
    'Agent',
    'support_agent@eventosapp.in',
    '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    'ACTIVE',
    FALSE,
    TRUE
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    status = 'ACTIVE',
    is_email_verified = TRUE;

INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status)
VALUES (
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380c12',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b12',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Finance Admin (finance_admin@eventosapp.in)
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted, is_email_verified)
VALUES (
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b13',
    'Finance',
    'Admin',
    'finance_admin@eventosapp.in',
    '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    'ACTIVE',
    FALSE,
    TRUE
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    status = 'ACTIVE',
    is_email_verified = TRUE;

INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status)
VALUES (
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380c13',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b13',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Developer Admin (developer@eventosapp.in)
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted, is_email_verified)
VALUES (
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b14',
    'Developer',
    'Admin',
    'developer@eventosapp.in',
    '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    'ACTIVE',
    FALSE,
    TRUE
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    status = 'ACTIVE',
    is_email_verified = TRUE;

INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status)
VALUES (
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380c14',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b14',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Compliance Auditor (auditor@eventosapp.in)
INSERT INTO users (id, first_name, last_name, email, password_hash, status, is_deleted, is_email_verified)
VALUES (
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b15',
    'Auditor',
    'Admin',
    'auditor@eventosapp.in',
    '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    'ACTIVE',
    FALSE,
    TRUE
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    status = 'ACTIVE',
    is_email_verified = TRUE;

INSERT INTO memberships (id, user_id, tenant_id, company_id, role_id, status)
VALUES (
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380c15',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380b15',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380222',
    'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a99',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;
