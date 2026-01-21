import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { UserRole } from "../../types";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    console.warn(
      `[ProtectedRoute] Access Denied. User Role: ${user.role}. Required: ${allowedRoles.join(", ")}`,
    );
    // Redirect to home to avoid infinite loop if dashboard is also protected
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
