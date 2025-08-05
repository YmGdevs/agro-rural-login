-- First, let's see what status values are allowed by trying different approaches
-- Let's change the default to 'approved' instead of 'active'
ALTER TABLE public.exporters ALTER COLUMN status SET DEFAULT 'approved';

-- Update existing exporters to approved status
UPDATE public.exporters SET status = 'approved' WHERE status = 'pending';