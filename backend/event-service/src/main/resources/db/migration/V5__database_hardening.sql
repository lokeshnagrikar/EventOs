-- Drop the global unique constraint on bookings(booking_number)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_number_key;

-- Add composite unique constraint on bookings(tenant_id, booking_number)
ALTER TABLE bookings ADD CONSTRAINT UK_bookings_tenant_number UNIQUE (tenant_id, booking_number);

-- Drop the global unique constraint on invoices(invoice_number)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;

-- Add composite unique constraint on invoices(tenant_id, invoice_number)
ALTER TABLE invoices ADD CONSTRAINT UK_invoices_tenant_number UNIQUE (tenant_id, invoice_number);

-- Create tenant_sequences table
CREATE TABLE tenant_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    sequence_type VARCHAR(100) NOT NULL,
    current_value BIGINT NOT NULL,
    CONSTRAINT UK_tenant_sequences_type UNIQUE (tenant_id, sequence_type)
);

-- Index for sequence lookup
CREATE INDEX IDX_tenant_sequences_lookup ON tenant_sequences(tenant_id, sequence_type);

-- Add missing foreign key references
ALTER TABLE payments ADD CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- Hardened tenant lookup indexes
CREATE INDEX IF NOT EXISTS IDX_bookings_tenant_lookup ON bookings(tenant_id, booking_number);
CREATE INDEX IF NOT EXISTS IDX_invoices_tenant_lookup ON invoices(tenant_id, invoice_number);
