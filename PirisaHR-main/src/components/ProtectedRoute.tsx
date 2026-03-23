import React from "react";
import { Outlet } from "react-router-dom";

const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    // Redirect to the central dashboard login instead of local login
    window.location.href = "http://167.71.206.166:3000/login";
    return null;
  }

  return <Outlet />;
};

export default ProtectedRoute;
