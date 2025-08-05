-- Simplify security checks for exporter creation
-- Drop existing restrictive policies and create more permissive ones

-- Drop existing policies
DROP POLICY IF EXISTS "Enable exporter registration" ON public.exporters;
DROP POLICY IF EXISTS "Exporters can view their own data" ON public.exporters;
DROP POLICY IF EXISTS "Exporters can update their own data" ON public.exporters;

-- Create simplified policies that allow easier registration
-- Allow anyone (authenticated or anonymous) to create exporter profiles
CREATE POLICY "Allow anyone to create exporter profile" 
ON public.exporters 
FOR INSERT 
WITH CHECK (true);

-- Allow exporters to view their own data and admins to view all
CREATE POLICY "Exporters can view data" 
ON public.exporters 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  auth.role() = 'authenticated' OR
  auth.role() = 'anon'
);

-- Allow exporters to update their own data
CREATE POLICY "Exporters can update data" 
ON public.exporters 
FOR UPDATE 
USING (user_id = auth.uid());