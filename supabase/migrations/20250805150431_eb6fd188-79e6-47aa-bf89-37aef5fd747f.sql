-- Change default status for exporters to 'active' so they can immediately make applications
ALTER TABLE public.exporters ALTER COLUMN status SET DEFAULT 'active';

-- Update existing exporters to active status
UPDATE public.exporters SET status = 'active' WHERE status = 'pending';