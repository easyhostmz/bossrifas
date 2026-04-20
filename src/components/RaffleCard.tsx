import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { Lottery } from "@/types";
import ProgressBar from "./ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/useSupabaseData";

interface RaffleCardProps {
  lottery: Lottery;
}

const RaffleCard = ({ lottery }: RaffleCardProps) => {
  const { data: isAdmin } = useIsAdmin();
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(lottery.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30 group">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={lottery.image_url}
          alt={lottery.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <Badge variant="secondary" className="backdrop-blur-sm">
            <Clock className="h-3 w-3 mr-1" />
            {daysLeft} dias
          </Badge>
        </div>
        <Badge className="absolute top-3 right-3 text-xs font-bold">
          {lottery.price_per_number.toLocaleString("pt-BR")} MT
        </Badge>
      </div>

      <CardContent className="p-4">
        <h3 className="mb-1.5 text-lg font-bold">{lottery.name}</h3>
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{lottery.description}</p>

        {isAdmin && (
          <ProgressBar sold={lottery.sold_numbers} total={lottery.total_numbers} size="sm" />
        )}

        <Link to={`/raffle/${lottery.id}`} className="mt-4 block">
          <Button className="w-full rounded-xl group/btn">
            Comprar Agora
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default RaffleCard;