-- Migration V33: Ensure all system administrative and pre-seeded accounts have email verified
UPDATE users 
SET is_email_verified = TRUE 
WHERE email IN (
    'admin@eventos.com',
    'operations@eventos.co',
    'support_agent@eventos.co',
    'finance_admin@eventos.co',
    'developer@eventos.co',
    'auditor@eventos.co'
) OR email LIKE '%@eventos.com' OR email LIKE '%@eventos.co';
