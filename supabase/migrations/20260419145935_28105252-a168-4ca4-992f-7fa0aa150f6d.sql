
DROP VIEW IF EXISTS public.affiliate_ranking;

CREATE VIEW public.affiliate_ranking
WITH (security_invoker = true)
AS
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
