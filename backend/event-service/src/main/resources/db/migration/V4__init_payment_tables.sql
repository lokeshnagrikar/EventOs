-- Create Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESSFUL',
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_payments_tenant ON payments(tenant_id);
CREATE INDEX IDX_payments_booking ON payments(booking_id);

-- Create Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    due_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    billing_address VARCHAR(500),
    notes VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IDX_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IDX_invoices_booking ON invoices(booking_id);
