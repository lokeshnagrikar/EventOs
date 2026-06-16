-- Drop the global unique constraint on quotes(quote_number)
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_quote_number_key;

-- Add composite unique constraint on (tenant_id, quote_number)
ALTER TABLE quotes ADD CONSTRAINT UK_quotes_tenant_number UNIQUE (tenant_id, quote_number);

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

-- Index for quotes tenant lookup
CREATE INDEX IF NOT EXISTS IDX_quotes_tenant_lookup ON quotes(tenant_id, quote_number);
