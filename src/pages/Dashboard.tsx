import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import RaffleCard from "@/components/RaffleCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, History, Trophy, LogOut, Loader2, Crown, Smartphone, CreditCard, ArrowRight, HelpCircle, CheckCircle2, ShoppingCart, Shield } from "lucide-react";
import { useMyPurchases, useLotteries, useIsAdmin } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pago: "bg-success/15 text-success border-success/30",
  pendente: "bg-warning/15 text-warning border-warning/30",
  falhou: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabels: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  falhou: "Falhou",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: purchases, isLoading } = useMyPurchases();
  const { data: lotteries, isLoading: lotteriesLoading } = useLotteries();
  const { data: isAdmin } = useIsAdmin();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/login");
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate("/");
  };

  const paidPurchases = (purchases || []).filter(p => p.status === "pago");
  const activeLotteries = (lotteries || []).filter(l => l.status === "ativo");

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header />
      <div className="mx-auto max-w-[85%] md:max-w-3xl py-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold md:text-2xl">Minha Conta</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus números e compras</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="default" size="sm" onClick={() => navigate("/admin")} className="gap-2">
                <Shield className="h-4 w-4" /> Painel Admin
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Ticket className="mx-auto h-6 w-6 text-primary mb-1" />
              <p className="text-2xl font-bold">{paidPurchases.reduce((s, p) => s + p.quantidade, 0)}</p>
              <p className="text-xs text-muted-foreground">Números Comprados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Crown className="mx-auto h-6 w-6 text-primary mb-1" />
              <p className="text-2xl font-bold">{paidPurchases.length}</p>
              <p className="text-xs text-muted-foreground">Compras Realizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Onboarding: Como funciona ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Como funciona?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                step: "1",
                icon: ShoppingCart,
                title: "Escolha um sorteio",
                desc: "Selecione o sorteio que deseja participar e escolha a quantidade de números.",
              },
              {
                step: "2",
                icon: Smartphone,
                title: "Pague pelo telemóvel",
                desc: "Pague via M-Pesa (84/85) ou eMola (86/87). Basta inserir o seu número e confirmar.",
              },
              {
                step: "3",
                icon: Trophy,
                title: "Concorra ao prêmio",
                desc: "Seus números ficam registrados. Se for sorteado, entraremos em contacto!",
              },
            ].map((item) => (
              <Card key={item.step} className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {item.step}
                    </div>
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment methods info */}
          <Card className="mt-3">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Métodos de pagamento aceites
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">M-Pesa</p>
                    <p className="text-xs text-muted-foreground">Números 84 / 85</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">eMola</p>
                    <p className="text-xs text-muted-foreground">Números 86 / 87</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Sorteios disponíveis ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Sorteios Disponíveis</h2>
            </div>
            <Link to="/" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {lotteriesLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : activeLotteries.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Crown className="mx-auto h-10 w-10 text-primary/30 mb-2" />
                <p className="text-sm">Nenhum sorteio disponível no momento.</p>
                <p className="text-xs mt-1">Volte em breve para novos sorteios!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activeLotteries.slice(0, 3).map((lottery) => (
                <RaffleCard
                  key={lottery.id}
                  lottery={{
                    id: lottery.id,
                    name: lottery.nome,
                    description: lottery.descricao,
                    image_url: lottery.imagem_url,
                    price_per_number: Number(lottery.preco_numero),
                    total_numbers: lottery.total_numeros,
                    sold_numbers: lottery.numeros_vendidos,
                    start_date: lottery.data_inicio,
                    end_date: lottery.data_fim,
                    status: "active",
                    prizes: (lottery.premios || []).map((p: any, i: number) => ({
                      id: p.id || String(i),
                      name: p.name || p.nome,
                      description: p.description || p.descricao || "",
                      image_url: p.image_url || p.imagem_url || "",
                      position: p.position || i + 1,
                    })),
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Meus números / Histórico ── */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="numbers">
            <TabsList className="w-full">
              <TabsTrigger value="numbers" className="flex-1"><Ticket className="mr-2 h-4 w-4" /> Meus Números</TabsTrigger>
              <TabsTrigger value="history" className="flex-1"><History className="mr-2 h-4 w-4" /> Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="numbers" className="mt-4 space-y-3">
              {paidPurchases.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Ticket className="mx-auto h-10 w-10 text-primary/30 mb-2" />
                    <p className="text-sm">Nenhum número comprado ainda.</p>
                    <p className="text-xs mt-1">Escolha um sorteio acima para começar!</p>
                  </CardContent>
                </Card>
              ) : (
                paidPurchases.map((purchase) => (
                  <Card key={purchase.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm">Sorteio</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">Aguardando sorteio</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(purchase.numeros as string[]).map((num) => (
                          <span key={num} className="inline-flex items-center justify-center rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-mono font-bold border border-primary/20">
                            {num}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-3">
              {(purchases || []).length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <History className="mx-auto h-10 w-10 text-primary/30 mb-2" />
                    <p className="text-sm">Nenhuma compra realizada.</p>
                  </CardContent>
                </Card>
              ) : (
                (purchases || []).map((purchase) => (
                  <Card key={purchase.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-sm">#{purchase.id.slice(0, 8)}</span>
                        <Badge variant="outline" className={`text-xs border ${statusColors[purchase.status] || ""}`}>
                          {statusLabels[purchase.status] || purchase.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
                        <div>
                          <p>Quantidade</p>
                          <p className="font-semibold text-foreground">{purchase.quantidade}</p>
                        </div>
                        <div>
                          <p>Valor</p>
                          <p className="font-semibold text-foreground">{Number(purchase.valor_total).toLocaleString("pt-BR")} MT</p>
                        </div>
                        <div>
                          <p>Método</p>
                          <p className="font-semibold text-foreground">{purchase.metodo === "mpesa" ? "M-Pesa" : purchase.metodo === "emola" ? "eMola" : "Cartão"}</p>
                        </div>
                        <div>
                          <p>Data</p>
                          <p className="font-semibold text-foreground">{new Date(purchase.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Dashboard;