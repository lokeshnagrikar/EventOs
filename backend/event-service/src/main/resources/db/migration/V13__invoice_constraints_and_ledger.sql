-- Drop the global unique constraint on invoice_number
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;

-- Add composite unique constraint on (tenant_id, invoice_number)
ALTER TABLE invoices ADD CONSTRAINT uq_invoices_tenant_number UNIQUE (tenant_id, invoice_number);

-- Alter financial columns to NUMERIC(19,4) for precise monetary representation
ALTER TABLE invoices ALTER COLUMN subtotal TYPE NUMERIC(19,4);
ALTER TABLE invoices ALTER COLUMN tax TYPE NUMERIC(19,4);
ALTER TABLE invoices ALTER COLUMN discount TYPE NUMERIC(19,4);
ALTER TABLE invoices ALTER COLUMN total_amount TYPE NUMERIC(19,4);
ALTER TABLE invoices ALTER COLUMN paid_amount TYPE NUMERIC(19,4);

ALTER TABLE payments ALTER COLUMN amount TYPE NUMERIC(19,4);
ALTER TABLE transactions ALTER COLUMN amount TYPE NUMERIC(19,4);

-- Add voiding audit columns to payments table
ALTER TABLE payments ADD COLUMN voided_by UUID;
ALTER TABLE payments ADD COLUMN voided_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN void_reason VARCHAR(500);

-- Add voiding audit columns to invoices table
ALTER TABLE invoices ADD COLUMN voided_by UUID;
ALTER TABLE invoices ADD COLUMN voided_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN void_reason VARCHAR(500);
