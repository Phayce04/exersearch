import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import AdminLoading from "./AdminLoading";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";

export const MAIN = "#d23f0b";

export const adminThemes = {
  light: {
    app: {
      bg: "#ffffff",
      text: "#0f1115",
      mutedText: "#55606b",
      border: "rgba(0,0,0,0.08)",
      soft: "#f7f7f7",
      soft2: "#fbfbfb",
      shadow: "0 14px 30px rgba(0,0,0,0.08)",
    },
  },
  dark: {
    app: {
      bg: "#0f1115",
      text: "#ffffff",
      mutedText: "rgba(255,255,255,0.65)",
      border: "rgba(255,255,255,0.10)",
      soft: "rgba(255,255,255,0.06)",
      soft2: "rgba(255,255,255,0.04)",
      shadow: "0 14px 30px rgba(0,0,0,0.35)",
    },
  },
};

export default function AdminLayout() {
  // ---------- BASIC STATE ----------
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState("light");

  // ---------- SIDEBAR STATE ----------
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarToggled, setSidebarToggled] = useState(false);
  const [sidebarBroken, setSidebarBroken] = useState(false);

  // ---------- ROUTER ----------
  const navigate = useNavigate();     // ✅ NOT destructured
  const location = useLocation();     // ✅ NOT destructured

  // ---------- AUTH CHECK ----------
  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const delay = new Promise((r) => setTimeout(r, 1200));

        const meRequest = axios.get("https://exersearch.test/api/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        const results = await Promise.all([meRequest, delay]);
        const meRes = results[0];

        const user = meRes.data.user || meRes.data;
        const role = user && user.role;

        if (role !== "admin" && role !== "superadmin") {
          navigate("/login");
          return;
        }

        if (!alive) return;
        setReady(true);
      } catch (err) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [navigate]);

  // ---------- CLOSE MOBILE SIDEBAR ON ROUTE CHANGE ----------
  useEffect(() => {
    if (sidebarBroken) {
      setSidebarToggled(false);
    }
  }, [location.pathname, sidebarBroken]);

  if (!ready) {
    return <AdminLoading />;
  }

  const t = adminThemes[theme].app;

  // ---------- HEADER TITLE ----------
  const headerTitle = (() => {
    const p = location.pathname;
    if (p.startsWith("/admin/owner-applications")) return "Owner Applications";
    if (p.startsWith("/admin/gyms")) return "Gyms";
    if (p.startsWith("/admin/equipments")) return "Equipments";
    if (p.startsWith("/admin/amenities")) return "Amenities";
    if (p.startsWith("/admin/users")) return "Users";
    if (p.startsWith("/admin/calendar")) return "Calendar";
    if (p.startsWith("/admin/docs")) return "Documentation";
    return "Dashboard";
  })();

  // ---------- BURGER HANDLER ----------
  const handleBurgerClick = () => {
    if (sidebarBroken) {
      setSidebarToggled((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  };

  // ---------- RENDER ----------
  return (
    <div style={{ display: "flex", height: "100vh", background: t.bg, color: t.text }}>
      {/* SIDEBAR */}
      <AdminSidebar
        theme={theme}
        setTheme={setTheme}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        toggled={sidebarToggled}
        setToggled={setSidebarToggled}
        broken={sidebarBroken}
        setBroken={setSidebarBroken}
      />

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AdminHeader
          title={headerTitle}
          theme={theme}
          setTheme={setTheme}
          collapsed={sidebarCollapsed}
          onBurgerClick={handleBurgerClick}
        />

        <main style={{ flex: 1, padding: 24, overflow: "auto" }}>
          <Outlet context={{ theme, setTheme }} />
        </main>
      </div>
    </div>
  );
}
