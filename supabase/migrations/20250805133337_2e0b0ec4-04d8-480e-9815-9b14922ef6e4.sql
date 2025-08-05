-- Extend app_role enum to include exportador
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'exportador';

-- Create exporters table
CREATE TABLE public.exporters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_nuit TEXT NOT NULL UNIQUE,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  export_products TEXT[], -- Array of products they want to export
  company_address TEXT,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create export_documents table for document uploads
CREATE TABLE public.export_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exporter_id UUID NOT NULL REFERENCES public.exporters(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('commercial_license', 'phytosanitary_certificate', 'company_registration', 'tax_clearance', 'other')),
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create export_applications table for certification requests
CREATE TABLE public.export_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exporter_id UUID NOT NULL REFERENCES public.exporters(id) ON DELETE CASCADE,
  application_type TEXT NOT NULL DEFAULT 'certification' CHECK (application_type IN ('certification', 'renewal')),
  products TEXT[] NOT NULL, -- Specific products for this application
  destination_country TEXT NOT NULL,
  quantity_kg NUMERIC,
  estimated_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'expired')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_comments TEXT,
  approval_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create export_certificates table
CREATE TABLE public.export_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.export_applications(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  certificate_type TEXT NOT NULL DEFAULT 'export' CHECK (certificate_type IN ('export', 'phytosanitary', 'quality')),
  issued_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  issued_by UUID NOT NULL REFERENCES public.profiles(id),
  certificate_pdf_url TEXT,
  qr_code_data TEXT, -- For verification
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.exporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exporters table
CREATE POLICY "Exporters can view their own data" ON public.exporters
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Exporters can update their own data" ON public.exporters
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can create exporter profile" ON public.exporters
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all exporters" ON public.exporters
  FOR SELECT USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all exporters" ON public.exporters
  FOR UPDATE USING (get_current_user_role() = 'admin');

-- RLS Policies for export_documents table
CREATE POLICY "Exporters can view their own documents" ON public.export_documents
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.exporters e 
    WHERE e.id = export_documents.exporter_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "Exporters can upload their own documents" ON public.export_documents
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.exporters e 
    WHERE e.id = export_documents.exporter_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all export documents" ON public.export_documents
  FOR SELECT USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update export documents" ON public.export_documents
  FOR UPDATE USING (get_current_user_role() = 'admin');

-- RLS Policies for export_applications table
CREATE POLICY "Exporters can view their own applications" ON public.export_applications
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.exporters e 
    WHERE e.id = export_applications.exporter_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "Exporters can create applications" ON public.export_applications
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.exporters e 
    WHERE e.id = export_applications.exporter_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all applications" ON public.export_applications
  FOR SELECT USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update applications" ON public.export_applications
  FOR UPDATE USING (get_current_user_role() = 'admin');

-- RLS Policies for export_certificates table
CREATE POLICY "Exporters can view their own certificates" ON public.export_certificates
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.export_applications ea
    JOIN public.exporters e ON e.id = ea.exporter_id
    WHERE ea.id = export_certificates.application_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all certificates" ON public.export_certificates
  FOR ALL USING (get_current_user_role() = 'admin');

-- Create function to generate certificate numbers
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  today_str TEXT;
  sequence_num INTEGER;
  new_cert_number TEXT;
BEGIN
  -- Get today's date in YYYYMMDD format
  today_str := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(
    CASE 
      WHEN c.certificate_number LIKE 'EXP-' || today_str || '-%' 
      THEN CAST(RIGHT(c.certificate_number, 4) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_num
  FROM export_certificates c
  WHERE c.certificate_number LIKE 'EXP-' || today_str || '-%';
  
  -- Generate the certificate number
  new_cert_number := 'EXP-' || today_str || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_cert_number;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_exporters_updated_at
  BEFORE UPDATE ON public.exporters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_export_documents_updated_at
  BEFORE UPDATE ON public.export_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_export_applications_updated_at
  BEFORE UPDATE ON public.export_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_export_certificates_updated_at
  BEFORE UPDATE ON public.export_certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for export documents
INSERT INTO storage.buckets (id, name, public) VALUES ('export-documents', 'export-documents', false);

-- Create storage policies
CREATE POLICY "Exporters can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'export-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Exporters can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'export-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all export documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'export-documents' AND
    get_current_user_role() = 'admin'
  );