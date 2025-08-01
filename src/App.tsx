import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { RoleBasedRoute } from "@/components/RoleBasedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RegisterProducer from "./pages/RegisterProducer";
import Dashboard from "./pages/Dashboard";
import DemarcateArea from "./pages/DemarcateArea";
import ProducersList from "./pages/ProducersList";
import ProducerParcelas from "./pages/ProducerParcelas";
import LoanRequest from "./pages/LoanRequest";
import BackofficeDashboard from "./pages/BackofficeDashboard";
import UserManagement from "./pages/UserManagement";
import ExtensionistasManagement from "./pages/ExtensionistasManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/register-producer" element={
              <ProtectedRoute>
                <RegisterProducer />
              </ProtectedRoute>
            } />
            <Route path="/demarcate-area" element={
              <ProtectedRoute>
                <DemarcateArea />
              </ProtectedRoute>
            } />
            <Route path="/producers" element={
              <ProtectedRoute>
                <ProducersList />
              </ProtectedRoute>
            } />
            <Route path="/producer/:producerId/parcelas" element={
              <ProtectedRoute>
                <ProducerParcelas />
              </ProtectedRoute>
            } />
            <Route path="/loan-request" element={
              <ProtectedRoute>
                <LoanRequest />
              </ProtectedRoute>
            } />
            <Route path="/backoffice" element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin', 'backoffice']}>
                  <BackofficeDashboard />
                </RoleBasedRoute>
              </ProtectedRoute>
            } />
            <Route path="/user-management" element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </RoleBasedRoute>
              </ProtectedRoute>
            } />
            <Route path="/extensionistas" element={
              <ProtectedRoute>
                <RoleBasedRoute allowedRoles={['admin', 'backoffice']}>
                  <ExtensionistasManagement />
                </RoleBasedRoute>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
