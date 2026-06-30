import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DashboardProvider } from "./contexts/DashboardContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/Common/MainLayout";
import "./styles/globals.css";
import HomePage from "./pages/Home";
import AuthPage from "./components/Auth/AuthPage";
import DashboardLayout from "./components/Dashboard/DashboardLayout";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import StaffDashboard from "./components/Dashboard/StaffDashboard";
import PreEnrollmentModule from "./pages/PreEnrollmentModule";
import AcademicPerformanceModule from "./pages/AcademicPerformanceModule";
import WhatIfSimulator from "./pages/WhatIfSimulator";
import AIAcademicAdvisingModule from "./pages/AIAcademicAdvisingModule";
import UnauthorizedPage from "./pages/Unauthorized";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/:role" element={<AuthPage />} />
          
          {/* Authenticated route group with unified layout */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["student", "admin", "staff"]}>
                <DashboardProvider>
                  <MainLayout />
                </DashboardProvider>
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={["staff"]}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modules/pre-enrollment"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff"]}>
                  <PreEnrollmentModule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modules/academic-performance"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff"]}>
                  <AcademicPerformanceModule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modules/what-if-simulator"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff"]}>
                  <WhatIfSimulator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modules/ai-advising"
              element={
                <ProtectedRoute allowedRoles={["admin", "staff"]}>
                  <AIAcademicAdvisingModule />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
