-- Add client_id and event_type columns to bookings table
ALTER TABLE bookings ADD COLUMN client_id UUID;
ALTER TABLE bookings ADD COLUMN event_type VARCHAR(100);
