import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Copy, Share2, Wallet, TrendingUp, Hash, DollarSign, Crown } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMyAffiliate, useMyAffiliateSales, useMyWithdrawals } from "@/hooks/useAffiliate";
import { useQueryClient } from "@tanstack/react-query";

const PainelAfiliado = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: affiliate, isLoading } = useMyAffiliate();
  const { data: sales } = useMyAffiliateSales(affiliate?.id);
  const { data: withdrawals } = useMyWithdrawals(affiliate?.id);
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Withdraw modal
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [valor, setValor] = useState("");
  const [metodo, setMetodo] = useState("mpesa");
  const [conta, setConta] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
      if (!session) navigate("/login");
    });
  }, [navigate]);

  // Realtime updates
  useEffect(() => {
    if (!affiliate?.id) return;
    const channel = supabase
      .channel(`affiliate-${affiliate.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "affiliates", filter: `id=eq.${affiliate.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["my-affiliate"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "affiliate_sales", filter: `affiliate_id=eq.${affiliate.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["my-affiliate-sales"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [affiliate?.id, queryClient]);

  if (loadingSession || isLoading) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <Header />
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <Header />
        <div className="mx-auto max-w-md py-20 text-center space-y-4 px-4">
          <Crown className="mx-auto h-12 w-12 text-primary/40" />
          <h2 className="text-xl font-bold">Ainda não é afiliado</h2>
          <p className="text-muted-foreground text-sm">Inscreva-se no programa para começar a ganhar comissões.</p>
          <Button onClick={() => navigate("/afiliados")} className="rounded-xl">Tornar-me Afiliado</Button>
        </div>
      </div>
    );
  }

  if (affiliate.status === "bloqueado") {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <Header />
        <div className="mx-auto max-w-md py-20 text-center space-y-4 px-4">
          <h2 className="text-xl font-bold text-destructive">Conta bloqueada</h2>
          <p className="text-muted-foreground text-sm">Sua conta de afiliado foi bloqueada. Contacte o suporte.</p>
        </div>
      </div>
    );
  }

  const link = `${window.location.origin}/?ref=${affiliate.codigo}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `🎁 Concorra a prêmios incríveis no Boss dos Prêmios!\n\nCompre o seu número por apenas 15 MT e participe:\n${link}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleWithdraw = async () => {
    const valorNum = Number(valor);
    if (!valorNum || valorNum <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    if (valorNum > Number(affiliate.saldo)) {
      toast.error("Valor superior ao saldo disponível");
      return;
    }
    if (valorNum < 50) {
      toast.error("Valor mínimo de levantamento: 50 MT");
      return;
    }
    if (!conta.trim()) {
      toast.error("Informe a conta de destino");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("withdrawals" as any).insert({
        affiliate_id: affiliate.id,
        valor: valorNum,
        metodo,
        conta_destino: conta.trim(),
      });
      if (error) throw error;
      toast.success("Pedido de levantamento enviado!");
      setShowWithdraw(false);
      setValor(""); setConta("");
      queryClient.invalidateQueries({ queryKey: ["my-affiliate"] });
      queryClient.invalidateQueries({ queryKey: ["my-withdrawals", affiliate.id] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar levantamento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header />
      <div className="mx-auto max-w-[92%] md:max-w-5xl py-6 space-y-6">
        {/* Header card */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Painel do Afiliado</p>
                <h1 className="text-2xl md:text-3xl font-extrabold mt-1">{affiliate.nome}</h1>
                <Badge className="mt-2 font-mono">{affiliate.codigo}</Badge>
              </div>
              <Button onClick={() => setShowWithdraw(true)} className="rounded-xl">
                <Wallet className="h-4 w-4 mr-2" /> Solicitar Levantamento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Hash} label="Números vendidos" value={affiliate.total_vendas.toString()} />
          <StatCard icon={TrendingUp} label="Comissão total" value={`${Number(affiliate.total_comissao).toLocaleString("pt-BR")} MT`} />
          <StatCard icon={DollarSign} label="Saldo disponível" value={`${Number(affiliate.saldo).toLocaleString("pt-BR")} MT`} highlight />
          <StatCard icon={Wallet} label="Pedidos" value={(withdrawals?.length || 0).toString()} />
        </div>

        {/* Link */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-bold">Seu link exclusivo</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input readOnly value={link} className="font-mono text-xs" />
              <Button onClick={copyLink} variant="outline" className="rounded-xl shrink-0">
                <Copy className="h-4 w-4 mr-2" /> Copiar
              </Button>
              <Button onClick={shareWhatsApp} className="rounded-xl shrink-0">
                <Share2 className="h-4 w-4 mr-2" /> WhatsApp
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cookie válido por 7 dias. Cada compra confirmada gera 3 MT de comissão.
            </p>
          </CardContent>
        </Card>

        {/* Sales history */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold mb-3">Histórico de vendas</h2>
            {!sales || sales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Ainda nenhuma venda. Compartilhe o link!</p>
            ) : (
              <div className="space-y-2">
                {sales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium">{s.quantidade} número(s)</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleString("pt-BR")} · {s.origem === "manual" ? "Manual (admin)" : "Automático"}
                      </p>
                    </div>
                    <p className="font-bold text-primary">+{Number(s.valor_comissao).toLocaleString("pt-BR")} MT</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawals history */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-bold mb-3">Levantamentos</h2>
            {!withdrawals || withdrawals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum pedido ainda.</p>
            ) : (
              <div className="space-y-2">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium">{Number(w.valor).toLocaleString("pt-BR")} MT</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(w.created_at).toLocaleString("pt-BR")} · {w.metodo} · {w.conta_destino}
                      </p>
                    </div>
                    <Badge variant={w.status === "pago" ? "default" : w.status === "cancelado" ? "destructive" : "secondary"}>
                      {w.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdraw dialog */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Levantamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Saldo disponível: <span className="font-bold text-primary">{Number(affiliate.saldo).toLocaleString("pt-BR")} MT</span>
            </p>
            <div className="space-y-2">
              <Label>Valor (MT) — mínimo 50 MT</Label>
              <Input type="number" min="50" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="100" />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select value={metodo} onValueChange={setMetodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="emola">eMola</SelectItem>
                  <SelectItem value="banco">Transferência Bancária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{metodo === "banco" ? "IBAN / Nº Conta" : "Número de telefone"}</Label>
              <Input value={conta} onChange={(e) => setConta(e.target.value)} placeholder={metodo === "banco" ? "PT50..." : "841234567"} />
            </div>
            <Button onClick={handleWithdraw} disabled={submitting} className="w-full rounded-xl">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />A enviar...</> : "Confirmar pedido"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, highlight }: any) => (
  <Card className={highlight ? "border-primary/40 bg-primary/5" : ""}>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`text-lg font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
    </CardContent>
  </Card>
);

export default PainelAfiliado;
