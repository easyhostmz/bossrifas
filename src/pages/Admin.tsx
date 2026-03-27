import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useLotteries, useAllPurchases, useAllProfiles, useAdminSettings, useLotteryResults } from "@/hooks/useSupabaseData";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, ArrowLeft, Users, Ticket, DollarSign, Trophy } from "lucide-react";
import { toast } from "sonner";
import { createLottery, performDraw } from "@/hooks/useSupabaseData";
import ImageUpload from "@/components/ImageUpload";

const Admin = () => {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: lotteries, refetch: refetchLotteries } = useLotteries();
  const { data: purchases } = useAllPurchases();
  const { data: profiles } = useAllProfiles();
  const { data: settings } = useAdminSettings();
  const { data: results } = useLotteryResults();

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    imagem_url: "",
    preco_numero: 15,
    total_numeros: 100,
    data_inicio: new Date().toISOString().split("T")[0],
    data_fim: "",
  });

  useEffect(() => {
    if (!checkingAdmin && !isAdmin) {
      toast.error("Acesso negado");
      navigate("/dashboard");
    }
  }, [isAdmin, checkingAdmin, navigate]);

  const handleCreate = async () => {
    if (!form.nome || !form.data_fim) {
      toast.error("Preencha nome e data fim");
      return;
    }
    setCreating(true);
    try {
      await createLottery(form);
      toast.success("Sorteio criado com sucesso!");
      setShowCreate(false);
      setForm({ nome: "", descricao: "", imagem_url: "", preco_numero: 15, total_numeros: 100, data_inicio: new Date().toISOString().split("T")[0], data_fim: "" });
      refetchLotteries();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDraw = async (lotteryId: string) => {
    try {
      const result = await performDraw(lotteryId);
      toast.success(`Sorteio realizado! Número vencedor: ${result.winning_number}`);
      refetchLotteries();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-5 w-5" /></Button>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> Novo Sorteio
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{profiles?.length || 0}</p><p className="text-xs text-muted-foreground">Usuários</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Ticket className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{lotteries?.length || 0}</p><p className="text-xs text-muted-foreground">Sorteios</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><DollarSign className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{purchases?.length || 0}</p><p className="text-xs text-muted-foreground">Compras</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Trophy className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{results?.length || 0}</p><p className="text-xs text-muted-foreground">Resultados</p></CardContent></Card>
        </div>

        {/* Create form */}
        {showCreate && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Criar Novo Sorteio</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do sorteio" /></div>
              <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição" /></div>
              <div><Label>Imagem</Label><ImageUpload currentUrl={form.imagem_url} onUpload={(url) => setForm({ ...form, imagem_url: url })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Preço por número (MT)</Label><Input type="number" value={form.preco_numero} onChange={(e) => setForm({ ...form, preco_numero: Number(e.target.value) })} /></div>
                <div><Label>Total de números</Label><Input type="number" value={form.total_numeros} onChange={(e) => setForm({ ...form, total_numeros: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data início</Label><Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></div>
                <div><Label>Data fim</Label><Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} /></div>
              </div>
              <Button onClick={handleCreate} disabled={creating} className="rounded-xl">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Criar Sorteio
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lotteries list */}
        <Card>
          <CardHeader><CardTitle>Sorteios</CardTitle></CardHeader>
          <CardContent>
            {!lotteries || lotteries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum sorteio criado.</p>
            ) : (
              <div className="space-y-3">
                {lotteries.map((l) => (
                  <div key={l.id} className="flex items-center justify-between border border-border rounded-xl p-4">
                    <div>
                      <p className="font-semibold">{l.nome}</p>
                      <p className="text-xs text-muted-foreground">{l.numeros_vendidos}/{l.total_numeros} vendidos • {l.preco_numero} MT</p>
                    </div>
                    <div className="flex gap-2">
                      {l.status === "ativa" && (
                        <Button size="sm" variant="outline" onClick={() => handleDraw(l.id)} className="rounded-xl">Sortear</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
