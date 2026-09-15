-- Migration V11: Add cryptographically random share_token column to quotes for secure public sharing
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS share_token VARCHAR(64);

-- Populate existing quotes with high-entropy unique share tokens
UPDATE quotes 
SET share_token = LOWER(REPLACE(CAST(uuid_generate_v4() AS VARCHAR), '-', ''))
WHERE share_token IS NULL;

-- Enforce NOT NULL constraint and unique index on share_token
ALTER TABLE quotes ALTER COLUMN share_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_share_token ON quotes(share_token);
