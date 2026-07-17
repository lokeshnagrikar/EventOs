-- Migration to update SaaS pricing tiers to INR with Indian Market competitive pricing
UPDATE plans SET price = 0.00, currency = 'INR' WHERE code = 'free_trial';
UPDATE plans SET price = 1999.00, currency = 'INR' WHERE code = 'starter';
UPDATE plans SET price = 5999.00, currency = 'INR' WHERE code = 'professional';
UPDATE plans SET price = 11999.00, currency = 'INR' WHERE code = 'business';
UPDATE plans SET price = 24999.00, currency = 'INR' WHERE code = 'enterprise';
