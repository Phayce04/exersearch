import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Index from "./pages/index";
import Login from "./pages/auth/Login";
import UserHome from "./pages/user/Home";
import Profile from "./pages/user/Profile";
import OwnerDashboard from "./pages/owner/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";

import AdminLayout from "./pages/admin/AdminLayout";
import UserLayout from "./pages/user/UserLayout";
import OwnerLayout from "./pages/owner/OwnerLayout";
import FindGyms from "./pages/user/FindGyms";
import { getUserRole } from "./utils/auth";
import AdminEquipments from "./pages/admin/AdminEquipments";
import AdminAmenities from "./pages/admin/AdminAmenities";
import AdminGyms from "./pages/admin/AdminGyms";
import "leaflet/dist/leaflet.css";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPasigGymsMap from "./pages/admin/PasigGymsMap";
import AdminOwnerApplications from "./pages/admin/AdminOwnerApplications";
import AdminProfile from "./pages/admin/Profile";
import GymResults from "./pages/user/GymResults";
import GymDetailAdmin from "./pages/admin/GymDetails";
import AdminAdmins from "./pages/admin/AdminAdmins";
import Onboarding from "./pages/user/Onboarding";
import GymResultsMatching from "./pages/user/GymResultMatching";
import Maintenance from "./pages/Maintenance";
import AdminSettings from "./pages/admin/AdminSettings";
import GymDetails from "./pages/user/GymDetails";
import SavedGyms from "./pages/user/SavedGyms";
import WorkoutWeek from "./pages/user/WorkoutWeek";
import WorkoutDayDetails from "./pages/user/WorkoutDayDetails";
import BecomeOwner from "./pages/owner/BecomeOwner";
import OwnerApplication from "./pages/owner/OwnerApplication";
import ViewGym from "./pages/owner/ViewGym";
import EditGym from "./pages/owner/EditGym";
import ViewStats from "./pages/owner/ViewStats";
import AdminExercises from "./pages/admin/AdminExercises";
import AdminWorkoutTemplates from "./pages/admin/AdminWorkoutTemplates";
import AdminTemplateDays from "./pages/admin/AdminTemplateDays";
import AdminTemplateItems from "./pages/admin/AdminTemplateItems";

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
      <Route path="/maintenance" element={<Maintenance />} />

      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />

      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/test-find-gyms" element={<FindGyms />} />
      <Route path="/test-gym-results" element={<GymResults />} />
      <Route path="/become-an-owner" element={<BecomeOwner />} />
      <Route path="/owner-application" element={<OwnerApplication />} />
      <Route path="/view-gym" element={<ViewGym />} />
      <Route path="/edit-gym" element={<EditGym />} />
      <Route path="/view-stats" element={<ViewStats />} />
      <Route path="/profile" element={<Profile />} />

<Route path="/home/*" element={<UserLayout />}>
        <Route index element={<UserHome />} />
        <Route path="profile" element={<Profile />} />
        <Route path="find-gyms" element={<FindGyms />} />
        <Route path="gym/:id" element={<GymDetails />} />
        <Route path="gym-results" element={<GymResultsMatching />} />
        <Route path="saved-gyms" element={<SavedGyms />} />
        <Route path="workout" element={<WorkoutWeek />} />
        <Route path="workout/day/:id" element={<WorkoutDayDetails />} />
      </Route>

      <Route path="/owner" element={<OwnerLayout />}>
        <Route path="dashboard" element={<OwnerDashboard />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />

        <Route path="equipments" element={<AdminEquipments />} />
        <Route path="amenities" element={<AdminAmenities />} />
        <Route path="gyms" element={<AdminGyms />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="admins" element={<AdminAdmins />} />
        <Route path="map" element={<AdminPasigGymsMap />} />
        <Route path="applications" element={<AdminOwnerApplications />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="gyms/:gymId" element={<GymDetailAdmin />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="exercises" element={<AdminExercises />} />
        <Route path="workout-templates" element={<AdminWorkoutTemplates />} />
        <Route path="template-days" element={<AdminTemplateDays />} />
        <Route path="template-items" element={<AdminTemplateItems />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
