-- Add milestone column to event_timeline_items
ALTER TABLE event_timeline_items ADD COLUMN IF NOT EXISTS milestone VARCHAR(50) DEFAULT 'PLANNING';
ALTER TABLE event_timeline_items ALTER COLUMN milestone SET NOT NULL;

-- Add priority and status columns to timeline_tasks
ALTER TABLE timeline_tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'MEDIUM';
ALTER TABLE timeline_tasks ALTER COLUMN priority SET NOT NULL;

ALTER TABLE timeline_tasks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'TODO';
UPDATE timeline_tasks SET status = 'COMPLETED' WHERE completed = TRUE;
ALTER TABLE timeline_tasks ALTER COLUMN status SET NOT NULL;
