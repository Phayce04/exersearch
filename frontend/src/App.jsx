import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Index from "./pages/index";
import Login from "./pages/auth/Login";
import UserHome from "./pages/user/Home";
import Profile from "./pages/user/Profile"; // ✅ untouched
import OwnerDashboard from "./pages/owner/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import Recommendations from "./pages/Recommendations";

import AdminLayout from "./pages/admin/AdminLayout";
import UserLayout from "./pages/user/UserLayout";
import OwnerLayout from "./pages/owner/OwnerLayout";
import FindGyms from './pages/user/FindGyms';
import { getUserRole } from "./utils/auth";
import AdminEquipments from "./pages/admin/AdminEquipments";
import AdminAmenities from "./pages/admin/AdminAmenities";
import AdminGyms from "./pages/admin/AdminGyms";
import "leaflet/dist/leaflet.css";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPasigGymsMap from "./pages/admin/PasigGymsMap";
import AdminOwnerApplications from "./pages/admin/AdminOwnerApplications";
import AdminProfile from "./pages/admin/Profile"; // ✅ only change

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
      {/* testroute for design*/}
    <Route path="/test-find-gyms" element={<FindGyms />} />
      {/* Standalone profile page */}
      <Route path="/profile" element={<Profile />} />

      {/* User */}
      <Route path="/home" element={<UserLayout />}>
        <Route index element={<UserHome />} />
      </Route>

      {/* Owner */}
      <Route path="/owner" element={<OwnerLayout />}>
        <Route path="dashboard" element={<OwnerDashboard />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="equipments" element={<AdminEquipments />} />
        <Route path="amenities" element={<AdminAmenities />} />
        <Route path="gyms" element={<AdminGyms />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="map" element={<AdminPasigGymsMap />} />
        <Route path="applications" element={<AdminOwnerApplications />} />
        <Route path="profile" element={<AdminProfile />} /> {/* ✅ */}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
