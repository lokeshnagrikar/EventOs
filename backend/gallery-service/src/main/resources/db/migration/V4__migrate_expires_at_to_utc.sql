-- Alter expires_at to be timezone aware
ALTER TABLE share_links ALTER COLUMN expires_at TYPE TIMESTAMP WITH TIME ZONE;
