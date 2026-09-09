-- V32__add_whatsapp_config_to_companies.sql
-- Add WhatsApp Meta Cloud API configuration payload to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS whatsapp_config TEXT;
