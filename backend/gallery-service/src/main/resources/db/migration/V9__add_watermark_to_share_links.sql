-- V9: Add watermark support to share links for unpaid client proofing
ALTER TABLE share_links
ADD COLUMN IF NOT EXISTS watermark BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS watermark_text VARCHAR(255);
