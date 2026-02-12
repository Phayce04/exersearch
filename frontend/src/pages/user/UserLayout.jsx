// ✅ WHOLE FILE: src/pages/user/UserLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import UserLoading from "./UserLoading";

// Header & Footer for all user pages
import HeaderUser from "./Header-user";
import Footer from "./Footer";

import { api } from "../../utils/apiClient";

export default function UserLayout() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const minDelay = new Promise((r) => setTimeout(r, 800));

        // ✅ USE apiClient so maintenance 503 redirect works
        const meReq = api.get("/me");

        const [meRes] = await Promise.all([meReq, minDelay]);
        const fetchedUser = meRes.data.user || meRes.data;

        if (fetchedUser?.role !== "user") {
          navigate("/login", { replace: true });
          return;
        }

        if (!alive) return;
        setReady(true);
      } catch (err) {
        // ✅ If maintenance, go to maintenance page (not login)
        if (err?.response?.status === 503) {
          navigate("/maintenance", { replace: true });
          return;
        }

        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [navigate]);

  if (!ready) return <UserLoading />;

  return (
    <>
      <HeaderUser />
      <Outlet />
      <Footer />
    </>
  );
}
