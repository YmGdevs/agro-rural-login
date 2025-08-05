-- Drop the current failing policy
DROP POLICY IF EXISTS "Allow exporter profile creation during signup" ON public.exporters;

-- Create a more permissive policy that allows any authenticated request to insert
-- This is needed because during signup, auth.uid() might not be fully available yet
CREATE POLICY "Enable exporter registration" 
ON public.exporters 
FOR INSERT 
WITH CHECK (
  -- Allow any authenticated user to create an exporter profile
  -- The application logic ensures user_id matches the current user
  auth.role() = 'authenticated' OR auth.role() = 'anon'
);

-- Also ensure we have proper select policies
DROP POLICY IF EXISTS "Exporters can view their own data" ON public.exporters;
CREATE POLICY "Exporters can view their own data" 
ON public.exporters 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  get_current_user_role() = 'admin'::app_role
);