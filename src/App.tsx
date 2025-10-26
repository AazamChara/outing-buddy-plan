import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { MobileNav, DesktopNav } from "./components/Navigation";
import { useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Account from "./pages/Account";
import Activities from "./pages/Activities";
import ActivityDetail from "./pages/ActivityDetail";
import GroupDetail from "./pages/GroupDetail";
import GroupChat from "./pages/GroupChat";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isChatPage = location.pathname.includes('/chat');
  const isActivityDetailPage = location.pathname.includes('/activity/');
  const isAuthPage = location.pathname === '/auth';

  // Redirect to home if authenticated and on auth page
  if (!loading && user && isAuthPage) {
    return <Navigate to="/" replace />;
  }

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex w-full">
        {!isChatPage && !isActivityDetailPage && <DesktopNav />}
        <div className={`flex-1 ${!isChatPage && !isActivityDetailPage ? 'md:ml-60' : ''}`}>
          {!isChatPage && !isActivityDetailPage && <Header />}
          <main>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/account" element={<Account />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/activity/:id" element={<ActivityDetail />} />
              <Route path="/group/:id" element={<GroupDetail />} />
              <Route path="/group/:id/chat" element={<GroupChat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          {!isChatPage && !isActivityDetailPage && <MobileNav />}
        </div>
      </div>
    </ProtectedRoute>
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
