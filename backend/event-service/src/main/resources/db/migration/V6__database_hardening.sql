-- Index definitions for database hardening
CREATE INDEX IF NOT EXISTS IDX_bookings_lead ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS IDX_event_assignments_user ON event_assignments(user_id);
