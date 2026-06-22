import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DashboardProvider } from "./contexts/DashboardContext";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles/globals.css";
import HomePage from "./pages/Home";
import AuthPage from "./components/Auth/AuthPage";
import DashboardLayout from "./components/Dashboard/DashboardLayout";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import StaffDashboard from "./components/Dashboard/StaffDashboard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/:role" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <DashboardProvider>
                  <DashboardLayout />
                </DashboardProvider>
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
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
