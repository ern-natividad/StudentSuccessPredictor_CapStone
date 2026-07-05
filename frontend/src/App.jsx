import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DashboardProvider } from "./contexts/DashboardContext";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import MainLayout from "./components/Common/MainLayout";
import "./styles/globals.css";
import HomePage from "./pages/Home";
import AuthPage from "./components/Auth/AuthPage";
import ResetPasswordPage from "./components/Auth/ResetPasswordPage";
import DashboardLayout from "./components/Common/DashboardLayout";
import AdminDashboard from "./features/admin/components/AdminDashboard";
import StaffDashboard from "./features/staff/pages/StaffDashboard";
import PreEnrollmentModule from "./features/student/pages/PreEnrollmentModule";
import AcademicPerformanceModule from "./features/student/pages/AcademicPerformanceModule";
import WhatIfSimulator from "./features/student/pages/WhatIfSimulator";
import AIAcademicAdvisingModule from "./features/student/pages/AIAcademicAdvisingModule";
import UnauthorizedPage from "./pages/Unauthorized";
import CurriculumManager from "./features/admin/pages/CurriculumManager";
import CurriculumViewer from "./features/student/pages/CurriculumViewer";
import AccountSettingsPage from "./features/common/pages/AccountSettingsPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/:role" element={<AuthPage />} />

          {/* Landing target for Supabase password-reset emails */}
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

          {/* Public access to degree recommendation for prospective students */}
          <Route path="/pre-enrollment" element={<PreEnrollmentModule />} />

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
              path="/modules/curriculum-manager"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <CurriculumManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modules/curriculum"
              element={
                <ProtectedRoute allowedRoles={["staff", "admin"]}>
                  <CurriculumViewer />
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
