import { Link, useLocation } from "react-router-dom";
import { Home, User, LogIn, Crown, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const Header = () => {
  const location = useLocation();
  const path = location.pathname;
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[92%] items-center justify-between md:max-w-7xl">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Boss dos Prêmios" className="h-9" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-2 md:flex">
            <Link to="/" className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${path === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              Início
            </Link>
            <Link to="/ranking" className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${path === "/ranking" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              Ranking
            </Link>
            {isLoggedIn ? (
              <>
                <Link to="/painel-afiliado" className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${path.startsWith("/painel-afiliado") || path === "/afiliados" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  Afiliado
                </Link>
                <Link to="/dashboard" className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${path === "/dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  Minha Conta
                </Link>
              </>
            ) : (
              <>
                <Link to="/afiliados" className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${path === "/afiliados" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  Afiliado
                </Link>
                <Link to="/login" className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${path === "/login" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  Entrar
                </Link>
                <Link to="/register" className="ml-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Criar Conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex h-16 max-w-[92%] items-center justify-around">
          <BottomNavItem to="/" icon={Home} label="Início" active={path === "/"} />
          <BottomNavItem to="/ranking" icon={Trophy} label="Ranking" active={path === "/ranking"} />
          {isLoggedIn ? (
            <>
              <BottomNavItem to="/painel-afiliado" icon={Crown} label="Afiliado" active={path.startsWith("/painel-afiliado") || path === "/afiliados"} />
              <BottomNavItem to="/dashboard" icon={User} label="Conta" active={path === "/dashboard"} />
            </>
          ) : (
            <>
              <BottomNavItem to="/afiliados" icon={Crown} label="Afiliado" active={path === "/afiliados"} />
              <BottomNavItem to="/login" icon={LogIn} label="Entrar" active={path === "/login"} />
            </>
          )}
        </div>
      </nav>
    </>
  );
};

const BottomNavItem = ({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active: boolean }) => (
  <Link to={to} className={`flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
    <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
    {label}
  </Link>
);

export default Header;