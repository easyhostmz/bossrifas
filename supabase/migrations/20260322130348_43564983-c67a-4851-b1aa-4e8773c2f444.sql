-- Create storage bucket for lottery images
INSERT INTO storage.buckets (id, name, public) VALUES ('lottery-images', 'lottery-images', true);

-- Allow authenticated users to upload
CREATE POLICY "Admins can upload lottery images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lottery-images' AND (SELECT public.has_role(auth.uid(), 'admin')));

-- Allow public read
CREATE POLICY "Anyone can view lottery images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'lottery-images');

-- Allow admins to update/delete
CREATE POLICY "Admins can update lottery images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'lottery-images' AND (SELECT public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins can delete lottery images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'lottery-images' AND (SELECT public.has_role(auth.uid(), 'admin')));
