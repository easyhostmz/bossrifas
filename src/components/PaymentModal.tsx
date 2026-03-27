import { X, Loader2, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  phone: string;
  method: "mpesa" | "emola";
  status: "waiting" | "success" | "error";
}

const PaymentModal = ({ open, onClose, total, phone, method, status }: PaymentModalProps) => {
  if (!open) return null;

  const methodLabel = method === "mpesa" ? "M-Pesa" : "eMola";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md p-6 animate-slide-up relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          {status === "waiting" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Smartphone className="h-8 w-8 text-primary animate-pulse-glow" />
              </div>
              <h3 className="text-xl font-bold mb-2">Aguardando Pagamento</h3>
              <p className="text-muted-foreground mb-6">Confirme o pagamento no seu telemóvel</p>
              <div className="space-y-3 rounded-xl bg-secondary p-4 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-bold text-primary">{total.toLocaleString("pt-BR")} MT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Número</span>
                  <span className="font-medium">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método</span>
                  <span className="font-medium">{methodLabel}</span>
                </div>
              </div>
              <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-primary" />
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Pagamento Confirmado!</h3>
              <p className="text-muted-foreground mb-6">Os seus números foram reservados com sucesso.</p>
              <Button onClick={onClose} className="w-full rounded-xl">Ver Meus Números</Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2">Pagamento Falhou</h3>
              <p className="text-muted-foreground mb-6">Não foi possível processar o pagamento. Tente novamente.</p>
              <Button onClick={onClose} variant="outline" className="w-full rounded-xl">Tentar Novamente</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
