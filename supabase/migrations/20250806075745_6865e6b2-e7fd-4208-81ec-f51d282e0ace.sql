-- Generate certificate for the approved export application
DO $$
DECLARE
    app_id UUID := 'fd26e5de-773e-4159-9a69-fdff732359a2';
    cert_number TEXT;
    qr_data TEXT;
BEGIN
    -- Generate certificate number
    cert_number := generate_certificate_number();
    
    -- Create QR code data
    qr_data := json_build_object(
        'certificateNumber', cert_number,
        'company', 'Teste Executivo Export Lda',
        'nuit', '400987654',
        'products', ARRAY['Cashew nuts', 'Sesame seeds'],
        'quantity', 5000,
        'destination', 'Portugal',
        'issueDate', now()::text,
        'verificationUrl', 'https://vxkljzytssofphkedakk.supabase.co/verify-certificate/' || cert_number
    )::text;
    
    -- Create certificate record
    INSERT INTO export_certificates (
        application_id,
        certificate_number,
        certificate_type,
        qr_code_data,
        issued_by,
        expiry_date,
        status
    ) VALUES (
        app_id,
        cert_number,
        'export',
        qr_data,
        '1098ddef-3552-41c8-be7c-89e917857861', -- admin user id
        (now() + interval '1 year'),
        'active'
    );
    
    RAISE NOTICE 'Certificate % created successfully for application %', cert_number, app_id;
END $$;