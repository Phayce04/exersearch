import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Index from "./pages/index";
import Login from "./pages/auth/Login";
import UserHome from "./pages/user/Home";
import OwnerDashboard from "./pages/owner/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import Recommendations from "./pages/Recommendations";

import { getUserRole } from "./utils/auth";

function ProtectedRoutes({ children }) {
  const [role, setRole] = useState(getUserRole());
  const navigate = useNavigate();

  useEffect(() => {
    const r = getUserRole();
    setRole(r);

    if (r === "user") navigate("/home");
    else if (r === "owner") navigate("/owner/dashboard");
    else if (r === "superadmin") navigate("/admin/dashboard");
  }, [navigate]);

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />

      <Route path="/home" element={<ProtectedRoutes><UserHome /></ProtectedRoutes>} />

      <Route path="/owner/dashboard" element={<ProtectedRoutes><OwnerDashboard /></ProtectedRoutes>} />

      <Route path="/admin/dashboard" element={<ProtectedRoutes><AdminDashboard /></ProtectedRoutes>} />
      <Route path="/recommendations" element={<Recommendations />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
