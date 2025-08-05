-- Create a profile for the existing test user
INSERT INTO public.profiles (user_id, username, full_name, role)
SELECT 
  id, 
  'testeexecutivo', 
  'Teste Executivo', 
  'extensionista'::app_role
FROM auth.users 
WHERE email = 'teste@teste.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = auth.users.id
);