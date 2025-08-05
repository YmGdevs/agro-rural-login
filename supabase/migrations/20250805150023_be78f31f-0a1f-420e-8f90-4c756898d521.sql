-- Remove the unique constraint on company_nuit to allow multiple exporters during registration
-- This allows exporters to complete their profile gradually
ALTER TABLE public.exporters DROP CONSTRAINT IF EXISTS exporters_company_nuit_key;

-- Add a partial unique index that only applies to non-empty NUIT values
-- This ensures uniqueness for actual NUIT numbers while allowing empty values during registration
CREATE UNIQUE INDEX IF NOT EXISTS exporters_company_nuit_unique 
ON public.exporters (company_nuit) 
WHERE company_nuit IS NOT NULL AND company_nuit != '';