import { Toaster } from "@/components/ui/toaster";
import { NotificationProvider } from "./context/NotificationProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Leaves from "./pages/Leaves";
import Departments from "./pages/Departments";
import Payroll from "./pages/Payroll";
import Documents from "./pages/Documents";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login/Login";
import TeamTrack from "./pages/TeamTrack";
import AllWorkFlow from "./pages/AllWorkFlow";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ProjectManage from "./pages/Project/ProjectManager";
import Unauthorized from "./pages/Unauthorized";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <NotificationProvider> {/* ✅ correct place */}

            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/privacypolicy" element={<PrivacyPolicy />} />

              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
              <Route path="/leaves" element={<ProtectedRoute><Leaves /></ProtectedRoute>} />
              <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
              <Route path="/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/teamTrack" element={<ProtectedRoute><TeamTrack /></ProtectedRoute>} />
              <Route path="/workflow/:_id" element={<ProtectedRoute><AllWorkFlow /></ProtectedRoute>} />
              <Route path="/projectmanage" element={<ProtectedRoute><ProjectManage /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>

          </NotificationProvider>
        </BrowserRouter>

      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
export default App;