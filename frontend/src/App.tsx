import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConversationProvider } from "./context/ConversationContext";
import Index from "./pages/Index";
import AllProperties from "./pages/AllProperties";
import PropertyDetail from "./pages/PropertyDetail";
import TechnicalSpec from "./pages/TechnicalSpec";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ConversationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/all-properties" element={<AllProperties />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/technical-spec" element={<TechnicalSpec />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ConversationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
