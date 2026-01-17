import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Index from "./pages/index";
import Login from "./pages/auth/Login";
import UserHome from "./pages/user/Home";
import Profile from "./pages/user/Profile";
import OwnerDashboard from "./pages/owner/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import Recommendations from "./pages/Recommendations";

import AdminLayout from "./pages/admin/AdminLayout";
import UserLayout from "./pages/user/UserLayout";
import OwnerLayout from "./pages/owner/OwnerLayout";

import { getUserRole } from "./utils/auth";

// Optional: protected route logic (redirect based on role)
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

      {/* Standalone profile page */}
      <Route path="/profile" element={<Profile />} />

      {/* Other routes */}
      <Route path="/home" element={<UserLayout />}>
        <Route index element={<UserHome />} />
      </Route>

      <Route path="/owner/dashboard" element={<OwnerDashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
