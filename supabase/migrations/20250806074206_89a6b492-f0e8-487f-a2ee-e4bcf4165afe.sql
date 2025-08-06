-- Update the export application to be associated with teste@teste.com exporter
UPDATE export_applications 
SET exporter_id = '0332085a-a907-4d3f-815d-2d524f8c7fb6'
WHERE destination_country = 'Portugal' 
AND products = ARRAY['Cashew nuts', 'Sesame seeds'];

-- Update the sample exporter profile to have better data with different NUIT
UPDATE exporters 
SET 
  company_name = 'Teste Executivo Export Lda',
  company_nuit = '400987654',
  contact_phone = '+258 84 123 4567',
  company_address = 'Rua das Palmeiras, 123, Maputo',
  export_products = ARRAY['Cashew', 'Sesame', 'Cotton']
WHERE user_id = '1098ddef-3552-41c8-be7c-89e917857861';