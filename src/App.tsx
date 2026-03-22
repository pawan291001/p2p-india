import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import WalletProvider from "@/components/WalletProvider";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import MyOrders from "./pages/MyOrders";
import MyAds from "./pages/MyAds";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import SupportButton from "@/components/SupportButton";

const App = () => (
  <WalletProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/my-ads" element={<MyAds />} />
          <Route path="/my-orders" element={<MyOrders />} />
           <Route path="/admin" element={<Admin />} />
           <Route path="/about" element={<About />} />
           <Route path="/terms" element={<Terms />} />
           <Route path="/privacy" element={<Privacy />} />
           <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </WalletProvider>
);

export default App;
