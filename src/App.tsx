import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { MobileNav, DesktopNav } from "./components/Navigation";
import Index from "./pages/Index";
import Account from "./pages/Account";
import Activities from "./pages/Activities";
import GroupDetail from "./pages/GroupDetail";
import GroupChat from "./pages/GroupChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isChatPage = location.pathname.includes('/chat');

  return (
    <div className="min-h-screen flex w-full">
      {!isChatPage && <DesktopNav />}
      <div className={`flex-1 ${!isChatPage ? 'md:ml-60' : ''}`}>
        {!isChatPage && <Header />}
        <main>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/account" element={<Account />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/group/:id" element={<GroupDetail />} />
            <Route path="/group/:id/chat" element={<GroupChat />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!isChatPage && <MobileNav />}
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
