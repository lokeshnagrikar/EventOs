-- Add primary_color and secondary_color columns to companies table
ALTER TABLE companies ADD COLUMN primary_color VARCHAR(50) DEFAULT '#9333ea';
ALTER TABLE companies ADD COLUMN secondary_color VARCHAR(50) DEFAULT '#18181b';
