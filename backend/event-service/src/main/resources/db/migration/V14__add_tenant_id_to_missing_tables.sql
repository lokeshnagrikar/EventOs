-- Add tenant_id column to tables missing it
ALTER TABLE event_assignments ADD COLUMN tenant_id UUID;
ALTER TABLE event_timeline_items ADD COLUMN tenant_id UUID;
ALTER TABLE booking_timeline_events ADD COLUMN tenant_id UUID;
ALTER TABLE event_tasks ADD COLUMN tenant_id UUID;
ALTER TABLE booking_audit_logs ADD COLUMN tenant_id UUID;
ALTER TABLE booking_assignments ADD COLUMN tenant_id UUID;

-- Backfill tenant_id from parent records
UPDATE event_assignments ea 
SET tenant_id = e.tenant_id 
FROM events e 
WHERE ea.event_id = e.id;

UPDATE event_timeline_items eti 
SET tenant_id = e.tenant_id 
FROM events e 
WHERE eti.event_id = e.id;

UPDATE booking_timeline_events bte 
SET tenant_id = b.tenant_id 
FROM bookings b 
WHERE bte.booking_id = b.id;

UPDATE event_tasks et 
SET tenant_id = e.tenant_id 
FROM events e 
WHERE et.event_id = e.id;

UPDATE booking_audit_logs bal 
SET tenant_id = b.tenant_id 
FROM bookings b 
WHERE bal.booking_id = b.id;

UPDATE booking_assignments ba 
SET tenant_id = b.tenant_id 
FROM bookings b 
WHERE ba.booking_id = b.id;

-- Apply NOT NULL constraints after backfilling
ALTER TABLE event_assignments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE event_timeline_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE booking_timeline_events ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE event_tasks ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE booking_audit_logs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE booking_assignments ALTER COLUMN tenant_id SET NOT NULL;

-- Create indexes on tenant_id for optimized query filtering
CREATE INDEX IDX_event_assignments_tenant ON event_assignments(tenant_id);
CREATE INDEX IDX_event_timeline_items_tenant ON event_timeline_items(tenant_id);
CREATE INDEX IDX_booking_timeline_events_tenant ON booking_timeline_events(tenant_id);
CREATE INDEX IDX_event_tasks_tenant ON event_tasks(tenant_id);
CREATE INDEX IDX_booking_audit_logs_tenant ON booking_audit_logs(tenant_id);
CREATE INDEX IDX_booking_assignments_tenant ON booking_assignments(tenant_id);
