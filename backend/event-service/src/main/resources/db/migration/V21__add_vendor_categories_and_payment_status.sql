-- Add paid_amount and payment_status columns to vendor_contracts
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(19, 4) NOT NULL DEFAULT 0.00;
ALTER TABLE vendor_contracts ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'UNPAID';
