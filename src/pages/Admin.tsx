import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Trophy, ShoppingCart, CreditCard, Settings, LogOut,
  Users, DollarSign, Hash, TrendingUp, Plus, Play, Loader2, X, Award, Filter, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  useLotteries, useAllPurchases, useAllTransactions, useAdminSettings,
  useAllProfiles, useLotteryResults, createLottery, performDraw, useIsAdmin,
  type LotteryRow, type PurchaseRow, type ProfileRow
} from "@/hooks/useSupabaseData";
import ProgressBar from "@/components/ProgressBar";
import ImageUpload from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import logo from "@/assets/logo.png";

type AdminTab = "dashboard" | "lotteries" | "purchases" | "transactions" | "users" | "settings";

const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [tab, setTab] = useState<AdminTab>("dashboard");

  const { data: lotteries, isLoading: lotteriesLoading } = useLotteries();
  const { data: purchases, isLoading: purchasesLoading } = useAllPurchases();
  const { data: transactions, isLoading: txLoading } = useAllTransactions();
  const { data: profiles, isLoading: profilesLoading } = useAllProfiles();
  const { data: results } = useLotteryResults();
  const { data: settings } = useAdminSettings();

  // Settings state
  const [apiToken, setApiToken] = useState("");
  const [walletMpesa, setWalletMpesa] = useState("");
  const [walletEmola, setWalletEmola] = useState("");
  const [walletCartao, setWalletCartao] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Create lottery modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLottery, setNewLottery] = useState({
    nome: "", descricao: "", imagem_url: "", preco_numero: 15,
    total_numeros: 10000, data_inicio: "", data_fim: "",
    premios: [{ name: "", description: "", image_url: "", position: 1 }],
  });

  // Draw result modal
  const [showDrawResult, setShowDrawResult] = useState(false);
  const [drawResult, setDrawResult] = useState<any>(null);
  const [drawing, setDrawing] = useState<string | null>(null);

  // Edit lottery modal
  const [showEdit, setShowEdit] = useState(false);
  const [editLottery, setEditLottery] = useState<LotteryRow | null>(null);
  const [editData, setEditData] = useState({
    nome: "", descricao: "", imagem_url: "", preco_numero: 15,
    total_numeros: 10000, data_fim: "",
    premios: [{ name: "", description: "", image_url: "", position: 1 }],
  });
  const [saving, setSaving] = useState(false);

  // Filters
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<string>("all");
  const [purchaseMethodFilter, setPurchaseMethodFilter] = useState<string>("all");

  useEffect(() => {
    if (settings) {
      setApiToken(settings.debito_api_token || "");
      setWalletMpesa(settings.wallet_mpesa || "");
      setWalletEmola(settings.wallet_emola || "");
      setWalletCartao(settings.wallet_card || "");
    }
  }, [settings]);

  // Redirect if not admin
  useEffect(() => {
    if (!adminLoading && isAdmin === false) {
      toast.error("Acesso restrito a administradores");
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      if (settings?.id) {
        const { error } = await supabase
          .from("admin_settings")
          .update({
            debito_api_token: apiToken,
            wallet_mpesa: walletMpesa,
            wallet_emola: walletEmola,
            wallet_card: walletCartao,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_settings")
          .insert({
            debito_api_token: apiToken,
            wallet_mpesa: walletMpesa,
            wallet_emola: walletEmola,
            wallet_card: walletCartao,
          } as any);
        if (error) throw error;
      }
      toast.success("Configurações salvas!");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateLottery = async () => {
    if (!newLottery.nome || !newLottery.data_fim) {
      toast.error("Nome e data fim são obrigatórios");
      return;
    }
    setCreating(true);
    try {
      await createLottery({
        nome: newLottery.nome,
        descricao: newLottery.descricao,
        imagem_url: newLottery.imagem_url,
        preco_numero: newLottery.preco_numero,
        total_numeros: newLottery.total_numeros,
        data_inicio: newLottery.data_inicio || new Date().toISOString(),
        data_fim: new Date(newLottery.data_fim).toISOString(),
        premios: newLottery.premios.filter(p => p.name),
      });
      toast.success("Sorteio criado com sucesso!");
      setShowCreate(false);
      setNewLottery({
        nome: "", descricao: "", imagem_url: "", preco_numero: 15,
        total_numeros: 10000, data_inicio: "", data_fim: "",
        premios: [{ name: "", description: "", image_url: "", position: 1 }],
      });
      queryClient.invalidateQueries({ queryKey: ["lotteries"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar sorteio");
    } finally {
      setCreating(false);
    }
  };

  const handleDraw = async (lottery: LotteryRow) => {
    if (lottery.status === "sorteado") {
      toast.error("Este sorteio já foi realizado");
      return;
    }
    if (lottery.numeros_vendidos === 0) {
      toast.error("Nenhum número vendido. Não é possível sortear.");
      return;
    }
    setDrawing(lottery.id);
    try {
      const data = await performDraw(lottery.id);
      if (data.success) {
        setDrawResult(data.result);
        setShowDrawResult(true);
        queryClient.invalidateQueries({ queryKey: ["lotteries"] });
        queryClient.invalidateQueries({ queryKey: ["lottery-results"] });
        toast.success("Sorteio realizado com sucesso!");
      } else {
        toast.error(data.error || "Erro ao realizar sorteio");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao realizar sorteio");
    } finally {
      setDrawing(null);
    }
  };

  const openEditModal = (lottery: LotteryRow) => {
    setEditLottery(lottery);
    const premios = (lottery.premios || []).map((p: any, i: number) => ({
      name: p.name || p.nome || "",
      description: p.description || p.descricao || "",
      image_url: p.image_url || p.imagem_url || "",
      position: p.position || i + 1,
    }));
    setEditData({
      nome: lottery.nome,
      descricao: lottery.descricao || "",
      imagem_url: lottery.imagem_url || "",
      preco_numero: Number(lottery.preco_numero),
      total_numeros: lottery.total_numeros,
      data_fim: lottery.data_fim ? new Date(lottery.data_fim).toISOString().split("T")[0] : "",
      premios: premios.length > 0 ? premios : [{ name: "", description: "", image_url: "", position: 1 }],
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editLottery) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("lotteries")
        .update({
          nome: editData.nome,
          descricao: editData.descricao,
          imagem_url: editData.imagem_url,
          preco_numero: editData.preco_numero,
          data_fim: editData.data_fim ? new Date(editData.data_fim).toISOString() : editLottery.data_fim,
          premios: editData.premios.filter(p => p.name) as any,
        } as any)
        .eq("id", editLottery.id);
      if (error) throw error;
      toast.success("Sorteio atualizado com sucesso!");
      setShowEdit(false);
      setEditLottery(null);
      queryClient.invalidateQueries({ queryKey: ["lotteries"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  // Compute user stats
  const getUserStats = (userId: string) => {
    const userPurchases = (purchases || []).filter(p => p.user_id === userId && p.status === "pago");
    const totalGasto = userPurchases.reduce((s, p) => s + Number(p.valor_total), 0);
    const totalNumeros = userPurchases.reduce((s, p) => s + p.quantidade, 0);
    return { totalGasto, totalNumeros };
  };

  // Filter purchases
  const filteredPurchases = (purchases || []).filter(p => {
    if (purchaseStatusFilter !== "all" && p.status !== purchaseStatusFilter) return false;
    if (purchaseMethodFilter !== "all" && p.metodo !== purchaseMethodFilter) return false;
    return true;
  });

  const getLotteryName = (lotteryId: string) => {
    const l = (lotteries || []).find(l => l.id === lotteryId);
    return l?.nome || lotteryId.slice(0, 8);
  };

  const getUserName = (userId: string) => {
    const p = (profiles || []).find(p => p.id === userId);
    return p?.nome_completo || userId.slice(0, 8);
  };

  if (adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabs: { key: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "lotteries", label: "Sorteios", icon: Trophy },
    { key: "purchases", label: "Compras", icon: ShoppingCart },
    { key: "transactions", label: "Transações", icon: CreditCard },
    { key: "users", label: "Clientes", icon: Users },
    { key: "settings", label: "Configurações", icon: Settings },
  ];

  const totalRevenue = (transactions || []).filter(t => t.status === "success").reduce((s, t) => s + Number(t.amount), 0);
  const totalSold = (lotteries || []).reduce((s, l) => s + l.numeros_vendidos, 0);
  const totalUsers = (profiles || []).length;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/50 bg-card/50 p-6 md:block">
        <div className="mb-8">
          <img src={logo} alt="Boss dos Prêmios" className="h-9" />
          <p className="text-xs text-muted-foreground mt-1">Painel Admin</p>
        </div>
        <nav className="space-y-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="mt-8 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="flex justify-around py-2">
          {tabs.map(({ key, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)} className={`flex flex-col items-center gap-0.5 p-2 text-xs ${tab === key ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
        {/* ===== DASHBOARD ===== */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black">Dashboard</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Arrecadado", value: `${totalRevenue.toLocaleString("pt-BR")} MT`, icon: DollarSign, color: "text-primary" },
                { label: "Números Vendidos", value: totalSold.toLocaleString("pt-BR"), icon: Hash, color: "text-info" },
                { label: "Clientes", value: totalUsers.toLocaleString("pt-BR"), icon: Users, color: "text-warning" },
                { label: "Sorteios", value: String((lotteries || []).length), icon: TrendingUp, color: "text-primary" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass-card p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <p className="text-xl font-black">{value}</p>
                </div>
              ))}
            </div>

            {results && results.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Últimos Resultados
                </h3>
                <div className="space-y-3">
                  {results.slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
                      <div>
                        <p className="font-semibold text-sm">{getLotteryName(r.lottery_id)}</p>
                        <p className="text-xs text-muted-foreground">
                          Nº {r.winning_number} · {r.winner_name} · {r.winner_phone}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.drawn_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card p-5">
              <h3 className="font-bold mb-4">Sorteios</h3>
              {lotteriesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              ) : (lotteries || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum sorteio criado.</p>
              ) : (
                <div className="space-y-4">
                  {(lotteries || []).map((l) => (
                    <div key={l.id} className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{l.nome}</p>
                          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                            l.status === "ativo" ? "bg-primary/20 text-primary" :
                            l.status === "sorteado" ? "bg-info/20 text-info" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {l.status === "ativo" ? "Ativo" : l.status === "sorteado" ? "Sorteado" : "Encerrado"}
                          </span>
                        </div>
                        <ProgressBar sold={l.numeros_vendidos} total={l.total_numeros} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== LOTTERIES ===== */}
        {tab === "lotteries" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black">Sorteios</h1>
              <Button size="sm" className="rounded-xl" onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" /> Novo Sorteio
              </Button>
            </div>
            {lotteriesLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            ) : (lotteries || []).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Nenhum sorteio criado ainda.</p>
                <Button onClick={() => setShowCreate(true)} className="rounded-xl">
                  <Plus className="mr-2 h-4 w-4" /> Criar Primeiro Sorteio
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {(lotteries || []).map((l) => {
                  const result = (results || []).find(r => r.lottery_id === l.id);
                  return (
                    <div key={l.id} className="glass-card p-5 flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {l.imagem_url && <img src={l.imagem_url} alt={l.nome} className="h-20 w-32 rounded-xl object-cover shrink-0" />}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold">{l.nome}</h3>
                            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                              l.status === "ativo" ? "bg-primary/20 text-primary" :
                              l.status === "sorteado" ? "bg-info/20 text-info" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {l.status === "ativo" ? "Ativo" : l.status === "sorteado" ? "Sorteado" : "Encerrado"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {Number(l.preco_numero)} MT/número · {l.total_numeros.toLocaleString("pt-BR")} números
                          </p>
                          <ProgressBar sold={l.numeros_vendidos} total={l.total_numeros} size="sm" />
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => openEditModal(l)}
                          >
                            <Pencil className="mr-1 h-3 w-3" /> Editar
                          </Button>
                          {l.status !== "sorteado" && (
                            <Button
                              size="sm"
                              className="rounded-xl"
                              disabled={drawing === l.id}
                              onClick={() => handleDraw(l)}
                            >
                              {drawing === l.id ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Play className="mr-1 h-3 w-3" />
                              )}
                              Sortear
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Prizes display */}
                      {l.premios && (l.premios as any[]).length > 0 && (
                        <div className="grid gap-2 sm:grid-cols-3">
                          {(l.premios as any[]).map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2">
                              {(p.image_url || p.imagem_url) && (
                                <img src={p.image_url || p.imagem_url} alt={p.name || p.nome} className="h-10 w-10 rounded-lg object-cover" />
                              )}
                              <div>
                                <p className="text-xs font-semibold">{p.name || p.nome}</p>
                                <p className="text-[10px] text-primary font-bold">{(p.position || i + 1)}º Prêmio</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {result && (
                        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 flex items-center gap-3">
                          <Award className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-primary">Vencedor: {result.winner_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Nº {result.winning_number} · Tel: {result.winner_phone} · {new Date(result.drawn_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== PURCHASES ===== */}
        {tab === "purchases" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h1 className="text-2xl font-black">Compras</h1>
              <div className="flex gap-2">
                <Select value={purchaseStatusFilter} onValueChange={setPurchaseStatusFilter}>
                  <SelectTrigger className="w-[140px] rounded-xl bg-secondary border-border text-sm">
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="falhou">Falhou</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={purchaseMethodFilter} onValueChange={setPurchaseMethodFilter}>
                  <SelectTrigger className="w-[140px] rounded-xl bg-secondary border-border text-sm">
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="emola">eMola</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {purchasesLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            ) : (
              <div className="glass-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="p-4">Usuário</th>
                      <th className="p-4">Sorteio</th>
                      <th className="p-4">Qtd</th>
                      <th className="p-4">Valor</th>
                      <th className="p-4">Método</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="p-4 font-medium">{getUserName(p.user_id)}</td>
                        <td className="p-4">{getLotteryName(p.lottery_id)}</td>
                        <td className="p-4">{p.quantidade}</td>
                        <td className="p-4">{Number(p.valor_total).toLocaleString("pt-BR")} MT</td>
                        <td className="p-4">{p.metodo === "mpesa" ? "M-Pesa" : p.metodo === "emola" ? "eMola" : "Cartão"}</td>
                        <td className="p-4">
                          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                            p.status === "pago" ? "bg-primary/20 text-primary" :
                            p.status === "pendente" ? "bg-warning/20 text-warning" :
                            "bg-destructive/20 text-destructive"
                          }`}>
                            {p.status === "pago" ? "Pago" : p.status === "pendente" ? "Pendente" : "Falhou"}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPurchases.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma compra encontrada.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== TRANSACTIONS ===== */}
        {tab === "transactions" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black">Transações</h1>
            {txLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            ) : (transactions || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma transação registrada.</p>
            ) : (
              <div className="space-y-3">
                {(transactions || []).map((t) => (
                  <div key={t.id} className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{getUserName(t.user_id)}</p>
                      <p className="text-xs text-muted-foreground">{t.msisdn} · {t.metodo === "mpesa" ? "M-Pesa" : t.metodo === "emola" ? "eMola" : "Cartão"}</p>
                      {t.debito_reference && <p className="text-xs text-muted-foreground font-mono">Ref: {t.debito_reference}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{Number(t.amount).toLocaleString("pt-BR")} MT</p>
                      <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                        t.status === "success" ? "bg-primary/20 text-primary" :
                        t.status === "pending" ? "bg-warning/20 text-warning" :
                        "bg-destructive/20 text-destructive"
                      }`}>
                        {t.status === "success" ? "Sucesso" : t.status === "pending" ? "Pendente" : "Falhou"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== USERS ===== */}
        {tab === "users" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black">Clientes</h1>
            {profilesLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            ) : (profiles || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cliente registrado.</p>
            ) : (
              <div className="glass-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="p-4">Nome</th>
                      <th className="p-4">Telefone</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Total Gasto</th>
                      <th className="p-4">Nº Comprados</th>
                      <th className="p-4">Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(profiles || []).map((p) => {
                      const stats = getUserStats(p.id);
                      return (
                        <tr key={p.id} className="border-b border-border/50">
                          <td className="p-4 font-medium">{p.nome_completo || "—"}</td>
                          <td className="p-4">{p.telefone || "—"}</td>
                          <td className="p-4 text-muted-foreground">{p.email}</td>
                          <td className="p-4 font-semibold">{stats.totalGasto.toLocaleString("pt-BR")} MT</td>
                          <td className="p-4">{stats.totalNumeros.toLocaleString("pt-BR")}</td>
                          <td className="p-4 text-muted-foreground">{new Date(p.criado_em).toLocaleDateString("pt-BR")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== SETTINGS ===== */}
        {tab === "settings" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-black">Configurações</h1>
            <div className="glass-card p-6 space-y-5 max-w-lg">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">API Token (Débito)</label>
                <Input value={apiToken} onChange={(e) => setApiToken(e.target.value)} placeholder="Token da API" className="rounded-xl bg-secondary border-border" type="password" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Wallet M-Pesa</label>
                <Input value={walletMpesa} onChange={(e) => setWalletMpesa(e.target.value)} placeholder="ID da wallet" className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Wallet eMola</label>
                <Input value={walletEmola} onChange={(e) => setWalletEmola(e.target.value)} placeholder="ID da wallet" className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Wallet Cartão</label>
                <Input value={walletCartao} onChange={(e) => setWalletCartao(e.target.value)} placeholder="ID da wallet" className="rounded-xl bg-secondary border-border" />
              </div>
              <Button className="w-full rounded-xl" onClick={handleSaveSettings} disabled={savingSettings}>
                {savingSettings ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar Configurações"}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ===== CREATE LOTTERY MODAL ===== */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Criar Novo Sorteio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Nome *</label>
              <Input value={newLottery.nome} onChange={(e) => setNewLottery({ ...newLottery, nome: e.target.value })} placeholder="Ex: Mega Sorteio" className="rounded-xl bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Descrição</label>
              <Input value={newLottery.descricao} onChange={(e) => setNewLottery({ ...newLottery, descricao: e.target.value })} placeholder="Descrição do sorteio" className="rounded-xl bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Imagem de Capa</label>
              <ImageUpload
                currentUrl={newLottery.imagem_url}
                onUpload={(url) => setNewLottery({ ...newLottery, imagem_url: url })}
                folder="covers"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Preço/Número (MT) *</label>
                <Input type="number" value={newLottery.preco_numero} onChange={(e) => setNewLottery({ ...newLottery, preco_numero: Number(e.target.value) })} className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Total de Números</label>
                <Input type="number" value={newLottery.total_numeros} onChange={(e) => setNewLottery({ ...newLottery, total_numeros: Number(e.target.value) })} className="rounded-xl bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Data Início</label>
                <Input type="date" value={newLottery.data_inicio} onChange={(e) => setNewLottery({ ...newLottery, data_inicio: e.target.value })} className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Data Fim *</label>
                <Input type="date" value={newLottery.data_fim} onChange={(e) => setNewLottery({ ...newLottery, data_fim: e.target.value })} className="rounded-xl bg-secondary border-border" />
              </div>
            </div>

            {/* Prizes with description and image */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Prêmios</label>
              {newLottery.premios.map((premio, i) => (
                <div key={i} className="space-y-2 mb-3 rounded-xl bg-secondary/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">{i + 1}º Prêmio</span>
                    {newLottery.premios.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => {
                        setNewLottery({ ...newLottery, premios: newLottery.premios.filter((_, j) => j !== i) });
                      }}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={premio.name}
                    onChange={(e) => {
                      const updated = [...newLottery.premios];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setNewLottery({ ...newLottery, premios: updated });
                    }}
                    placeholder="Nome do prêmio"
                    className="rounded-xl bg-background border-border"
                  />
                  <Input
                    value={premio.description}
                    onChange={(e) => {
                      const updated = [...newLottery.premios];
                      updated[i] = { ...updated[i], description: e.target.value };
                      setNewLottery({ ...newLottery, premios: updated });
                    }}
                    placeholder="Descrição (opcional)"
                    className="rounded-xl bg-background border-border"
                  />
                  <label className="text-xs text-muted-foreground block">Imagem do prêmio</label>
                  <ImageUpload
                    currentUrl={premio.image_url}
                    onUpload={(url) => {
                      const updated = [...newLottery.premios];
                      updated[i] = { ...updated[i], image_url: url };
                      setNewLottery({ ...newLottery, premios: updated });
                    }}
                    folder="prizes"
                  />
                </div>
              ))}
              <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => {
                setNewLottery({
                  ...newLottery,
                  premios: [...newLottery.premios, { name: "", description: "", image_url: "", position: newLottery.premios.length + 1 }],
                });
              }}>
                <Plus className="mr-1 h-3 w-3" /> Adicionar Prêmio
              </Button>
            </div>

            <Button className="w-full rounded-xl" onClick={handleCreateLottery} disabled={creating}>
              {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : "Criar Sorteio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== DRAW RESULT MODAL ===== */}
      <Dialog open={showDrawResult} onOpenChange={setShowDrawResult}>
        <DialogContent className="max-w-sm bg-background border-border text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center justify-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Resultado do Sorteio
            </DialogTitle>
          </DialogHeader>
          {drawResult && (
            <div className="space-y-4 py-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-black font-mono text-primary">{drawResult.winning_number}</p>
                <p className="text-xs text-muted-foreground mt-1">Número Vencedor</p>
              </div>
              <div className="rounded-xl bg-secondary p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencedor</span>
                  <span className="font-bold">{drawResult.winner_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefone</span>
                  <span className="font-bold">{drawResult.winner_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Vendidos</span>
                  <span className="font-bold">{drawResult.total_sold?.toLocaleString("pt-BR")}</span>
                </div>
              </div>
              <Button className="w-full rounded-xl" onClick={() => setShowDrawResult(false)}>
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== EDIT LOTTERY MODAL ===== */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Editar Sorteio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Nome</label>
              <Input value={editData.nome} onChange={(e) => setEditData({ ...editData, nome: e.target.value })} className="rounded-xl bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Descrição</label>
              <Input value={editData.descricao} onChange={(e) => setEditData({ ...editData, descricao: e.target.value })} className="rounded-xl bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Imagem de Capa</label>
              <ImageUpload
                currentUrl={editData.imagem_url}
                onUpload={(url) => setEditData({ ...editData, imagem_url: url })}
                folder="covers"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Preço/Número (MT)</label>
                <Input type="number" value={editData.preco_numero} onChange={(e) => setEditData({ ...editData, preco_numero: Number(e.target.value) })} className="rounded-xl bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Data Fim</label>
                <Input type="date" value={editData.data_fim} onChange={(e) => setEditData({ ...editData, data_fim: e.target.value })} className="rounded-xl bg-secondary border-border" />
              </div>
            </div>

            {/* Prizes with image upload */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Prêmios</label>
              {editData.premios.map((premio, i) => (
                <div key={i} className="space-y-2 mb-3 rounded-xl bg-secondary/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">{i + 1}º Prêmio</span>
                    {editData.premios.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditData({ ...editData, premios: editData.premios.filter((_, j) => j !== i) });
                      }}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={premio.name}
                    onChange={(e) => {
                      const updated = [...editData.premios];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setEditData({ ...editData, premios: updated });
                    }}
                    placeholder="Nome do prêmio"
                    className="rounded-xl bg-background border-border"
                  />
                  <Input
                    value={premio.description}
                    onChange={(e) => {
                      const updated = [...editData.premios];
                      updated[i] = { ...updated[i], description: e.target.value };
                      setEditData({ ...editData, premios: updated });
                    }}
                    placeholder="Descrição"
                    className="rounded-xl bg-background border-border"
                  />
                  <label className="text-xs text-muted-foreground block">Imagem do prêmio</label>
                  <ImageUpload
                    currentUrl={premio.image_url}
                    onUpload={(url) => {
                      const updated = [...editData.premios];
                      updated[i] = { ...updated[i], image_url: url };
                      setEditData({ ...editData, premios: updated });
                    }}
                    folder="prizes"
                  />
                </div>
              ))}
              <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => {
                setEditData({
                  ...editData,
                  premios: [...editData.premios, { name: "", description: "", image_url: "", position: editData.premios.length + 1 }],
                });
              }}>
                <Plus className="mr-1 h-3 w-3" /> Adicionar Prêmio
              </Button>
            </div>

            <Button className="w-full rounded-xl" onClick={handleSaveEdit} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
