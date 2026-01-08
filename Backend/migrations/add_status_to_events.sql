-- Add status column to events table
-- This column is required for the event approval workflow

ALTER TABLE events 
ADD COLUMN status VARCHAR(20) DEFAULT 'active' AFTER location;

-- Update existing events to have 'active' status
UPDATE events SET status = 'active' WHERE status IS NULL;
