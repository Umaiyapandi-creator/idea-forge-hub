
CREATE TABLE public.premium_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle TEXT NOT NULL CHECK (cycle IN ('quarterly','yearly')),
  amount INTEGER NOT NULL,
  screenshot_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.premium_requests TO authenticated;
GRANT ALL ON public.premium_requests TO service_role;
ALTER TABLE public.premium_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own or admin select" ON public.premium_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "insert own" ON public.premium_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin update" ON public.premium_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));

CREATE TRIGGER touch_premium_requests BEFORE UPDATE ON public.premium_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
