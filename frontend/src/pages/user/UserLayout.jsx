import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import UserLoading from "./UserLoading";

// Header & Footer for all user pages
import HeaderUser from "./Header-user";
import Footer from "./Footer";

export default function UserLayout() {
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

        const minDelay = new Promise((r) => setTimeout(r, 800));
        const meReq = axios.get("https://exersearch.test/api/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        const [meRes] = await Promise.all([meReq, minDelay]);
        const fetchedUser = meRes.data.user || meRes.data;

        if (fetchedUser?.role !== "user") {
          navigate("/login");
          return;
        }

        if (!alive) return;
        setReady(true);
      } catch {
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [navigate]);

  if (!ready) return <UserLoading />;

  // ✅ Wrap all nested routes with header & footer
  return (
    <>
      <HeaderUser />
      <Outlet />
      <Footer />
    </>
  );
}
