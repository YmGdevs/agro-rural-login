-- Clear the certificate PDF URL to force regeneration with QR code
UPDATE export_certificates 
SET certificate_pdf_url = NULL 
WHERE certificate_number = 'EXP-20250806-0001';