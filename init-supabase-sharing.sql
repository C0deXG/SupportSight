-- Add client_note and is_shared columns to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS client_note TEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- Create index for faster retrieval of shared issues
CREATE INDEX IF NOT EXISTS idx_issues_is_shared ON issues(is_shared);

-- Update RLS policies to handle public access to shared issues
CREATE POLICY "Public can view shared issues"
ON issues
FOR SELECT
TO anon
USING (is_shared = true);

-- No changes needed to the existing policies for authenticated users, 
-- as they should already have access to read/write all issues they own 