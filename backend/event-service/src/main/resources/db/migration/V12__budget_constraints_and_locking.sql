-- Add lead_id, quote_id and version columns to budget_estimates table
ALTER TABLE budget_estimates ADD COLUMN lead_id UUID;
ALTER TABLE budget_estimates ADD COLUMN quote_id UUID;
ALTER TABLE budget_estimates ADD COLUMN version INT NOT NULL DEFAULT 0;
