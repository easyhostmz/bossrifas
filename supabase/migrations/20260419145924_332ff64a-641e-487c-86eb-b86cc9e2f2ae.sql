
-- Add commission setting to admin_settings
ALTER TABLE public.admin_settings 
ADD COLUMN IF NOT EXISTS comissao_por_numero NUMERIC NOT NULL DEFAULT 3;

-- Add affiliate_code to purchases (origin tracking)
ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS affiliate_code TEXT;

-- ============================================
-- AFFILIATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  codigo TEXT NOT NULL UNIQUE,
  metodo_pagamento TEXT DEFAULT 'mpesa',
  saldo NUMERIC NOT NULL DEFAULT 0,
  total_vendas INTEGER NOT NULL DEFAULT 0,
  total_comissao NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate profile"
ON public.affiliates FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view ranking"
ON public.affiliates FOR SELECT TO anon, authenticated
USING (status = 'ativo');

CREATE POLICY "Users can create own affiliate profile"
ON public.affiliates FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate profile"
ON public.affiliates FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage affiliates"
ON public.affiliates FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- AFFILIATE SALES (records each commission)
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliate_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL,
  lottery_id UUID NOT NULL,
  quantidade INTEGER NOT NULL,
  valor_comissao NUMERIC NOT NULL,
  origem TEXT NOT NULL DEFAULT 'auto', -- auto | manual
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (purchase_id)
);

ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate sees own sales"
ON public.affiliate_sales FOR SELECT TO authenticated
USING (
  affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
);

CREATE POLICY "Admins manage affiliate sales"
ON public.affiliate_sales FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- WITHDRAWALS
-- ============================================
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  metodo TEXT NOT NULL,
  conta_destino TEXT,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente | pago | cancelado
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate sees own withdrawals"
ON public.withdrawals FOR SELECT TO authenticated
USING (
  affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
);

CREATE POLICY "Affiliate creates own withdrawals"
ON public.withdrawals FOR INSERT TO authenticated
WITH CHECK (
  affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
);

CREATE POLICY "Admins manage withdrawals"
ON public.withdrawals FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- HELPER: generate unique affiliate code
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    new_code := 'BOSS' || LPAD(floor(random() * 9000 + 1000)::TEXT, 4, '0');
    SELECT COUNT(*) INTO exists_count FROM public.affiliates WHERE codigo = new_code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN new_code;
END;
$$;

-- ============================================
-- TRIGGER: credit commission when purchase becomes 'pago'
-- ============================================
CREATE OR REPLACE FUNCTION public.credit_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id UUID;
  v_affiliate_user UUID;
  v_commission_per NUMERIC;
  v_total_commission NUMERIC;
BEGIN
  -- Only act when status transitions TO 'pago'
  IF NEW.status <> 'pago' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'pago' THEN
    RETURN NEW;
  END IF;
  IF NEW.affiliate_code IS NULL OR NEW.affiliate_code = '' THEN
    RETURN NEW;
  END IF;

  -- Find affiliate
  SELECT id, user_id INTO v_affiliate_id, v_affiliate_user
  FROM public.affiliates
  WHERE codigo = NEW.affiliate_code AND status = 'ativo';

  IF v_affiliate_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Prevent self-commission
  IF v_affiliate_user = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Prevent duplicate commission
  IF EXISTS (SELECT 1 FROM public.affiliate_sales WHERE purchase_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Get commission rate
  SELECT COALESCE(comissao_por_numero, 3) INTO v_commission_per
  FROM public.admin_settings ORDER BY updated_at DESC LIMIT 1;
  IF v_commission_per IS NULL THEN
    v_commission_per := 3;
  END IF;

  v_total_commission := v_commission_per * NEW.quantidade;

  -- Insert sale record
  INSERT INTO public.affiliate_sales (affiliate_id, purchase_id, lottery_id, quantidade, valor_comissao, origem)
  VALUES (v_affiliate_id, NEW.id, NEW.lottery_id, NEW.quantidade, v_total_commission, 'auto');

  -- Update affiliate totals
  UPDATE public.affiliates
  SET 
    total_vendas = total_vendas + NEW.quantidade,
    total_comissao = total_comissao + v_total_commission,
    saldo = saldo + v_total_commission,
    updated_at = now()
  WHERE id = v_affiliate_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_affiliate_commission ON public.purchases;
CREATE TRIGGER trg_credit_affiliate_commission
AFTER INSERT OR UPDATE OF status ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.credit_affiliate_commission();

-- ============================================
-- TRIGGER: when withdrawal is approved (pago), deduct from balance
-- ============================================
CREATE OR REPLACE FUNCTION public.process_withdrawal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pendente' THEN
    -- Hold the amount: subtract from balance immediately on request
    UPDATE public.affiliates
    SET saldo = saldo - NEW.valor, updated_at = now()
    WHERE id = NEW.affiliate_id AND saldo >= NEW.valor;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Saldo insuficiente';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'pendente' AND NEW.status = 'cancelado' THEN
    -- Refund balance
    UPDATE public.affiliates
    SET saldo = saldo + OLD.valor, updated_at = now()
    WHERE id = OLD.affiliate_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_process_withdrawal ON public.withdrawals;
CREATE TRIGGER trg_process_withdrawal
BEFORE INSERT OR UPDATE OF status ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.process_withdrawal();

-- ============================================
-- Public ranking view (top affiliates)
-- ============================================
CREATE OR REPLACE VIEW public.affiliate_ranking AS
SELECT 
  id,
  nome,
  codigo,
  total_vendas,
  total_comissao
FROM public.affiliates
WHERE status = 'ativo'
ORDER BY total_vendas DESC, total_comissao DESC
LIMIT 100;

GRANT SELECT ON public.affiliate_ranking TO anon, authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_affiliates_codigo ON public.affiliates(codigo);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_affiliate ON public.affiliate_sales(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_purchases_affiliate_code ON public.purchases(affiliate_code);
