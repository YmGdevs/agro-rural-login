-- Corrigir roles incorretos - admin@admin.com deveria ser extensionista
UPDATE profiles 
SET role = 'extensionista'
WHERE user_id = '737b6b3e-d30d-4281-9a87-2d8f917fc435' AND role = 'empresa_fomentadora';

-- Verificar se há outros usuários que precisam de correção similar
-- (Este é um exemplo - ajuste conforme necessário)