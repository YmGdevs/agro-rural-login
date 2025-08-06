-- Create a sample exporter profile
INSERT INTO exporters (
  user_id,
  company_name,
  company_nuit,
  contact_email,
  contact_phone,
  company_address,
  export_products,
  status
) VALUES (
  'b79e97a4-717c-452a-bd66-bbb27499c78d', -- Using the current admin user ID
  'Empresa Exportadora Exemplo Lda',
  '400123456',
  'exemplo@exportadora.com',
  '+258 84 123 4567',
  'Rua das Palmeiras, 123, Maputo',
  ARRAY['Cashew', 'Sesame', 'Cotton'],
  'approved'
);

-- Create a sample export application
INSERT INTO export_applications (
  exporter_id,
  application_type,
  destination_country,
  products,
  crops,
  districts,
  commercialization_provinces,
  quantity_kg,
  estimated_value,
  representative_name,
  phone,
  nuit_holder,
  license_number,
  id_document_number,
  id_issue_location,
  id_issue_date,
  category,
  signature_name,
  signature_date,
  status,
  submitted_at
) VALUES (
  (SELECT id FROM exporters WHERE company_name = 'Empresa Exportadora Exemplo Lda'),
  'certification',
  'Portugal',
  ARRAY['Cashew nuts', 'Sesame seeds'],
  ARRAY['Cashew', 'Sesame'],
  ARRAY['Nampula', 'Cabo Delgado'],
  ARRAY['Nampula', 'Cabo Delgado'],
  5000.00,
  25000.00,
  'João Silva Santos',
  '+258 84 987 6543',
  '400987654',
  'LIC2024001',
  '120045678901',
  'Maputo',
  '2024-01-15',
  'Organic',
  'João Silva Santos',
  '2025-08-06',
  'pending',
  NOW()
);