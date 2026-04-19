import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Crown, TrendingUp, Wallet, Users } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMyAffiliate, useAffiliateRanking } from "@/hooks/useAffiliate";

const Afiliados = () => {
  const navigate = useNavigate();
  const { data: affiliate, isLoading: loadingAff, refetch } = useMyAffiliate();
  const { data: ranking } = useAffiliateRanking();
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Form state (only for users that aren't affiliates yet)
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [metodo, setMetodo] = useState("mpesa");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Pre-fill from profile
  useEffect(() => {
    if (!session?.user) return;
    supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNome(data.nome_completo || "");
          setTelefone(data.telefone || "");
          setEmail(data.email || "");
        }
      });
  }, [session]);

  // If already affiliate, redirect to dashboard
  useEffect(() => {
    if (affiliate) {
      navigate("/painel-afiliado", { replace: true });
    }
  }, [affiliate, navigate]);

  const handleRegister = async () => {
    if (!session?.user) {
      toast.error("Faça login primeiro");
      navigate("/login");
      return;
    }
    if (!nome.trim() || nome.trim().length < 3) {
      toast.error("Informe o seu nome completo");
      return;
    }
    if (!telefone || telefone.length < 9) {
      toast.error("Informe um telefone válido");
      return;
    }
    setSubmitting(true);
    try {
      // Generate code via RPC
      const { data: codeData, error: codeErr } = await supabase
        .rpc("generate_affiliate_code" as any);
      if (codeErr) throw codeErr;
      const codigo = codeData as unknown as string;

      const { error } = await supabase.from("affiliates" as any).insert({
        user_id: session.user.id,
        nome: nome.trim(),
        telefone,
        email: email || null,
        codigo,
        metodo_pagamento: metodo,
      });
      if (error) throw error;

      toast.success(`Bem-vindo afiliado! Seu código: ${codigo}`);
      await refetch();
      navigate("/painel-afiliado");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta de afiliado");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSession || loadingAff) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <Header />
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header />

      {/* Hero */}
      <section className="mx-auto max-w-[92%] md:max-w-5xl py-8 md:py-12 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-4">
          <Crown className="h-3 w-3" /> Programa de Afiliados
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-3">
          Ganhe <span className="text-gradient">3 MT por número</span> vendido
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground mb-8">
          Compartilhe o seu link exclusivo, traga novos jogadores e receba comissão automaticamente por cada bilhete confirmado.
        </p>

        {/* Benefit cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
          {[
            { icon: TrendingUp, title: "3 MT por venda", desc: "Em todos os bilhetes" },
            { icon: Wallet, title: "Saldo em tempo real", desc: "Acompanhe os ganhos" },
            { icon: Users, title: "Sem limites", desc: "Venda quanto quiser" },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="p-5 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-bold">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {!session ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">Precisa de uma conta para se tornar afiliado.</p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate("/register")} className="rounded-xl">Criar Conta</Button>
                <Button variant="outline" onClick={() => navigate("/login")} className="rounded-xl">Já tenho conta</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-md mx-auto text-left">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-center">Tornar-me Afiliado</h2>
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp *</Label>
                <Input
                  type="tel" maxLength={9} value={telefone}
                  onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ""))}
                  placeholder="841234567"
                />
              </div>
              <div className="space-y-2">
                <Label>Email (opcional)</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Método preferido para receber pagamento</Label>
                <Select value={metodo} onValueChange={setMetodo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="emola">eMola</SelectItem>
                    <SelectItem value="banco">Transferência Bancária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleRegister} disabled={submitting} className="w-full rounded-xl">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />A criar...</> : "Criar conta de afiliado"}
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Mini ranking preview */}
      {ranking && ranking.length > 0 && (
        <section className="mx-auto max-w-[92%] md:max-w-3xl py-8">
          <h2 className="text-xl font-bold mb-4 text-center">🏆 Top Afiliados</h2>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {ranking.slice(0, 5).map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-sm">{r.nome}</p>
                        <p className="text-xs text-muted-foreground font-mono">{r.codigo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{r.total_vendas} vendas</p>
                      <p className="text-xs text-primary">{Number(r.total_comissao).toLocaleString("pt-BR")} MT</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 rounded-xl" onClick={() => navigate("/ranking")}>
                Ver Ranking Completo
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};

export default Afiliados;
