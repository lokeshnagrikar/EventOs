-- Alter bookings table to store quote reference
ALTER TABLE bookings ADD COLUMN quote_id UUID;

-- Create Booking Audit Logs Table
CREATE TABLE booking_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    changed_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Booking Assignments Table
CREATE TABLE booking_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    resource_name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index lookup performance optimization
CREATE INDEX IDX_booking_audit_logs_booking ON booking_audit_logs(booking_id);
CREATE INDEX IDX_booking_assignments_booking ON booking_assignments(booking_id);
