-- Alter payments to add invoice association
ALTER TABLE payments ADD COLUMN invoice_id UUID;

-- Alter invoices to add paid amount tracking
ALTER TABLE invoices ADD COLUMN paid_amount DECIMAL(15, 2) DEFAULT 0.00;

-- Create transactions table (financial ledger entries)
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    booking_id UUID,
    invoice_id UUID,
    payment_id UUID,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- CREDIT, DEBIT, REFUND
    description VARCHAR(500),
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance and isolation boundaries
CREATE INDEX IDX_transactions_tenant ON transactions(tenant_id);
CREATE INDEX IDX_transactions_invoice ON transactions(invoice_id);
CREATE INDEX IDX_payments_invoice ON payments(invoice_id);
