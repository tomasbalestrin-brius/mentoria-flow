import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FeedCleitonQuerobin from "./pages/FeedCleitonQuerobin";
import StoriesCleitonQuerobin from "./pages/StoriesCleitonQuerobin";
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
          
          {/* Feed Cleiton Querobin - Formulário duplicado */}
          <Route path="/feed-cleiton-querobin" element={<FeedCleitonQuerobin />} />
          
          {/* Stories Cleiton Querobin - Formulário duplicado */}
          <Route path="/stories-cleiton-querobin" element={<StoriesCleitonQuerobin />} />
          
          {/* Lista de formulários - APENAS via link direto */}
          <Route path="/all-forms-bethel" element={<FormList />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
