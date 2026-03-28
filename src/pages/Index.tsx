import Header from "@/components/Header";
import RaffleCard from "@/components/RaffleCard";
import { useLotteries } from "@/hooks/useSupabaseData";
import { Trophy, TrendingUp, Shield, Zap, Loader2, Crown, CheckCircle, Phone, Gift, Clock } from "lucide-react";
import logo from "@/assets/logo.png";

const Index = () => {
  const { data: lotteries, isLoading } = useLotteries();

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-[92%] md:max-w-7xl relative py-10 md:py-20 text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <img src={logo} alt="Boss dos Prêmios" className="h-16 md:h-20" />
          </div>
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            <Zap className="h-3 w-3" />
            Sorteios 100% transparentes
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl mb-3">
            Concorra a prêmios
            <br />
            <span className="text-gradient">incríveis</span>
          </h1>
          <p className="mx-auto max-w-md text-muted-foreground text-base mb-6">
            Compre por apenas <span className="font-bold text-primary">15 MT</span> e concorra a iPhone 17 Pro Max, TV Plasma 50", Samsung A07, Tablets e Coluna JBL 320!
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-3 text-xs font-medium mb-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
              🎟️ Apenas 15 MT por número
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
              🏆 Mais de 10 prêmios nesta edição
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
              📊 1.000.000 números disponíveis
            </span>
          </div>
        </div>
      </section>

      {/* Highlight block */}
      <section className="mx-auto max-w-[92%] md:max-w-7xl -mt-2 mb-6">
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 p-6 md:p-8 text-center">
          <h2 className="text-xl md:text-2xl font-extrabold mb-3">
            🎯 Compre por apenas <span className="text-primary">15 MT</span> e concorra a:
          </h2>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            {["iPhone 17 Pro Max", "TV Plasma 50\"", "Samsung A07", "3× Samsung Tab 8", "3× Samsung Tab 9", "Coluna JBL 320"].map((prize) => (
              <span key={prize} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary font-semibold px-3 py-1.5 border border-primary/20">
                🎁 {prize}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm font-bold text-primary">
            ⚡ Quanto mais números comprar, maiores as chances!
          </p>
        </div>
      </section>

      {/* Manual payment notice */}
      <section className="mx-auto max-w-[92%] md:max-w-7xl mb-6">
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5 md:p-6">
          <p className="text-sm font-bold text-warning mb-3">📢 Como participar:</p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside mb-4">
            <li>Faça o pagamento por <strong>M-Pesa</strong> ou <strong>eMola</strong></li>
            <li>Envie o comprovativo na plataforma</li>
            <li>Aguarde a confirmação do seu número</li>
          </ol>
          <p className="text-xs text-muted-foreground">A confirmação é feita rapidamente pela nossa equipa.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            <div className="rounded-xl bg-background/50 p-3 text-center border border-border">
              <p className="text-xs text-muted-foreground">M-Pesa</p>
              <p className="font-bold font-mono">845306426</p>
              <p className="text-xs text-muted-foreground">Divía Cumar</p>
            </div>
            <div className="rounded-xl bg-background/50 p-3 text-center border border-border">
              <p className="text-xs text-muted-foreground">eMola</p>
              <p className="font-bold font-mono">866410226</p>
              <p className="text-xs text-muted-foreground">Hassane Ibraimo</p>
            </div>
            <div className="rounded-xl bg-background/50 p-3 text-center border border-border">
              <p className="text-xs text-muted-foreground">mKesh</p>
              <p className="font-bold font-mono">845306426</p>
              <p className="text-xs text-muted-foreground">Divía Cumar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-border/50">
        <div className="mx-auto max-w-[92%] md:max-w-7xl py-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: CheckCircle, title: "100% Transparente", desc: "Sorteios verificados publicamente" },
              { icon: Shield, title: "Pagamento Seguro", desc: "Via M-Pesa, eMola e mKesh" },
              { icon: Phone, title: "Suporte Direto", desc: "Apoio ao cliente sempre disponível" },
              { icon: Gift, title: "Prêmios Reais", desc: "Entregues aos vencedores" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 text-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conversion phrases */}
      <section className="mx-auto max-w-[92%] md:max-w-7xl py-6">
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          {[
            { icon: "🎯", text: "Garanta já o seu número" },
            { icon: "⏳", text: "Participe antes que esgote" },
            { icon: "🏆", text: "Pode sair hoje o seu prêmio" },
            { icon: "📈", text: "Entre agora e aumente suas chances" },
          ].map(({ icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 rounded-xl bg-secondary/80 px-4 py-2 font-medium">
              {icon} {text}
            </span>
          ))}
        </div>
      </section>

      {/* Sorteios */}
      <section className="mx-auto max-w-[92%] md:max-w-7xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold md:text-2xl">Sorteios Ativos</h2>
            <p className="text-sm text-muted-foreground">Escolha o seu e boa sorte!</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !lotteries || lotteries.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Crown className="mx-auto h-12 w-12 text-primary/30 mb-3" />
            <p>Nenhum sorteio disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lotteries.map((lottery) => (
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
                  status: lottery.status === "ativo" ? "active" : "ended",
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

      {/* 18+ Notice */}
      <section className="mx-auto max-w-[92%] md:max-w-7xl pb-6">
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-center">
          <p className="text-sm font-semibold text-warning">
            🔞 Participação exclusiva para maiores de 18 anos
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ao participar, você confirma ter 18 anos ou mais e estar de acordo com os termos e condições.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="mx-auto max-w-[92%] md:max-w-7xl text-center text-xs text-muted-foreground">
          <p>© 2026 Boss dos Prêmios. Todos os direitos reservados.</p>
          <p className="mt-1">🔞 Apenas para maiores de 18 anos</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
