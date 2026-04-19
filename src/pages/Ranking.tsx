import { useEffect } from "react";
import { Loader2, Trophy, Medal, Award } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { useAffiliateRanking } from "@/hooks/useAffiliate";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Ranking = () => {
  const { data: ranking, isLoading } = useAffiliateRanking();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("ranking-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "affiliates" },
        () => queryClient.invalidateQueries({ queryKey: ["affiliate-ranking"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header />
      <div className="mx-auto max-w-[92%] md:max-w-3xl py-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-3">
            <Trophy className="h-3 w-3" /> Atualizado em tempo real
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">🏆 Ranking de Afiliados</h1>
          <p className="text-muted-foreground mt-2 text-sm">Os top 10 afiliados que mais venderam</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !ranking || ranking.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">Ainda não há vendas registadas.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-2">
              {ranking.slice(0, 10).map((r, i) => {
                const pos = i + 1;
                const medal = pos === 1 ? <Trophy className="h-5 w-5 text-yellow-500" />
                  : pos === 2 ? <Medal className="h-5 w-5 text-slate-400" />
                  : pos === 3 ? <Award className="h-5 w-5 text-amber-700" />
                  : <span className="text-sm font-bold text-muted-foreground w-5 text-center">{pos}</span>;
                return (
                  <div key={r.id} className={`flex items-center justify-between rounded-xl border p-4 ${pos <= 3 ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                        {medal}
                      </div>
                      <div>
                        <p className="font-bold">{r.nome}</p>
                        <p className="text-xs text-muted-foreground font-mono">{r.codigo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{r.total_vendas} vendas</p>
                      <p className="text-xs text-primary font-semibold">{Number(r.total_comissao).toLocaleString("pt-BR")} MT</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Ranking;
