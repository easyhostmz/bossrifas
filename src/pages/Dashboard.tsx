import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMyPurchases, useIsAdmin } from "@/hooks/useSupabaseData";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, ShieldCheck, Ticket, CreditCard } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { data: purchases, isLoading: loadingPurchases } = useMyPurchases();
  const { data: isAdmin } = useIsAdmin();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);
      supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
        setProfile(data);
        setLoadingAuth(false);
      });
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate("/");
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    confirmed: "Confirmado",
    cancelled: "Cancelado",
  };

  const statusVariant = (s: string) => {
    if (s === "paid" || s === "confirmed") return "default" as const;
    if (s === "pending") return "secondary" as const;
    return "destructive" as const;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">{profile?.nome_completo || "Utilizador"}</h1>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <p className="text-sm text-muted-foreground">{profile?.telefone}</p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate("/admin")} className="rounded-xl">
                  <ShieldCheck className="h-4 w-4 mr-2" /> Painel Admin
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout} className="rounded-xl">
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Purchases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" /> Minhas Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPurchases ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : !purchases || purchases.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma compra ainda.</p>
                <Button variant="outline" onClick={() => navigate("/")} className="mt-4 rounded-xl">Ver Sorteios</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div>
                      <p className="font-semibold text-sm">{p.quantidade} número{p.quantidade > 1 ? "s" : ""}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{p.valor_total.toLocaleString("pt-BR")} MT</p>
                      <Badge variant={statusVariant(p.status)}>{statusLabel[p.status] || p.status}</Badge>
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

export default Dashboard;
