-- Drop the old global unique constraint on quote_number
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_quote_number_key;

-- Add composite unique constraint
ALTER TABLE quotes ADD CONSTRAINT uq_quotes_tenant_number UNIQUE (tenant_id, quote_number);

-- Add columns for optimistic locking and versioning
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS parent_quote_id UUID;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1;

-- Add index to parent_quote_id for performance
CREATE INDEX IF NOT EXISTS idx_quotes_parent ON quotes(parent_quote_id);
