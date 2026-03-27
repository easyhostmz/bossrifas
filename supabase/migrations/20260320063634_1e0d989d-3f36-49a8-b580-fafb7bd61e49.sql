
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT UNIQUE NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email, telefone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Lotteries table
CREATE TABLE public.lotteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  imagem_url TEXT DEFAULT '',
  preco_numero NUMERIC(10,2) NOT NULL DEFAULT 15,
  total_numeros INTEGER NOT NULL DEFAULT 1000000,
  numeros_vendidos INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado', 'sorteado')),
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fim TIMESTAMPTZ NOT NULL,
  premios JSONB DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lotteries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lotteries" ON public.lotteries FOR SELECT USING (true);

-- Lottery numbers table
CREATE TABLE public.lottery_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID NOT NULL REFERENCES public.lotteries(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'vendido')),
  user_id UUID REFERENCES auth.users(id),
  reserved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  UNIQUE (lottery_id, numero)
);

CREATE INDEX idx_lottery_numbers_lottery_status ON public.lottery_numbers (lottery_id, status);
CREATE INDEX idx_lottery_numbers_expires ON public.lottery_numbers (status, expires_at) WHERE status = 'reservado';

ALTER TABLE public.lottery_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lottery numbers" ON public.lottery_numbers FOR SELECT USING (true);

-- Purchases table
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  lottery_id UUID NOT NULL REFERENCES public.lotteries(id),
  quantidade INTEGER NOT NULL,
  numeros JSONB NOT NULL DEFAULT '[]'::jsonb,
  valor_total NUMERIC(10,2) NOT NULL,
  telefone TEXT NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('mpesa', 'emola', 'card')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'falhou')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON public.purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  metodo TEXT NOT NULL CHECK (metodo IN ('mpesa', 'emola', 'card')),
  debito_reference TEXT UNIQUE,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  amount NUMERIC(10,2) NOT NULL,
  msisdn TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admin settings table (single row)
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debito_api_token TEXT DEFAULT '',
  wallet_mpesa TEXT DEFAULT '',
  wallet_emola TEXT DEFAULT '',
  wallet_card TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- User roles for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can manage settings" ON public.admin_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all purchases" ON public.purchases FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage lotteries" ON public.lotteries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage lottery numbers" ON public.lottery_numbers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Function to update numeros_vendidos count
CREATE OR REPLACE FUNCTION public.update_sold_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lotteries
  SET numeros_vendidos = (
    SELECT COUNT(*) FROM public.lottery_numbers
    WHERE lottery_id = COALESCE(NEW.lottery_id, OLD.lottery_id) AND status = 'vendido'
  )
  WHERE id = COALESCE(NEW.lottery_id, OLD.lottery_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_lottery_sold_count
  AFTER UPDATE OF status ON public.lottery_numbers
  FOR EACH ROW EXECUTE FUNCTION public.update_sold_count();

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;
