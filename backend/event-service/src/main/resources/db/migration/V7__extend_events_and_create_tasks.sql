-- Extend events table with venue details and guest management columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_name VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_address VARCHAR(500);
ALTER TABLE events ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS guest_list TEXT;

-- Create Event Tasks Table
CREATE TABLE IF NOT EXISTS event_tasks (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_user_id UUID,
    assigned_user_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for event isolation on tasks
CREATE INDEX IF NOT EXISTS IDX_event_tasks_event ON event_tasks(event_id);
