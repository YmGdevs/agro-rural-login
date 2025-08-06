-- Make export-documents bucket public and add necessary policies
UPDATE storage.buckets 
SET public = true 
WHERE id = 'export-documents';

-- Create policy for public access to certificates
CREATE POLICY "Public access to certificates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'export-documents' AND (storage.foldername(name))[1] = 'certificates');

-- Create policy for authenticated users to upload certificates
CREATE POLICY "Authenticated users can upload certificates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'export-documents' AND auth.role() = 'authenticated');

-- Create policy for service role to manage all files
CREATE POLICY "Service role can manage all export documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'export-documents' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'export-documents' AND auth.role() = 'service_role');