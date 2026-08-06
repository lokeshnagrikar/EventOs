-- Migration V15: Update BCrypt password hash for Super Admin accounts to match 'admin123'
-- Hash: $2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a (Valid BCrypt for 'admin123')

UPDATE users 
SET password_hash = '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.AQubh4a' 
WHERE email IN (
    'admin@eventos.com',
    'operations@eventos.co',
    'support_agent@eventos.co',
    'finance_admin@eventos.co',
    'developer@eventos.co',
    'auditor@eventos.co'
);
