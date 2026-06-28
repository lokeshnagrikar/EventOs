-- Create Invoice History Table
CREATE TABLE invoice_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    action VARCHAR(255) NOT NULL,
    notes VARCHAR(1000),
    action_by VARCHAR(255),
    action_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for performance and isolation boundaries
CREATE INDEX IDX_invoice_history_tenant ON invoice_history(tenant_id);
CREATE INDEX IDX_invoice_history_invoice ON invoice_history(invoice_id);
