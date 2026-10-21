-- V10__add_share_link_revocation.sql
-- Add revocation tracking columns to share_links table and add indexes

ALTER TABLE share_links ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS IDX_share_links_expires_at ON share_links(expires_at);
CREATE INDEX IF NOT EXISTS IDX_share_links_is_revoked ON share_links(is_revoked);
