import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Crown, CheckCircle2, XCircle, Wallet, Plus, Lock, Unlock, Search } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsAdmin, useAdminSettings } from "@/hooks/useSupabaseData";
import { useAllAffiliates, useAllWithdrawals } from "@/hooks/useAffiliate";
import { useQueryClient } from "@tanstack/react-query";

const AdminAfiliados = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: affiliates, isLoading: loadingA } = useAllAffiliates();
  const { data: withdrawals } = useAllWithdrawals();
  const { data: settings } = useAdminSettings();

  const [tab, setTab] = useState<"afiliados" | "vendas" | "levantamentos" | "config">("afiliados");
  const [search, setSearch] = useState("");

  // commission setting
  const [commission, setCommission] = useState<string>("3");
  const [savingComm, setSavingComm] = useState(false);

  // manual sale modal
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualQty, setManualQty] = useState("1");
  const [submittingManual, setSubmittingManual] = useState(false);

  // adjust balance modal
  const [adjustOpen, setAdjustOpen] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState("");

  useEffect(() => {
    if (settings?.comissao_por_numero != null) setCommission(String(settings.comissao_por_numero));
  }, [settings]);

  if (adminLoading) {
    return <div className="min-h-screen flex justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) {
    navigate("/admin/login");
    return null;
  }

  const filtered = (affiliates || []).filter(a =>
    !search ||
    a.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.codigo.toLowerCase().includes(search.toLowerCase()) ||
    a.telefone.includes(search)
  );

  const handleApproveWithdrawal = async (id: string) => {
    const { error } = await supabase.from("withdrawals" as any).update({ status: "pago" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Levantamento aprovado");
    queryClient.invalidateQueries({ queryKey: ["all-withdrawals"] });
  };

  const handleCancelWithdrawal = async (id: string) => {
    const { error } = await supabase.from("withdrawals" as any).update({ status: "cancelado" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Levantamento cancelado e saldo restituído");
    queryClient.invalidateQueries({ queryKey: ["all-withdrawals"] });
    queryClient.invalidateQueries({ queryKey: ["all-affiliates"] });
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === "ativo" ? "bloqueado" : "ativo";
    const { error } = await supabase.from("affiliates" as any).update({ status: newStatus }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Afiliado ${newStatus === "ativo" ? "desbloqueado" : "bloqueado"}`);
    queryClient.invalidateQueries({ queryKey: ["all-affiliates"] });
  };

  const handleSaveCommission = async () => {
    const v = Number(commission);
    if (!v || v < 0) { toast.error("Valor inválido"); return; }
    setSavingComm(true);
    try {
      if (settings?.id) {
        const { error } = await supabase.from("admin_settings").update({ comissao_por_numero: v } as any).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("admin_settings").insert({ comissao_por_numero: v } as any);
        if (error) throw error;
      }
      toast.success("Comissão atualizada");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingComm(false);
    }
  };

  const handleManualSale = async () => {
    const qty = Number(manualQty);
    if (!manualCode.trim() || !qty || qty <= 0) { toast.error("Dados inválidos"); return; }
    setSubmittingManual(true);
    try {
      const aff = affiliates?.find(a => a.codigo.toUpperCase() === manualCode.trim().toUpperCase());
      if (!aff) throw new Error("Código não encontrado");

      const commVal = Number(settings?.comissao_por_numero ?? 3);
      const total = commVal * qty;

      // Insert manual sale (no purchase_id real → use a UUID fake for uniqueness via RPC random)
      // Workaround: generate a random uuid client-side
      const fakeId = crypto.randomUUID();
      const fakeLottery = aff.id; // placeholder, won't be queried meaningfully

      const { error: saleErr } = await supabase.from("affiliate_sales" as any).insert({
        affiliate_id: aff.id,
        purchase_id: fakeId,
        lottery_id: fakeLottery,
        quantidade: qty,
        valor_comissao: total,
        origem: "manual",
      });
      if (saleErr) throw saleErr;

      const { error: updErr } = await supabase.from("affiliates" as any).update({
        total_vendas: aff.total_vendas + qty,
        total_comissao: Number(aff.total_comissao) + total,
        saldo: Number(aff.saldo) + total,
      }).eq("id", aff.id);
      if (updErr) throw updErr;

      toast.success(`+${total} MT creditados a ${aff.nome}`);
      setShowManual(false); setManualCode(""); setManualQty("1");
      queryClient.invalidateQueries({ queryKey: ["all-affiliates"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleAdjustBalance = async (affId: string) => {
    const v = Number(adjustValue);
    if (isNaN(v)) { toast.error("Valor inválido"); return; }
    const aff = affiliates?.find(a => a.id === affId);
    if (!aff) return;
    const newSaldo = Number(aff.saldo) + v;
    if (newSaldo < 0) { toast.error("Saldo não pode ficar negativo"); return; }
    const { error } = await supabase.from("affiliates" as any).update({ saldo: newSaldo }).eq("id", affId);
    if (error) return toast.error(error.message);
    toast.success("Saldo ajustado");
    setAdjustOpen(null); setAdjustValue("");
    queryClient.invalidateQueries({ queryKey: ["all-affiliates"] });
  };

  const exportCSV = () => {
    if (!affiliates) return;
    const rows = [
      ["Nome", "Código", "Telefone", "Email", "Vendas", "Comissão Total (MT)", "Saldo (MT)", "Status"],
      ...affiliates.map(a => [
        a.nome, a.codigo, a.telefone, a.email || "",
        a.total_vendas, Number(a.total_comissao), Number(a.saldo), a.status,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `afiliados-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalSaldoDevido = (affiliates || []).reduce((s, a) => s + Number(a.saldo), 0);
  const totalComissaoPaga = (withdrawals || []).filter(w => w.status === "pago").reduce((s, w) => s + Number(w.valor), 0);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header />
      <div className="mx-auto max-w-[92%] md:max-w-7xl py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Administração</p>
            <h1 className="text-2xl md:text-3xl font-extrabold">Painel de Afiliados</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin")} className="rounded-xl">← Voltar Admin</Button>
            <Button onClick={() => setShowManual(true)} className="rounded-xl"><Plus className="h-4 w-4 mr-1" />Venda Manual</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total afiliados</p>
            <p className="text-2xl font-bold">{affiliates?.length || 0}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saldo devido</p>
            <p className="text-2xl font-bold text-primary">{totalSaldoDevido.toLocaleString("pt-BR")} MT</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Já pago</p>
            <p className="text-2xl font-bold">{totalComissaoPaga.toLocaleString("pt-BR")} MT</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pedidos pendentes</p>
            <p className="text-2xl font-bold">{(withdrawals || []).filter(w => w.status === "pendente").length}</p>
          </CardContent></Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border overflow-x-auto">
          {[
            { k: "afiliados", l: "Afiliados" },
            { k: "levantamentos", l: "Levantamentos" },
            { k: "config", l: "Configuração" },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.l}
            </button>
          ))}
        </div>

        {tab === "afiliados" && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nome, código ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Button variant="outline" onClick={exportCSV} className="rounded-xl">Exportar CSV</Button>
              </div>
              {loadingA ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Nome</TableHead><TableHead>Código</TableHead><TableHead>Telefone</TableHead>
                      <TableHead>Vendas</TableHead><TableHead>Comissão</TableHead><TableHead>Saldo</TableHead>
                      <TableHead>Status</TableHead><TableHead>Ações</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {filtered.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.nome}</TableCell>
                          <TableCell className="font-mono text-xs">{a.codigo}</TableCell>
                          <TableCell>{a.telefone}</TableCell>
                          <TableCell>{a.total_vendas}</TableCell>
                          <TableCell>{Number(a.total_comissao).toLocaleString("pt-BR")} MT</TableCell>
                          <TableCell className="font-bold text-primary">{Number(a.saldo).toLocaleString("pt-BR")} MT</TableCell>
                          <TableCell><Badge variant={a.status === "ativo" ? "default" : "destructive"}>{a.status}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => { setAdjustOpen(a.id); setAdjustValue(""); }}>
                                <Wallet className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleToggleStatus(a.id, a.status)}>
                                {a.status === "ativo" ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filtered.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">Nenhum afiliado encontrado.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "levantamentos" && (
          <Card><CardContent className="p-4">
            {!withdrawals || withdrawals.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">Nenhum pedido.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Data</TableHead><TableHead>Afiliado</TableHead><TableHead>Valor</TableHead>
                    <TableHead>Método</TableHead><TableHead>Conta</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {withdrawals.map(w => {
                      const aff = affiliates?.find(a => a.id === w.affiliate_id);
                      return (
                        <TableRow key={w.id}>
                          <TableCell className="text-xs">{new Date(w.created_at).toLocaleString("pt-BR")}</TableCell>
                          <TableCell>{aff?.nome || w.affiliate_id.slice(0, 8)}</TableCell>
                          <TableCell className="font-bold">{Number(w.valor).toLocaleString("pt-BR")} MT</TableCell>
                          <TableCell>{w.metodo}</TableCell>
                          <TableCell className="font-mono text-xs">{w.conta_destino}</TableCell>
                          <TableCell><Badge variant={w.status === "pago" ? "default" : w.status === "cancelado" ? "destructive" : "secondary"}>{w.status}</Badge></TableCell>
                          <TableCell>
                            {w.status === "pendente" && (
                              <div className="flex gap-1">
                                <Button size="sm" onClick={() => handleApproveWithdrawal(w.id)}>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />Pago
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleCancelWithdrawal(w.id)}>
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent></Card>
        )}

        {tab === "config" && (
          <Card><CardContent className="p-6 max-w-md space-y-4">
            <h3 className="font-bold">Comissão por número (MT)</h3>
            <Input type="number" value={commission} onChange={e => setCommission(e.target.value)} />
            <Button onClick={handleSaveCommission} disabled={savingComm} className="rounded-xl">
              {savingComm ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </CardContent></Card>
        )}
      </div>

      {/* Manual sale dialog */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registar Venda Manual</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Código do afiliado</Label>
              <Input value={manualCode} onChange={e => setManualCode(e.target.value.toUpperCase())} placeholder="BOSS1234" />
            </div>
            <div className="space-y-2"><Label>Quantidade de números</Label>
              <Input type="number" min="1" value={manualQty} onChange={e => setManualQty(e.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground">
              Comissão estimada: <span className="font-bold text-primary">{Number(manualQty || 0) * Number(settings?.comissao_por_numero ?? 3)} MT</span>
            </p>
            <Button onClick={handleManualSale} disabled={submittingManual} className="w-full rounded-xl">
              {submittingManual ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Registar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust balance dialog */}
      <Dialog open={!!adjustOpen} onOpenChange={(o) => !o && setAdjustOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajustar saldo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Valor (use negativo para descontar)</Label>
            <Input type="number" value={adjustValue} onChange={e => setAdjustValue(e.target.value)} placeholder="50 ou -20" />
            <Button onClick={() => adjustOpen && handleAdjustBalance(adjustOpen)} className="w-full rounded-xl">Aplicar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAfiliados;
