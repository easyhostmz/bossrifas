import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AFFILIATE_COOKIE = "boss_ref";
export const AFFILIATE_COOKIE_DAYS = 7;

export function setAffiliateCookie(code: string) {
  const days = AFFILIATE_COOKIE_DAYS;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${AFFILIATE_COOKIE}=${encodeURIComponent(code)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getAffiliateCookie(): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + AFFILIATE_COOKIE + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function clearAffiliateCookie() {
  document.cookie = `${AFFILIATE_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export interface AffiliateRow {
  id: string;
  user_id: string;
  nome: string;
  telefone: string;
  email: string | null;
  codigo: string;
  metodo_pagamento: string;
  saldo: number;
  total_vendas: number;
  total_comissao: number;
  status: string;
  criado_em: string;
}

export interface AffiliateSaleRow {
  id: string;
  affiliate_id: string;
  purchase_id: string;
  lottery_id: string;
  quantidade: number;
  valor_comissao: number;
  origem: string;
  created_at: string;
}

export interface WithdrawalRow {
  id: string;
  affiliate_id: string;
  valor: number;
  metodo: string;
  conta_destino: string | null;
  status: string;
  notas: string | null;
  created_at: string;
}

export interface RankingRow {
  id: string;
  nome: string;
  codigo: string;
  total_vendas: number;
  total_comissao: number;
}

export function useMyAffiliate() {
  return useQuery({
    queryKey: ["my-affiliate"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("affiliates" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AffiliateRow | null;
    },
  });
}

export function useMyAffiliateSales(affiliateId: string | undefined) {
  return useQuery({
    queryKey: ["my-affiliate-sales", affiliateId],
    enabled: !!affiliateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_sales" as any)
        .select("*")
        .eq("affiliate_id", affiliateId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AffiliateSaleRow[];
    },
  });
}

export function useMyWithdrawals(affiliateId: string | undefined) {
  return useQuery({
    queryKey: ["my-withdrawals", affiliateId],
    enabled: !!affiliateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals" as any)
        .select("*")
        .eq("affiliate_id", affiliateId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as WithdrawalRow[];
    },
  });
}

export function useAffiliateRanking() {
  return useQuery({
    queryKey: ["affiliate-ranking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_ranking" as any)
        .select("*")
        .limit(10);
      if (error) throw error;
      return (data || []) as unknown as RankingRow[];
    },
  });
}

export function useAllAffiliates() {
  return useQuery({
    queryKey: ["all-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates" as any)
        .select("*")
        .order("total_vendas", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AffiliateRow[];
    },
  });
}

export function useAllWithdrawals() {
  return useQuery({
    queryKey: ["all-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as WithdrawalRow[];
    },
  });
}
