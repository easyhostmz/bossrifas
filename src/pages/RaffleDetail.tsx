import { useParams, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Calendar, Gift, Loader2, Smartphone, CreditCard } from "lucide-react";
import Header from "@/components/Header";
import ProgressBar from "@/components/ProgressBar";
import PaymentModal from "@/components/PaymentModal";
import NumberGrid from "@/components/NumberGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLottery, initiatePayment } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RaffleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lottery, isLoading } = useLottery(id);

  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"mpesa" | "emola" | "">("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"waiting" | "success" | "error">("waiting");
  const [buying, setBuying] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Auto-detect method from phone
  const detectedMethod = (() => {
    const prefix = phone.substring(0, 2);
    if (prefix === "84" || prefix === "85") return "mpesa" as const;
    if (prefix === "86" || prefix === "87") return "emola" as const;
    return null;
  })();

  const paymentMethod = selectedMethod || detectedMethod;
  const total = lottery ? selectedNumbers.length * Number(lottery.preco_numero) : 0;

  const handleSelectionChange = useCallback((numbers: string[]) => {
    setSelectedNumbers(numbers);
  }, []);

  // Listen for realtime transaction updates
  useEffect(() => {
    if (!transactionId) return;
    const channel = supabase
      .channel(`transaction-${transactionId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "transactions",
        filter: `id=eq.${transactionId}`,
      }, (payload) => {
        const newStatus = payload.new.status;
        if (newStatus === "success") setPaymentStatus("success");
        else if (newStatus === "failed") setPaymentStatus("error");
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [transactionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <Header />
        <div className="mx-auto max-w-[85%] py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!lottery) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <Header />
        <div className="mx-auto max-w-[85%] py-20 text-center">
          <p className="text-muted-foreground">Sorteio não encontrado.</p>
        </div>
      </div>
    );
  }

  const prizes = (lottery.premios || []).map((p: any, i: number) => ({
    id: p.id || String(i),
    name: p.name || p.nome,
    description: p.description || p.descricao || "",
    image_url: p.image_url || p.imagem_url || "",
    position: p.position || i + 1,
  }));

  const handleBuy = async () => {
    if (selectedNumbers.length === 0) {
      toast.error("Selecione pelo menos um número");
      return;
    }
    if (!phone || phone.length < 9) {
      toast.error("Insira um número de telefone válido");
      return;
    }
    if (!paymentMethod) {
      toast.error("Selecione o método de pagamento (M-Pesa ou eMola)");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para comprar");
      navigate("/login");
      return;
    }

    setBuying(true);
    setPaymentStatus("waiting");
    setShowPayment(true);

    try {
      const result = await initiatePayment(lottery.id, selectedNumbers.length, phone, selectedNumbers);

      if (result.status === "success") {
        setPaymentStatus("success");
      } else if (result.debito_reference) {
        setTransactionId(result.transaction_id);
        pollDebitoStatus(result.debito_reference);
      } else {
        setTransactionId(result.transaction_id);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar pagamento");
      setPaymentStatus("error");
    } finally {
      setBuying(false);
    }
  };

  const pollDebitoStatus = async (ref: string) => {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 10000));
      try {
        const { data, error } = await supabase.functions.invoke("initiate-payment", {
          body: { action: "status", debito_reference: ref },
        });
        if (error) continue;
        if (data?.is_complete) { setPaymentStatus("success"); return; }
        if (data?.is_failed) { setPaymentStatus("error"); return; }
      } catch { /* continue */ }
    }
    toast.error("Tempo esgotado. Verifique o status no seu dashboard.");
    setPaymentStatus("error");
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header />
      <div className="mx-auto max-w-[85%] md:max-w-6xl py-6">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Info */}
          <div className="lg:col-span-3 space-y-5">
            {lottery.imagem_url && (
              <div className="overflow-hidden rounded-2xl">
                <img src={lottery.imagem_url} alt={lottery.nome} className="w-full aspect-video object-cover" />
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold md:text-3xl mb-2">{lottery.nome}</h1>
              <p className="text-muted-foreground text-sm">{lottery.descricao}</p>
            </div>

            <div className="flex gap-3 text-sm text-muted-foreground flex-wrap">
              <Badge variant="secondary">
                <Calendar className="h-3 w-3 mr-1" />
                Até {new Date(lottery.data_fim).toLocaleDateString("pt-BR")}
              </Badge>
              <Badge className={lottery.status === "ativo" ? "" : "bg-muted text-muted-foreground"}>
                {lottery.status === "ativo" ? "Ativo" : lottery.status === "sorteado" ? "Sorteado" : "Encerrado"}
              </Badge>
            </div>

            <ProgressBar sold={lottery.numeros_vendidos} total={lottery.total_numeros} size="lg" />

            {/* Prizes */}
            {prizes.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" /> Prêmios
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {prizes.map((prize: any) => (
                    <Card key={prize.id} className="overflow-hidden">
                      <CardContent className="flex items-center gap-4 p-4">
                        {prize.image_url && (
                          <img src={prize.image_url} alt={prize.name} className="h-16 w-16 rounded-xl object-cover shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-sm">{prize.name}</p>
                          <p className="text-xs text-muted-foreground">{prize.description}</p>
                          <p className="text-xs text-primary font-bold mt-1">{prize.position}º Prêmio</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Number Grid */}
            {lottery.status === "ativo" && (
              <Card>
                <CardContent className="p-4">
                  <NumberGrid
                    lotteryId={lottery.id}
                    pricePerNumber={Number(lottery.preco_numero)}
                    onSelectionChange={handleSelectionChange}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Purchase panel */}
          <div className="lg:col-span-2">
            {isLoggedIn === false ? (
              <Card className="sticky top-20">
                <CardContent className="p-6 text-center space-y-4">
                  <Smartphone className="mx-auto h-10 w-10 text-primary/40" />
                  <h3 className="text-lg font-bold">Quer participar?</h3>
                  <p className="text-sm text-muted-foreground">Crie uma conta ou faça login para comprar números e concorrer aos prêmios.</p>
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => navigate("/login")} className="w-full rounded-xl">Entrar</Button>
                    <Button variant="outline" onClick={() => navigate("/register")} className="w-full rounded-xl">Criar Conta</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
            <div className="space-y-4 sticky top-20">
              {/* Combo packages */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    💰 Compre por combos
                  </h3>
                  <p className="text-xs text-muted-foreground">Quanto mais números, maiores as chances!</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { qty: 3, label: "3 Números", price: 3 * Number(lottery.preco_numero) },
                      { qty: 5, label: "5 Números", price: 5 * Number(lottery.preco_numero) },
                      { qty: 10, label: "10 Números", price: 10 * Number(lottery.preco_numero) },
                      { qty: 20, label: "20 Números", price: 20 * Number(lottery.preco_numero) },
                    ].map(({ qty, label, price }) => (
                      <button
                        key={qty}
                        onClick={async () => {
                          // Fetch available numbers and auto-select random ones
                          const { data: availableNums } = await supabase
                            .from("lottery_numbers")
                            .select("numero")
                            .eq("lottery_id", lottery.id)
                            .eq("status", "disponivel")
                            .limit(qty);
                          if (!availableNums || availableNums.length < qty) {
                            toast.error(`Não há ${qty} números disponíveis`);
                            return;
                          }
                          const nums = availableNums.map(n => n.numero);
                          setSelectedNumbers(nums);
                          toast.success(`${qty} números aleatórios selecionados!`);
                        }}
                        className="flex flex-col items-center rounded-xl border-2 border-border hover:border-primary p-3 transition-all hover:bg-primary/5"
                      >
                        <span className="text-sm font-bold">+{qty} Números</span>
                        <span className="text-xs text-muted-foreground">
                          Por apenas: <span className="font-bold text-primary">{price.toLocaleString("pt-BR")} MT</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
              <CardContent className="p-5 space-y-5">
                <h3 className="text-lg font-bold">Comprar Números</h3>

                <div className="space-y-2">
                  <Label>Números selecionados</Label>
                  <div className="rounded-xl bg-muted/50 p-3 min-h-[40px]">
                    {selectedNumbers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Selecione números no grid ou use os combos acima</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedNumbers.sort().map(num => (
                          <span key={num} className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-1 text-xs font-mono font-bold border border-primary/20">
                            {num}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Telemóvel</Label>
                  <Input
                    type="tel"
                    placeholder="841234567"
                    maxLength={9}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  />
                  {detectedMethod && !selectedMethod && (
                    <p className="text-xs font-medium text-primary">
                      Detectado: {detectedMethod === "mpesa" ? "M-Pesa" : "eMola"}
                    </p>
                  )}
                </div>

                {/* Payment method selector */}
                <div className="space-y-2">
                  <Label>Método de Pagamento</Label>
                  <RadioGroup
                    value={paymentMethod || ""}
                    onValueChange={(v) => setSelectedMethod(v as "mpesa" | "emola")}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div>
                      <RadioGroupItem value="mpesa" id="pay-mpesa" className="peer sr-only" />
                      <Label
                        htmlFor="pay-mpesa"
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                          paymentMethod === "mpesa" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <Smartphone className={`h-6 w-6 ${paymentMethod === "mpesa" ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm font-semibold">M-Pesa</span>
                        <span className="text-[10px] text-muted-foreground">Nº 84 / 85</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="emola" id="pay-emola" className="peer sr-only" />
                      <Label
                        htmlFor="pay-emola"
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                          paymentMethod === "emola" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <CreditCard className={`h-6 w-6 ${paymentMethod === "emola" ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm font-semibold">eMola</span>
                        <span className="text-[10px] text-muted-foreground">Nº 86 / 87</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Summary */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Preço unitário</span>
                      <span>{Number(lottery.preco_numero).toLocaleString("pt-BR")} MT</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Quantidade</span>
                      <span>×{selectedNumbers.length}</span>
                    </div>
                    {paymentMethod && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Pagamento</span>
                        <span className="font-medium text-foreground">{paymentMethod === "mpesa" ? "M-Pesa" : "eMola"}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{total.toLocaleString("pt-BR")} MT</span>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleBuy}
                  disabled={buying || !paymentMethod || selectedNumbers.length === 0}
                  className="w-full rounded-xl text-base py-6 font-bold"
                  size="lg"
                >
                  {buying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : `CONFIRMAR COMPRA (${selectedNumbers.length} nº)`}
                </Button>

                <p className="text-[10px] text-center text-muted-foreground">
                  ⚡ Quanto mais números comprar, maiores as chances de ganhar!
                </p>
              </CardContent>
            </Card>
            </div>
            )}
          </div>
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => {
          setShowPayment(false);
          if (paymentStatus === "success") navigate("/dashboard");
        }}
        total={total}
        phone={phone}
        method={paymentMethod || "mpesa"}
        status={paymentStatus}
      />
    </div>
  );
};

export default RaffleDetail;
