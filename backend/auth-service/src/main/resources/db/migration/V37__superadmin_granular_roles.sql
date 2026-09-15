-- ============================================================================
-- Migration V37: Register granular SuperAdmin platform roles and assign sub-role users
-- Phase 2E Security Hardening: Granular Server-Side SuperAdmin RBAC
-- ============================================================================

-- 1. Insert granular platform roles into the roles table
INSERT INTO roles (id, name, description, permissions_json)
VALUES 
    ('e5afcc88-5c4b-4df8-bb6d-6bb9bd380a01', 'OPERATIONS_LEAD', 'Platform Operations Lead', 
     '["admin:read", "tenant:read", "tenant:write", "tenant:user:status", "user:read", "announcements:read", "announcements:write", "audit:read"]'),
    ('e5afcc88-5c4b-4df8-bb6d-6bb9bd380a02', 'SUPPORT_LEAD', 'Platform Support Lead', 
     '["admin:read", "tenant:read", "user:read", "user:password-reset", "announcements:read", "audit:read"]'),
    ('e5afcc88-5c4b-4df8-bb6d-6bb9bd380a03', 'FINANCE_OFFICER', 'Platform Finance Officer', 
     '["admin:read", "tenant:read", "billing:read", "billing:write", "audit:read"]'),
    ('e5afcc88-5c4b-4df8-bb6d-6bb9bd380a04', 'DEVOPS_ENGINEER', 'Platform DevOps Engineer', 
     '["admin:read", "telemetry:read", "audit:read"]'),
    ('e5afcc88-5c4b-4df8-bb6d-6bb9bd380a05', 'COMPLIANCE_AUDITOR', 'Platform Compliance Auditor', 
     '["admin:read", "tenant:read", "user:read", "billing:read", "blacklist:read", "announcements:read", "audit:read", "telemetry:read"]')
ON CONFLICT (name) DO UPDATE 
SET permissions_json = EXCLUDED.permissions_json,
    description = EXCLUDED.description;

-- 2. Update memberships for seeded platform sub-role users in the administration tenant
-- Operations Lead
UPDATE memberships 
SET role_id = 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a01'
WHERE tenant_id = 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111'
  AND user_id IN (SELECT id FROM users WHERE email IN ('operations@eventosapp.in', 'operations@eventos.co'));

-- Support Lead
UPDATE memberships 
SET role_id = 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a02'
WHERE tenant_id = 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111'
  AND user_id IN (SELECT id FROM users WHERE email IN ('support_agent@eventosapp.in', 'support_agent@eventos.co'));

-- Finance Officer
UPDATE memberships 
SET role_id = 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a03'
WHERE tenant_id = 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111'
  AND user_id IN (SELECT id FROM users WHERE email IN ('finance_admin@eventosapp.in', 'finance_admin@eventos.co'));

-- DevOps Engineer
UPDATE memberships 
SET role_id = 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a04'
WHERE tenant_id = 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111'
  AND user_id IN (SELECT id FROM users WHERE email IN ('developer@eventosapp.in', 'developer@eventos.co'));

-- Compliance Auditor
UPDATE memberships 
SET role_id = 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380a05'
WHERE tenant_id = 'e5afcc88-5c4b-4df8-bb6d-6bb9bd380111'
  AND user_id IN (SELECT id FROM users WHERE email IN ('auditor@eventosapp.in', 'auditor@eventos.co'));
