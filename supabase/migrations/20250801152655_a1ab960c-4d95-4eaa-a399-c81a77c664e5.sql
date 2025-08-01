-- Remove the problematic trigger that's causing RLS violation
DROP TRIGGER IF EXISTS trigger_update_regional_capacity ON loan_requests;

-- Also update the RLS policy for regional_capacity to allow inserts by authenticated users
DROP POLICY IF EXISTS "Admins can manage regional capacity" ON regional_capacity;

CREATE POLICY "Admins can manage regional capacity" 
ON regional_capacity 
FOR ALL 
USING (get_current_user_role() = 'admin'::app_role)
WITH CHECK (get_current_user_role() = 'admin'::app_role);

-- Allow authenticated users to insert/update regional capacity stats
CREATE POLICY "System can update regional capacity stats" 
ON regional_capacity 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "System can update existing regional capacity stats" 
ON regional_capacity 
FOR UPDATE 
USING (auth.role() = 'authenticated');