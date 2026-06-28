-- Create Event Days table
CREATE TABLE event_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    day_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Event Venues table
CREATE TABLE event_venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add booking_id column to events table to link event with booking
ALTER TABLE events ADD COLUMN booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Indexes for performance and isolation boundaries
CREATE INDEX IDX_event_days_event ON event_days(event_id);
CREATE INDEX IDX_event_days_tenant ON event_days(tenant_id);
CREATE INDEX IDX_event_venues_event ON event_venues(event_id);
CREATE INDEX IDX_event_venues_tenant ON event_venues(tenant_id);
CREATE INDEX IDX_events_booking ON events(booking_id);
