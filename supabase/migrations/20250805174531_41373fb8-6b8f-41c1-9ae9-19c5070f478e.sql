-- Delete the test user and profile to recreate with correct credentials
DELETE FROM public.profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste@teste.com');
DELETE FROM auth.users WHERE email = 'teste@teste.com';