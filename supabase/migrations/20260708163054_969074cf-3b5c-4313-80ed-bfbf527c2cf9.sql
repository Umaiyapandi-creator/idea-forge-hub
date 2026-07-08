
CREATE POLICY "payment upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "payment read own or admin" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='payment-screenshots' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'founder')
  ));
