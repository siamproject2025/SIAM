import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../authentication/AuthProvider"; // o como tengas tu AuthProvider

const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    // Si ya hay usuario logueado, redirige a home
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
