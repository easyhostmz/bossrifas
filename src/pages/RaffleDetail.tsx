import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLottery } from "@/hooks/useSupabaseData";
import { initiatePayment } from "@/hooks/useSupabaseData";
import Header from "@/components/Header";
import ProgressBar from "@/components/ProgressBar";
import NumberGrid from "@/components/NumberGrid";
import PaymentModal from "@/components/PaymentModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Calendar, Trophy } from "lucide-react";
import { toast } from "sonner";

const RaffleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lottery, isLoading } = useLottery(id);

  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"mpesa" | "emola">("mpesa");
  const [paying, setPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"waiting" | "success" | "error">("waiting");
  const [showPayment, setShowPayment] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
  }, []);

  const handleSelectionChange = useCallback((nums: string[]) => {
    setSelectedNumbers(nums);
  }, []);

  const total = selectedNumbers.length * (lottery?.preco_numero || 0);

  const handleBuy = async () => {
    if (!isLoggedIn) {
      toast.error("Faça login para comprar números");
      navigate("/login");
      return;
    }
    if (selectedNumbers.length === 0) {
      toast.error("Selecione pelo menos um número");
      return;
    }
    if (!phone || phone.length < 9) {
      toast.error("Informe um número de telefone válido");
      return;
    }

    setPaying(true);
    setShowPayment(true);
    setPaymentStatus("waiting");

    try {
      await initiatePayment(id!, selectedNumbers.length, phone, selectedNumbers);
      setPaymentStatus("success");
    } catch (err: any) {
      setPaymentStatus("error");
      toast.error(err.message);
    } finally {
      setPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!lottery) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20">
          <p className="text-muted-foreground">Sorteio não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/")} className="mt-4 rounded-xl">Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        {/* Lottery info */}
        <div className="glass-card overflow-hidden mb-6">
          {lottery.imagem_url && (
            <img src={lottery.imagem_url} alt={lottery.nome} className="w-full h-48 md:h-64 object-cover" />
          )}
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{lottery.nome}</h1>
            <p className="text-muted-foreground mb-4">{lottery.descricao}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Até {new Date(lottery.data_fim).toLocaleDateString("pt-BR")}</div>
              <div className="flex items-center gap-1"><Trophy className="h-4 w-4" /> {lottery.preco_numero} MT / número</div>
            </div>

            <ProgressBar sold={lottery.numeros_vendidos} total={lottery.total_numeros} />
          </div>
        </div>

        {/* Number grid */}
        <div className="glass-card p-6 mb-6">
          <NumberGrid
            lotteryId={lottery.id}
            pricePerNumber={lottery.preco_numero}
            onSelectionChange={handleSelectionChange}
          />
        </div>

        {/* Purchase section */}
        {selectedNumbers.length > 0 && (
          <div className="glass-card p-6 sticky bottom-20 md:bottom-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold">{selectedNumbers.length} número{selectedNumbers.length > 1 ? "s" : ""}</p>
                <p className="text-2xl font-bold text-primary">{total.toLocaleString("pt-BR")} MT</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <Label>Telefone para pagamento</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="84XXXXXXX" maxLength={12} />
              </div>
              <div className="flex gap-2">
                <Button variant={method === "mpesa" ? "default" : "outline"} onClick={() => setMethod("mpesa")} className="flex-1 rounded-xl">M-Pesa</Button>
                <Button variant={method === "emola" ? "default" : "outline"} onClick={() => setMethod("emola")} className="flex-1 rounded-xl">eMola</Button>
              </div>
            </div>

            <Button onClick={handleBuy} disabled={paying} className="w-full rounded-xl text-lg py-6">
              {paying ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Comprar {selectedNumbers.length} número{selectedNumbers.length > 1 ? "s" : ""} — {total.toLocaleString("pt-BR")} MT
            </Button>
          </div>
        )}
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        total={total}
        phone={phone}
        method={method}
        status={paymentStatus}
      />
    </div>
  );
};

export default RaffleDetail;
