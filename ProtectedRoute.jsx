import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ 
  children, 
  allowedUserTypes = [], 
  allowedRoles = [],
  redirectTo = "/" 
}) => {
  const { user, loading, getUserType, getRole } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)"
      }}>
        <div style={{ 
          textAlign: "center", 
          color: "white",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "10px",
          backdropFilter: "blur(10px)"
        }}>
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  const userType = getUserType();
  const userRole = getRole();

  // Check if user type is allowed
  if (allowedUserTypes.length > 0 && !allowedUserTypes.includes(userType)) {
    console.log(`Access denied: User type ${userType} not in allowed types: ${allowedUserTypes}`);
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user role is allowed (if specified)
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log(`Access denied: User role ${userRole} not in allowed roles: ${allowedRoles}`);
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;