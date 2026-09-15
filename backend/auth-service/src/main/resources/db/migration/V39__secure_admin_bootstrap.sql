-- Migration V39: Secure Administrative Credential Bootstrap
-- Eliminates publicly-known seeded passwords (admin123) from all administrative accounts.
-- Transistions affected accounts to 'PENDING_SETUP' status with cryptographically locked password hashes.
-- Requires single-use secure environment-key bootstrap or explicit password-reset flow before account can be used.

-- 1. Invalidate passwords and set status to PENDING_SETUP for all seeded administrative accounts
UPDATE users
SET status = 'PENDING_SETUP',
    password_hash = '!LOCKED_PENDING_BOOTSTRAP_' || md5(random()::text || clock_timestamp()::text),
    password_updated_at = NOW(),
    updated_at = NOW()
WHERE email IN (
    'admin@eventosapp.in',
    'operations@eventosapp.in',
    'support_agent@eventosapp.in',
    'finance_admin@eventosapp.in',
    'developer@eventosapp.in',
    'auditor@eventosapp.in',
    'admin@eventos.com'
)
OR password_hash = '$2a$12$K5PbXeTkRuCkmLqtlXmZQegsXWQIghasY/iNKXY4kyEsEe3dpdr5O';

-- 2. Invalidate all pre-existing sessions for locked administrative accounts
DELETE FROM sessions 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email IN (
        'admin@eventosapp.in',
        'operations@eventosapp.in',
        'support_agent@eventosapp.in',
        'finance_admin@eventosapp.in',
        'developer@eventosapp.in',
        'auditor@eventosapp.in',
        'admin@eventos.com'
    )
    OR password_hash LIKE '!LOCKED_PENDING_BOOTSTRAP_%'
);

-- 3. Invalidate all pre-existing refresh tokens for locked administrative accounts
DELETE FROM refresh_tokens 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email IN (
        'admin@eventosapp.in',
        'operations@eventosapp.in',
        'support_agent@eventosapp.in',
        'finance_admin@eventosapp.in',
        'developer@eventosapp.in',
        'auditor@eventosapp.in',
        'admin@eventos.com'
    )
    OR password_hash LIKE '!LOCKED_PENDING_BOOTSTRAP_%'
);
