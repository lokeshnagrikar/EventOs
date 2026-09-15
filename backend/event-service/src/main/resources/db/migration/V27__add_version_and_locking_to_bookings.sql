-- Phase 2Q: Add version column to bookings table for optimistic concurrency control
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
