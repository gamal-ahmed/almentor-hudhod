
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AuthGuard from "./components/AuthGuard";
import { AuthProvider } from "./lib/AuthContext";
import History from "./pages/History";
import TranscriptionDetail from "./pages/TranscriptionDetail";
import UploadPage from "./pages/UploadPage";
import WorkspacePage from "./pages/WorkspacePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* New user flow - redirects from /app to /app/upload */}
            <Route path="/app" element={
              <AuthGuard>
                <Navigate to="/app/upload" replace />
              </AuthGuard>
            } />
            
            {/* Upload/Import Page - New starting point */}
            <Route path="/app/upload" element={
              <AuthGuard>
                <UploadPage />
              </AuthGuard>
            } />
            
            {/* History Page - List of all transcriptions */}
            <Route path="/app/history" element={
              <AuthGuard>
                <History />
              </AuthGuard>
            } />
            
            {/* Transcription Detail Page - View job details */}
            <Route path="/app/transcription/:jobId" element={
              <AuthGuard>
                <TranscriptionDetail />
              </AuthGuard>
            } />
            
            {/* Workspace Page - Advanced editing, comparison, publishing */}
            <Route path="/app/workspace/:jobId" element={
              <AuthGuard>
                <WorkspacePage />
              </AuthGuard>
            } />
            
            {/* Legacy route for compatibility */}
            <Route path="/app/index" element={
              <AuthGuard>
                <Index />
              </AuthGuard>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
