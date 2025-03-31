
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import SessionDetails from "./pages/SessionDetails";
import CloudStorage from "./pages/CloudStorage";
import AuthGuard from "./components/AuthGuard";
import { AuthProvider } from "./lib/AuthContext";
import { ThemeProvider } from "./hooks/useTheme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary/20">
          <Toaster />
          <Sonner position="top-right" closeButton richColors />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/app" element={
                  <AuthGuard>
                    <Index />
                  </AuthGuard>
                } />
                <Route path="/session/:sessionTimestamp" element={
                  <AuthGuard>
                    <SessionDetails />
                  </AuthGuard>
                } />
                <Route path="/cloud-storage" element={
                  <AuthGuard>
                    <CloudStorage />
                  </AuthGuard>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
