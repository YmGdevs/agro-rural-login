-- Add agrodealer to the app_role enum
ALTER TYPE public.app_role ADD VALUE 'agrodealer';

-- Add redemption fields to vouchers table
ALTER TABLE public.vouchers 
ADD COLUMN redeemed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN redeemed_by UUID REFERENCES public.profiles(id);

-- Create RLS policies for agrodealers to view vouchers
CREATE POLICY "Agrodealers can view all vouchers" 
ON public.vouchers 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['agrodealer'::app_role, 'admin'::app_role]));

-- Create policy for agrodealers to update vouchers (mark as redeemed)
CREATE POLICY "Agrodealers can update vouchers to mark as redeemed" 
ON public.vouchers 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['agrodealer'::app_role, 'admin'::app_role]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['agrodealer'::app_role, 'admin'::app_role]));