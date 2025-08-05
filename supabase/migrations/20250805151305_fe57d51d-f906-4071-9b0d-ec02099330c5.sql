-- Simplify policies for export-related tables to reduce security barriers

-- Export Documents - Allow easier document uploads
DROP POLICY IF EXISTS "Exporters can upload their own documents" ON public.export_documents;
CREATE POLICY "Allow document uploads" 
ON public.export_documents 
FOR INSERT 
WITH CHECK (true);

-- Export Applications - Allow easier application submissions  
DROP POLICY IF EXISTS "Exporters can create applications" ON public.export_applications;
CREATE POLICY "Allow application creation" 
ON public.export_applications 
FOR INSERT 
WITH CHECK (true);

-- Make sure exporters can view their related data easily
DROP POLICY IF EXISTS "Exporters can view their own documents" ON public.export_documents;
CREATE POLICY "Allow document viewing" 
ON public.export_documents 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Exporters can view their own applications" ON public.export_applications;
CREATE POLICY "Allow application viewing" 
ON public.export_applications 
FOR SELECT 
USING (true);