-- Update the user emprestimo@emprestimo.com to have empresa_fomentadora role
UPDATE public.profiles 
SET role = 'empresa_fomentadora'::app_role,
    full_name = 'Empresa Fomentadora',
    username = 'empresa_fomentadora'
WHERE user_id = '34f3b4a6-2998-47ed-9612-d596e5c6ef9d';