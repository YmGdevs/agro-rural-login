-- First, let's create some new approved loan requests that will generate vouchers
-- Insert a new loan request that will be approved automatically
INSERT INTO loan_requests (
  producer_id, 
  extensionista_id, 
  loan_type, 
  amount, 
  description, 
  justification,
  status
) VALUES (
  (SELECT id FROM producers LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'extensionista' LIMIT 1),
  'money',
  3000.00,
  'Equipamento agrícola',
  'Compra de ferramentas para cultivo',
  'approved'
);

-- Insert another approved loan request
INSERT INTO loan_requests (
  producer_id, 
  extensionista_id, 
  loan_type, 
  amount, 
  description, 
  justification,
  status
) VALUES (
  (SELECT id FROM producers ORDER BY created_at DESC LIMIT 1 OFFSET 1),
  (SELECT id FROM profiles WHERE role = 'extensionista' LIMIT 1),
  'money',
  2500.00,
  'Sementes de milho',
  'Plantio da nova safra',
  'approved'
);

-- Insert a third approved loan request
INSERT INTO loan_requests (
  producer_id, 
  extensionista_id, 
  loan_type, 
  amount, 
  description, 
  justification,
  status
) VALUES (
  (SELECT id FROM producers ORDER BY created_at DESC LIMIT 1 OFFSET 2),
  (SELECT id FROM profiles WHERE role = 'extensionista' LIMIT 1),
  'money',
  4000.00,
  'Fertilizantes',
  'Melhorar produtividade da terra',
  'approved'
);