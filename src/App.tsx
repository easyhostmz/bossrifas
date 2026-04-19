import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AffiliateCookieCapture from "@/components/AffiliateCookieCapture";
import Index from "./pages/Index";
import Styleguide from "./pages/Styleguide";
import NotFound from "./pages/NotFound";
import RaffleDetail from "./pages/RaffleDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Afiliados from "./pages/Afiliados";
import PainelAfiliado from "./pages/PainelAfiliado";
import Ranking from "./pages/Ranking";
import AdminAfiliados from "./pages/AdminAfiliados";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AffiliateCookieCapture />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/raffle/:id" element={<RaffleDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin-afiliados" element={<AdminAfiliados />} />
          <Route path="/afiliados" element={<Afiliados />} />
          <Route path="/painel-afiliado" element={<PainelAfiliado />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/styleguide" element={<Styleguide />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
