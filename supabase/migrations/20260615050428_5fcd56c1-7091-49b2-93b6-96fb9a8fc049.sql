
-- projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  problem text NOT NULL,
  solution text,
  industry text,
  funding_needed text,
  public_summary text,
  image_path text,
  ppt_path text,
  pdf_path text,
  status text NOT NULL DEFAULT 'idea',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can insert project" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner or admin can update" ON public.projects FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin can delete" ON public.projects FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- access_requests
CREATE TABLE public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_role text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_requests TO authenticated;
GRANT ALL ON public.access_requests TO service_role;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User sees own requests" ON public.access_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "User creates own request" ON public.access_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner or admin updates request" ON public.access_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()))
  WITH CHECK (true);

-- helper to check if a user is approved on a project (or is owner/admin)
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.access_requests r
    WHERE r.project_id = _project_id AND r.user_id = _user_id AND r.status = 'approved'
  ) OR public.has_role(_user_id, 'admin');
$$;

-- project_messages
CREATE TABLE public.project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.project_messages TO authenticated;
GRANT ALL ON public.project_messages TO service_role;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read messages" ON public.project_messages FOR SELECT TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));
CREATE POLICY "Members send messages" ON public.project_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_project_member(project_id, auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER projects_touch BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER access_requests_touch BEFORE UPDATE ON public.access_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage: project-images (signed reads for any authenticated user; writes by owner only)
CREATE POLICY "Auth read project images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'project-images');
CREATE POLICY "Owner write project images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images' AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.owner_id = auth.uid() AND p.id::text = (storage.foldername(name))[1]
  ));
CREATE POLICY "Owner update project images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-images' AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.owner_id = auth.uid() AND p.id::text = (storage.foldername(name))[1]
  ));
CREATE POLICY "Owner delete project images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-images' AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.owner_id = auth.uid() AND p.id::text = (storage.foldername(name))[1]
  ));

-- Storage: project-docs (members read; owner writes)
CREATE POLICY "Members read project docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'project-docs' AND public.is_project_member(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "Owner write project docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-docs' AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.owner_id = auth.uid() AND p.id::text = (storage.foldername(name))[1]
  ));
CREATE POLICY "Owner update project docs" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-docs' AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.owner_id = auth.uid() AND p.id::text = (storage.foldername(name))[1]
  ));
CREATE POLICY "Owner delete project docs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-docs' AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.owner_id = auth.uid() AND p.id::text = (storage.foldername(name))[1]
  ));
