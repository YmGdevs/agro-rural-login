-- Insert additional test loan requests for better demonstration
INSERT INTO loan_requests (
  producer_id, 
  extensionista_id, 
  loan_type, 
  amount, 
  item_description, 
  description, 
  justification, 
  community_consent, 
  status
) VALUES 
-- Pedido 1: Dinheiro - Aprovado
(
  '84c82d16-6833-4bcf-92bd-76cf9aed1fda',
  'cedec552-f8df-4aaa-8772-47a155e7050e',
  'money',
  3500.00,
  NULL,
  'Empréstimo para compra de sementes de milho',
  'Preciso de financiamento para a época de plantio que se aproxima. As sementes de milho são essenciais para minha produção.',
  true,
  'approved'
),
-- Pedido 2: Item - Pendente
(
  '84c82d16-6833-4bcf-92bd-76cf9aed1fda',
  'cedec552-f8df-4aaa-8772-47a155e7050e',
  'item',
  NULL,
  'Trator pequeno para preparação do solo',
  'Equipamento agrícola para melhorar a produtividade',
  'Minha parcela tem crescido e preciso de equipamento para preparar adequadamente o solo. Isso aumentará significativamente minha produção.',
  true,
  'pending'
),
-- Pedido 3: Dinheiro - Rejeitado
(
  '84c82d16-6833-4bcf-92bd-76cf9aed1fda',
  'cedec552-f8df-4aaa-8772-47a155e7050e',
  'money',
  8000.00,
  NULL,
  'Empréstimo para expansão da atividade',
  'Quero expandir minha atividade agrícola para incluir criação de gado. Preciso de capital inicial.',
  false,
  'rejected'
),
-- Pedido 4: Dinheiro - Pendente (valor alto)
(
  '84c82d16-6833-4bcf-92bd-76cf9aed1fda',
  'cedec552-f8df-4aaa-8772-47a155e7050e',
  'money',
  12000.00,
  NULL,
  'Investimento em sistema de irrigação',
  'Pretendo instalar um sistema de irrigação por gotejamento para otimizar o uso da água e aumentar a produtividade das culturas.',
  true,
  'pending'
);

-- Update some requests with review information
UPDATE loan_requests 
SET 
  reviewed_at = now() - interval '2 days',
  reviewed_by = 'f4b0ebb7-e2a1-4f00-bf77-8af57e800cd9',
  review_comments = 'Pedido aprovado. Documentação em ordem e projeto viável.'
WHERE status = 'approved';

UPDATE loan_requests 
SET 
  reviewed_at = now() - interval '1 day',
  reviewed_by = 'f4b0ebb7-e2a1-4f00-bf77-8af57e800cd9',
  review_comments = 'Pedido rejeitado. Falta de consenso comunitário e risco elevado para criação de gado.'
WHERE status = 'rejected';