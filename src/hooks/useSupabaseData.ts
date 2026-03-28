import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LotteryRow {
  id: string;
  nome: string;
  descricao: string;
  imagem_url: string;
  preco_numero: number;
  total_numeros: number;
  numeros_vendidos: number;
  status: string;
  data_inicio: string;
  data_fim: string;
  premios: any[];
  criado_em: string;
}

export interface PurchaseRow {
  id: string;
  user_id: string;
  lottery_id: string;
  quantidade: number;
  numeros: string[];
  valor_total: number;
  telefone: string;
  whatsapp: string | null;
  metodo: string;
  status: string;
  comprovativo_url: string | null;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  purchase_id: string;
  user_id: string;
  metodo: string;
  debito_reference: string | null;
  transaction_id: string | null;
  status: string;
  amount: number;
  msisdn: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  criado_em: string;
}

export interface LotteryResultRow {
  id: string;
  lottery_id: string;
  winning_number: string;
  winner_user_id: string | null;
  winner_name: string | null;
  winner_phone: string | null;
  prize_info: any;
  drawn_at: string;
}

export function useLotteries() {
  return useQuery({
    queryKey: ["lotteries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotteries")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as LotteryRow[];
    },
  });
}

export function useLottery(id: string | undefined) {
  return useQuery({
    queryKey: ["lottery", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotteries")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as LotteryRow;
    },
  });
}

export function useMyPurchases() {
  return useQuery({
    queryKey: ["my-purchases"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PurchaseRow[];
    },
  });
}

export function useAllPurchases() {
  return useQuery({
    queryKey: ["all-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PurchaseRow[];
    },
  });
}

export function useAllTransactions() {
  return useQuery({
    queryKey: ["all-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TransactionRow[];
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ProfileRow[];
    },
  });
}

export function useLotteryResults() {
  return useQuery({
    queryKey: ["lottery-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lottery_results")
        .select("*")
        .order("drawn_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as LotteryResultRow[];
    },
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; debito_api_token: string; wallet_mpesa: string; wallet_emola: string; wallet_card: string } | null;
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });
}


export async function createLottery(data: {
  nome: string;
  descricao?: string;
  imagem_url?: string;
  preco_numero: number;
  total_numeros: number;
  data_inicio: string;
  data_fim: string;
  premios?: any[];
}) {
  const res = await supabase.functions.invoke("create-lottery", { body: data });
  if (res.error) throw new Error(res.error.message || "Erro ao criar sorteio");
  return res.data;
}

export async function performDraw(lotteryId: string) {
  const res = await supabase.functions.invoke("perform-draw", {
    body: { lottery_id: lotteryId },
  });
  if (res.error) throw new Error(res.error.message || "Erro ao realizar sorteio");
  return res.data;
}
