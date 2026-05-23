CREATE TABLE IF NOT EXISTS job_visibility_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grantor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_permissions_grantor_id ON job_visibility_permissions(grantor_id);
CREATE INDEX IF NOT EXISTS idx_job_permissions_viewer_id ON job_visibility_permissions(viewer_id);
CREATE INDEX IF NOT EXISTS idx_job_permissions_job_id ON job_visibility_permissions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_permissions_unique ON job_visibility_permissions(viewer_id, job_id);

ALTER TABLE job_visibility_permissions
  ADD CONSTRAINT unique_viewer_job UNIQUE(viewer_id, job_id);
