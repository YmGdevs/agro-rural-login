-- Update extensionista profile to have proper data
UPDATE profiles 
SET full_name = 'João Silva',
    region = 'Maputo'
WHERE id = 'cedec552-f8df-4aaa-8772-47a155e7050e';

-- Insert sample regional capacity data
INSERT INTO regional_capacity (region, total_area_m2, total_producers, total_parcelas, average_loan_amount, success_rate)
VALUES 
('Maputo', 50000, 25, 40, 7500, 85.5),
('Gaza', 75000, 35, 60, 6200, 78.2),
('Inhambane', 120000, 45, 80, 8100, 90.1)
ON CONFLICT (region) DO UPDATE SET
  total_area_m2 = EXCLUDED.total_area_m2,
  total_producers = EXCLUDED.total_producers,
  total_parcelas = EXCLUDED.total_parcelas,
  average_loan_amount = EXCLUDED.average_loan_amount,
  success_rate = EXCLUDED.success_rate;