
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_priority boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_analysis jsonb;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  _role app_role;
  _founder_emails text[] := ARRAY['esakkimuthu01447@gmail.com','founderofwaytodream@gmail.com'];
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );

  if new.email = ANY(_founder_emails) then
    _role := 'founder'::app_role;
  else
    _role := coalesce((new.raw_user_meta_data->>'role')::app_role, 'innovator'::app_role);
    if _role = 'founder'::app_role then
      _role := 'innovator'::app_role;
    end if;
  end if;

  insert into public.user_roles (user_id, role) values (new.id, _role)
  on conflict do nothing;

  return new;
end;
$function$;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'founder'::app_role
FROM auth.users u
WHERE u.email IN ('esakkimuthu01447@gmail.com','founderofwaytodream@gmail.com')
ON CONFLICT DO NOTHING;

DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND ur.role = 'founder'::app_role
  AND u.email NOT IN ('esakkimuthu01447@gmail.com','founderofwaytodream@gmail.com');
