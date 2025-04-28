-- Enable RLS on tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Update project_status enum to include all statuses
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'planned';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Add progress tracking columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_percentage TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_hours TEXT;

-- Create policy for authenticated users to manage their own clients
CREATE POLICY "Users can manage their own clients"
ON clients
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for authenticated users to manage their projects
CREATE POLICY "Users can manage their own projects"
ON projects
FOR ALL
TO authenticated
USING (
  -- Projects they own directly
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = projects.client_id
    AND clients.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Can only create/update projects for clients they own
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = projects.client_id
    AND clients.user_id = auth.uid()
  )
);

-- Create policy for authenticated users to manage their issues
CREATE POLICY "Users can manage their own issues"
ON issues
FOR ALL
TO authenticated
USING (
  -- Issues for projects they own
  EXISTS (
    SELECT 1 FROM projects
    JOIN clients ON clients.id = projects.client_id
    WHERE projects.id = issues.project_id
    AND clients.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Can only create/update issues for projects they own
  EXISTS (
    SELECT 1 FROM projects
    JOIN clients ON clients.id = projects.client_id
    WHERE projects.id = issues.project_id
    AND clients.user_id = auth.uid()
  )
);

-- Create policy for public read access to projects
CREATE POLICY "Public can view projects"
ON projects
FOR SELECT
TO anon
USING (true); -- Allow read access to all projects

-- Create policy for public read access to issues
CREATE POLICY "Public can view issues"
ON issues
FOR SELECT
TO anon
USING (true); -- Allow read access to all issues

-- Create policy for public read access to client names (limited)
CREATE POLICY "Public can view client basic info"
ON clients
FOR SELECT
TO anon
USING (true); -- Allow read access to all clients

-- Make sure clients table has a user_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$; 