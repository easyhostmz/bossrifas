import { useParams, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Calendar, Gift, Loader2, Smartphone, CreditCard, Upload, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import ProgressBar from "@/components/ProgressBar";
import NumberGrid from "@/components/NumberGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLottery } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PAYMENT_NUMBERS = [
  { method: "mpesa", label: "M-Pesa", number: "845306426", owner: "Divía Cumar" },
  { method: "emola", label: "eMola", number: "866410226", owner: "Hassane Ibraimo" },
  { method: "mkesh", label: "mKesh", number: "845306426", owner: "Divía Cumar" },
];

const RaffleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lottery, isLoading } = useLottery(id);

  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [comprovativoFile, setComprovativoFile] = useState<File | null>(null);
  const [comprovativoPreview, setComprovativoPreview] = useState<string>("");
  const [buying, setBuying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  const total = lottery ? selectedNumbers.length * Number(lottery.preco_numero) : 0;

  const handleSelectionChange = useCallback((numbers: string[]) => {
    setSelectedNumbers(numbers);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ficheiro muito grande. Máximo 10MB.");
        return;
      }
      setComprovativoFile(file);
      setComprovativoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (selectedNumbers.length === 0) {
      toast.error("Selecione pelo menos um número");
      return;
    }
    if (!phone || phone.length < 9) {
      toast.error("Insira um número de telefone válido");
      return;
    }
    if (!selectedMethod) {
      toast.error("Selecione o método de pagamento");
      return;
    }
    if (!comprovativoFile) {
      toast.error("Envie o comprovativo de pagamento");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para comprar");
      navigate("/login");
      return;
    }

    setBuying(true);

    try {
      // Upload comprovativo
      const fileExt = comprovativoFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("comprovativos")
        .upload(fileName, comprovativoFile);

      if (uploadError) {
        throw new Error("Erro ao enviar comprovativo. Tente novamente.");
      }

      const { data: urlData } = supabase.storage
        .from("comprovativos")
        .getPublicUrl(fileName);

      // Submit purchase via edge function
      const { data, error } = await supabase.functions.invoke("submit-purchase", {
        body: {
          lottery_id: lottery!.id,
          selected_numbers: selectedNumbers,
          telefone: phone,
          whatsapp: whatsapp || phone,
          metodo: selectedMethod,
          comprovativo_url: urlData.publicUrl,
        },
      });

      if (error) throw new Error(error.message || "Erro ao processar");
      if (data?.error) throw new Error(data.error);

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar compra");
    } finally {
      setBuying(false);
    }
  };

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

  const selectedPayment = PAYMENT_NUMBERS.find(p => p.method === selectedMethod);

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <Header />
        <div className="mx-auto max-w-md py-20 text-center space-y-6 px-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Recebemos o seu comprovativo ✅</h2>
          <p className="text-muted-foreground">
            O seu número está reservado e será confirmado após verificação do pagamento.
          </p>
          <p className="text-sm text-muted-foreground">
            A confirmação é feita rapidamente pela nossa equipa.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/dashboard")} className="w-full rounded-xl">
              Ver Meus Números
            </Button>
            <Button variant="outline" onClick={() => { setSubmitted(false); setSelectedNumbers([]); setComprovativoFile(null); setComprovativoPreview(""); }} className="w-full rounded-xl">
              Comprar Mais Números
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              {/* Payment info banner */}
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-bold text-warning">📢 Como participar:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Selecione os seus números</li>
                    <li>Faça o pagamento por M-Pesa, eMola ou mKesh</li>
                    <li>Envie o comprovativo na plataforma</li>
                    <li>Aguarde a confirmação do seu número</li>
                  </ol>
                </CardContent>
              </Card>

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
                <h3 className="text-lg font-bold">Enviar Comprovativo</h3>

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
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    type="tel"
                    placeholder="841234567 (opcional, se diferente)"
                    maxLength={9}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                  />
                </div>

                {/* Payment method selector */}
                <div className="space-y-2">
                  <Label>Método de Pagamento</Label>
                  <RadioGroup
                    value={selectedMethod}
                    onValueChange={setSelectedMethod}
                    className="grid grid-cols-3 gap-2"
                  >
                    <div>
                      <RadioGroupItem value="mpesa" id="pay-mpesa" className="peer sr-only" />
                      <Label
                        htmlFor="pay-mpesa"
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 cursor-pointer transition-all text-center ${
                          selectedMethod === "mpesa" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <Smartphone className={`h-5 w-5 ${selectedMethod === "mpesa" ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-xs font-semibold">M-Pesa</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="emola" id="pay-emola" className="peer sr-only" />
                      <Label
                        htmlFor="pay-emola"
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 cursor-pointer transition-all text-center ${
                          selectedMethod === "emola" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <CreditCard className={`h-5 w-5 ${selectedMethod === "emola" ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-xs font-semibold">eMola</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="mkesh" id="pay-mkesh" className="peer sr-only" />
                      <Label
                        htmlFor="pay-mkesh"
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 cursor-pointer transition-all text-center ${
                          selectedMethod === "mkesh" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <Phone className={`h-5 w-5 ${selectedMethod === "mkesh" ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-xs font-semibold">mKesh</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Show payment number for selected method */}
                {selectedPayment && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 space-y-2">
                      <p className="text-sm font-bold text-primary">📱 Envie o pagamento para:</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Número:</span>
                        <span className="font-bold font-mono text-lg">{selectedPayment.number}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Nome:</span>
                        <span className="font-semibold text-sm">{selectedPayment.owner}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Valor:</span>
                        <span className="font-bold text-primary">{total.toLocaleString("pt-BR")} MT</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Comprovativo upload */}
                <div className="space-y-2">
                  <Label>Comprovativo de Pagamento</Label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                      comprovativoFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}>
                      {comprovativoPreview ? (
                        <img src={comprovativoPreview} alt="Comprovativo" className="max-h-32 rounded-lg object-contain" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Toque para enviar comprovativo</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG até 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                  {comprovativoFile && (
                    <p className="text-xs text-primary font-medium">✅ {comprovativoFile.name}</p>
                  )}
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
                    {selectedMethod && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Pagamento</span>
                        <span className="font-medium text-foreground">
                          {selectedMethod === "mpesa" ? "M-Pesa" : selectedMethod === "emola" ? "eMola" : "mKesh"}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{total.toLocaleString("pt-BR")} MT</span>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleSubmit}
                  disabled={buying || !selectedMethod || selectedNumbers.length === 0 || !comprovativoFile}
                  className="w-full rounded-xl text-base py-6 font-bold"
                  size="lg"
                >
                  {buying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "ENVIAR COMPROVATIVO"}
                </Button>

                <p className="text-[10px] text-center text-muted-foreground">
                  A confirmação é feita rapidamente pela nossa equipa.
                </p>
              </CardContent>
            </Card>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaffleDetail;
