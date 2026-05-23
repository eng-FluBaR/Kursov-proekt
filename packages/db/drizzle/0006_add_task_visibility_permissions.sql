-- Migration: Add task visibility permissions table
-- This allows admins to grant permission for users to view other users' tasks
-- Table structure: grantor_id (admin), viewer_id (user who can view), subject_id (user whose tasks are visible)

CREATE TABLE IF NOT EXISTS task_visibility_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grantor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_permissions_grantor_id ON task_visibility_permissions(grantor_id);
CREATE INDEX idx_permissions_viewer_id ON task_visibility_permissions(viewer_id);
CREATE INDEX idx_permissions_subject_id ON task_visibility_permissions(subject_id);
CREATE INDEX idx_permissions_unique ON task_visibility_permissions(viewer_id, subject_id);

-- Add unique constraint to prevent duplicate permissions
ALTER TABLE task_visibility_permissions ADD CONSTRAINT unique_viewer_subject UNIQUE(viewer_id, subject_id);
