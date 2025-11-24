import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FormPage from "./pages/FormPage";
import FormList from "./pages/FormList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rota raiz mantém formulário Bio (comportamento atual) */}
          <Route path="/" element={<Index />} />
          
          {/* Lista de formulários - APENAS via link direto */}
          <Route path="/all-forms-bethel" element={<FormList />} />
          
          {/* Formulários individuais */}
          <Route path="/bio" element={<FormPage formType="bio" />} />
          <Route path="/matematica" element={<FormPage formType="matematica" />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
