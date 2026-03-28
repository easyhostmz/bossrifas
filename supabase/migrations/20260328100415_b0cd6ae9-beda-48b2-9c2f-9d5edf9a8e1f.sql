
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS comprovativo_url text DEFAULT null;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS whatsapp text DEFAULT null;

-- Create storage bucket for comprovativos
INSERT INTO storage.buckets (id, name, public) VALUES ('comprovativos', 'comprovativos', true) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload comprovativos
CREATE POLICY "Users can upload comprovativos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'comprovativos');

-- Allow public read access to comprovativos
CREATE POLICY "Public can view comprovativos" ON storage.objects FOR SELECT USING (bucket_id = 'comprovativos');

-- Allow admins to delete comprovativos
CREATE POLICY "Admins can delete comprovativos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'comprovativos' AND public.has_role(auth.uid(), 'admin'::public.app_role));
