
-- Lottery results table for storing draw winners
CREATE TABLE public.lottery_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID NOT NULL REFERENCES public.lotteries(id) ON DELETE CASCADE,
  winning_number TEXT NOT NULL,
  winner_user_id UUID REFERENCES auth.users(id),
  winner_name TEXT,
  winner_phone TEXT,
  prize_info JSONB DEFAULT '{}'::jsonb,
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lottery_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lottery results" ON public.lottery_results FOR SELECT USING (true);
CREATE POLICY "Admins can manage lottery results" ON public.lottery_results FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to generate lottery numbers for a lottery
CREATE OR REPLACE FUNCTION public.generate_lottery_numbers(p_lottery_id UUID, p_total INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 0..(p_total - 1) LOOP
    INSERT INTO public.lottery_numbers (lottery_id, numero, status)
    VALUES (p_lottery_id, LPAD(i::TEXT, 6, '0'), 'disponivel')
    ON CONFLICT (lottery_id, numero) DO NOTHING;
  END LOOP;
END;
$$;

-- Add admin insert policies for purchases and transactions (for edge functions)
CREATE POLICY "Service role can insert purchases" ON public.purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update purchases" ON public.purchases FOR UPDATE USING (true);
CREATE POLICY "Service role can insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Service role can update lottery numbers" ON public.lottery_numbers FOR UPDATE USING (true);
CREATE POLICY "Service role can insert lottery numbers" ON public.lottery_numbers FOR INSERT WITH CHECK (true);

-- Allow admin to view profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin to insert admin_settings if none exists
CREATE POLICY "Admins can insert settings" ON public.admin_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
