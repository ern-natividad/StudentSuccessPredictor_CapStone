import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getDashboardPath } from "../utils/authUtils";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
