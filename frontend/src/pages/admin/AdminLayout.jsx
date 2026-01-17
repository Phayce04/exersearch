import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminLoading from "./AdminLoading";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const minDelay = new Promise((r) => setTimeout(r, 2000));

        const meReq = axios.get("https://exersearch.test/api/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        const [meRes] = await Promise.all([meReq, minDelay]);

        const fetchedUser = meRes.data.user || meRes.data;
        const role = fetchedUser?.role;

        if (role !== "admin" && role !== "superadmin") {
          navigate("/login");
          return;
        }

        if (!alive) return;
        setReady(true);
      } catch (e) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [navigate]);

  if (!ready) return <AdminLoading />;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: "24px" }}>
        <Outlet />
      </main>
    </div>
  );
}
