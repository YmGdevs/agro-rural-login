-- Add new columns to export_applications table for certificate request form
ALTER TABLE public.export_applications 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS nuit_holder TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS license_document_url TEXT,
ADD COLUMN IF NOT EXISTS representative_name TEXT,
ADD COLUMN IF NOT EXISTS id_document_number TEXT,
ADD COLUMN IF NOT EXISTS id_issue_location TEXT,
ADD COLUMN IF NOT EXISTS id_issue_date DATE,
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS commercialization_provinces TEXT[],
ADD COLUMN IF NOT EXISTS districts TEXT[],
ADD COLUMN IF NOT EXISTS crops TEXT[],
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS signature_name TEXT,
ADD COLUMN IF NOT EXISTS signature_date DATE;