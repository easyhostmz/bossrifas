import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="text-center">
      <h1 className="text-6xl font-extrabold text-primary mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-6">Página não encontrada</p>
      <Link to="/"><Button className="rounded-xl">Voltar ao Início</Button></Link>
    </div>
  </div>
);

export default NotFound;
