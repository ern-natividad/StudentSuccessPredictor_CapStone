import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Supabase's getSession() is async — avoid a flash-redirect to "/" while
  // we're still checking whether a session exists.
  if (loading) {
    return (
      <div style={{ padding: "60px 24px", textAlign: "center", color: "#777" }}>
        Loading...
      </div>
    );
  }

  if (!user.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
