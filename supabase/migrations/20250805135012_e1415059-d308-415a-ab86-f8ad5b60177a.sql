-- Fix RLS policy for exporters table to allow inserts during signup process
DROP POLICY IF EXISTS "Users can create exporter profile" ON public.exporters;

-- Create a more permissive policy for INSERT that allows creation during signup
CREATE POLICY "Allow exporter profile creation during signup" 
ON public.exporters 
FOR INSERT 
WITH CHECK (
  -- Allow if the user_id matches the current auth user OR if it's a service role
  user_id = auth.uid() OR auth.role() = 'service_role'
);

-- Also ensure the existing policies work correctly
DROP POLICY IF EXISTS "Exporters can view their own data" ON public.exporters;
CREATE POLICY "Exporters can view their own data" 
ON public.exporters 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Exporters can update their own data" ON public.exporters;
CREATE POLICY "Exporters can update their own data" 
ON public.exporters 
FOR UPDATE 
USING (user_id = auth.uid());