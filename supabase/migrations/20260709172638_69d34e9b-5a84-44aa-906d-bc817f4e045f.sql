
-- Seed founder auth accounts with known passwords
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- esakkimuthu01447@gmail.com / Mareesh@2005
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'esakkimuthu01447@gmail.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
      'esakkimuthu01447@gmail.com', crypt('Mareesh@2005', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Esakkimuthu","role":"founder"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', 'esakkimuthu01447@gmail.com', 'email_verified', true),
      'email', new_user_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt('Mareesh@2005', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now()
    WHERE email = 'esakkimuthu01447@gmail.com';
  END IF;

  -- founderofwaytodream@gmail.com / Esakki@2005
  UPDATE auth.users SET encrypted_password = crypt('Esakki@2005', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now()
  WHERE email = 'founderofwaytodream@gmail.com';
END $$;

-- Ensure profiles + founder role
INSERT INTO public.profiles (id, full_name, email)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email,'@',1)), u.email
FROM auth.users u
WHERE u.email IN ('esakkimuthu01447@gmail.com','founderofwaytodream@gmail.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'founder'::app_role FROM auth.users u
WHERE u.email IN ('esakkimuthu01447@gmail.com','founderofwaytodream@gmail.com')
ON CONFLICT DO NOTHING;
