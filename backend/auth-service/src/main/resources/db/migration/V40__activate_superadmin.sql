-- Migration V40: Restore and Activate Official Superadmin Accounts
-- Restores admin@eventosapp.in and administrative sub-roles to ACTIVE status with password 'admin123'
-- Password hash for 'admin123': $2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O

UPDATE users
SET status = 'ACTIVE',
    password_hash = '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O',
    password_updated_at = NOW(),
    updated_at = NOW(),
    is_email_verified = TRUE,
    is_deleted = FALSE
WHERE email IN (
    'admin@eventosapp.in',
    'operations@eventosapp.in',
    'support_agent@eventosapp.in',
    'finance_admin@eventosapp.in',
    'developer@eventosapp.in',
    'auditor@eventosapp.in'
);
