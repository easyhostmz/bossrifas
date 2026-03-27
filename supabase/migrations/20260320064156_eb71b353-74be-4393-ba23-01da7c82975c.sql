
-- Drop overly permissive policies and replace with proper ones
DROP POLICY IF EXISTS "Service role can insert purchases" ON public.purchases;
DROP POLICY IF EXISTS "Service role can update purchases" ON public.purchases;
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service role can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service role can update lottery numbers" ON public.lottery_numbers;
DROP POLICY IF EXISTS "Service role can insert lottery numbers" ON public.lottery_numbers;

-- Admin-only write policies
CREATE POLICY "Admins can update purchases" ON public.purchases FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update lottery numbers" ON public.lottery_numbers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert lottery numbers" ON public.lottery_numbers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated users to insert their own transactions
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
