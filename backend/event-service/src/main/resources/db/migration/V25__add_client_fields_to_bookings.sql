-- Add client contact fields to bookings table to support client info on contracts/invoices
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_email VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_phone VARCHAR(50);
