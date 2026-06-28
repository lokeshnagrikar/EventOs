-- Rename event_tasks table to timeline_tasks to match requirements
ALTER TABLE event_tasks RENAME TO timeline_tasks;

-- Rename foreign key constraint (if exists) or indices
ALTER INDEX IF EXISTS IDX_event_tasks_event RENAME TO IDX_timeline_tasks_event;
ALTER INDEX IF EXISTS IDX_event_tasks_tenant RENAME TO IDX_timeline_tasks_tenant;
