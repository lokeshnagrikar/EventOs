-- Drop global unique constraint on booking_number if it exists (created implicitly by UNIQUE declaration)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_number_key;

-- Add composite unique constraint for tenant isolation on booking numbers
ALTER TABLE bookings ADD CONSTRAINT uq_bookings_tenant_number UNIQUE (tenant_id, booking_number);
