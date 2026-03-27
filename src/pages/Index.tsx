import { Loader2, Trophy, Star, Zap } from "lucide-react";
import Header from "@/components/Header";
import RaffleCard from "@/components/RaffleCard";
import { useLotteries } from "@/hooks/useSupabaseData";
import { Lottery } from "@/types";

const Index = () => {
  const { data: lotteries, isLoading } = useLotteries();

  const mapped: Lottery[] = (lotteries || []).map((l) => ({
    id: l.id,
    name: l.nome,
    description: l.descricao || "",
    image_url: l.imagem_url || "",
    price_per_number: l.preco_numero,
    total_numbers: l.total_numeros,
    sold_numbers: l.numeros_vendidos,
    start_date: l.data_inicio,
    end_date: l.data_fim,
    status: l.status,
    prizes: Array.isArray(l.premios) ? l.premios : [],
  }));

  const active = mapped.filter((l) => l.status === "active" || l.status === "ativa");

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="mx-auto flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Boss dos Prêmios</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl mb-4">
            Concorra a <span className="text-gradient">Prêmios Incríveis</span>
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Escolha seus números da sorte e concorra a prêmios extraordinários. Transparência total e sorteios verificados.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-primary" /> Sorteios verificados</div>
            <div className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> Pagamento instantâneo</div>
          </div>
        </div>
      </section>

      {/* Lotteries */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Sorteios Ativos</h2>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : active.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Nenhum sorteio ativo no momento.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((lottery) => (
              <RaffleCard key={lottery.id} lottery={lottery} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
