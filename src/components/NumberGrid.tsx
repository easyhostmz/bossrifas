import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useSupabaseData";

interface NumberItem {
  id: string;
  numero: string;
  status: string;
  user_id: string | null;
}

interface NumberGridProps {
  lotteryId: string;
  pricePerNumber: number;
  onSelectionChange: (numbers: string[]) => void;
  maxSelect?: number;
}

const PAGE_SIZE = 100;

const NumberGrid = ({ lotteryId, pricePerNumber, onSelectionChange, maxSelect = 50 }: NumberGridProps) => {
  const { data: isAdmin } = useIsAdmin();
  const [numbers, setNumbers] = useState<NumberItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchNumbers = useCallback(async (pageNum: number, searchQuery: string, adminMode: boolean) => {
    setLoading(true);
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("lottery_numbers")
        .select("id, numero, status, user_id", { count: "exact" })
        .eq("lottery_id", lotteryId);

      // Non-admin clients only see available numbers
      if (!adminMode) {
        query = query.eq("status", "disponivel");
      }

      if (searchQuery) {
        query = query.like("numero", `%${searchQuery}%`);
      }

      query = query.order("numero", { ascending: true }).range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      setNumbers((data || []) as NumberItem[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Error fetching numbers:", err);
    } finally {
      setLoading(false);
    }
  }, [lotteryId]);

  useEffect(() => {
    fetchNumbers(page, search, !!isAdmin);
  }, [page, search, fetchNumbers, isAdmin]);

  // Realtime subscription for number status changes
  useEffect(() => {
    const channel = supabase
      .channel(`lottery-numbers-${lotteryId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "lottery_numbers",
        filter: `lottery_id=eq.${lotteryId}`,
      }, (payload) => {
        const updated = payload.new as NumberItem;
        setNumbers(prev => {
          // For non-admins, drop numbers that are no longer available
          if (!isAdmin && updated.status !== "disponivel") {
            return prev.filter(n => n.id !== updated.id);
          }
          return prev.map(n =>
            n.id === updated.id ? { ...n, status: updated.status, user_id: updated.user_id } : n
          );
        });
        // Remove from selection if no longer available
        if (updated.status !== "disponivel") {
          setSelected(prev => {
            const next = new Set(prev);
            next.delete(updated.numero);
            return next;
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [lotteryId, isAdmin]);

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange(Array.from(selected));
  }, [selected, onSelectionChange]);

  const toggleNumber = (numero: string, status: string) => {
    if (status !== "disponivel") return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(numero)) {
        next.delete(numero);
      } else {
        if (next.size >= maxSelect) return prev;
        next.add(numero);
      }
      return next;
    });
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const total = selected.size * pricePerNumber;

  const getStatusColor = (numero: string, status: string) => {
    if (selected.has(numero)) return "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30";
    switch (status) {
      case "disponivel": return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer";
      case "reservado": return "bg-amber-500/15 text-amber-700 border-amber-500/30 cursor-not-allowed opacity-70";
      case "vendido": return "bg-red-500/15 text-red-700 border-red-500/30 cursor-not-allowed opacity-70";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold">Escolha seus números</h3>
          <p className="text-xs text-muted-foreground">Toque nos números verdes para selecionar</p>
        </div>
        {selected.size > 0 && (
          <div className="text-right">
            <p className="text-sm font-semibold">{selected.size} selecionado{selected.size > 1 ? "s" : ""}</p>
            <p className="text-lg font-bold text-primary">{total.toLocaleString("pt-BR")} MT</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
          <span className="text-muted-foreground">Disponível</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-amber-500/30 border border-amber-500/50" />
          <span className="text-muted-foreground">Reservado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-red-500/30 border border-red-500/50" />
          <span className="text-muted-foreground">Vendido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-primary border border-primary" />
          <span className="text-muted-foreground">Selecionado</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar número..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value.replace(/\D/g, ""));
            setPage(0);
          }}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : numbers.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum número encontrado</p>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
          {numbers.map((n) => (
            <button
              key={n.id}
              onClick={() => toggleNumber(n.numero, n.status)}
              disabled={n.status !== "disponivel" && !selected.has(n.numero)}
              className={`rounded-lg border px-1 py-2 text-xs font-mono font-semibold transition-all ${getStatusColor(n.numero, n.status)}`}
              title={n.status === "disponivel" ? "Clique para selecionar" : n.status === "reservado" ? "Reservado" : "Vendido"}
            >
              {n.numero}
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Próxima <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Selected numbers display */}
      {selected.size > 0 && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
          <p className="text-xs font-semibold text-primary mb-2">Números selecionados:</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(selected).sort().map(num => (
              <span
                key={num}
                onClick={() => toggleNumber(num, "disponivel")}
                className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-1 text-xs font-mono font-bold border border-primary/20 cursor-pointer hover:bg-primary/20"
              >
                {num} ×
              </span>
            ))}
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="mt-2 text-xs text-destructive hover:underline"
          >
            Limpar seleção
          </button>
        </div>
      )}
    </div>
  );
};

export default NumberGrid;
