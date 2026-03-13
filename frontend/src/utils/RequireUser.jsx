// src/utils/RequireUser.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function RequireUser({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();
  const navigate = useNavigate();

  const [checked, setChecked] = useState(false);

  const isRealUser = !!token && role === "user";

  useEffect(() => {
    if (isRealUser) {
      setChecked(true);
      return;
    }

    let alive = true;

    const openPrompt = async () => {
      const isGuest = role === "guest";

      const result = await Swal.fire({
        icon: "info",
        title: isGuest ? "Login to continue" : "Account required",
        text: isGuest
          ? "This feature is only available to logged-in users. You can keep browsing as guest or log in to continue."
          : "You need to log in first to access this feature.",
        showCancelButton: true,
        confirmButtonText: "Go to Login",
        cancelButtonText: "Keep Browsing",
        reverseButtons: true,
        allowOutsideClick: false,
        allowEscapeKey: true,
      });

      if (!alive) return;

      if (result.isConfirmed) {
        navigate("/login", {
          replace: true,
          state: { from: location },
        });
      } else {
        navigate("/home", { replace: true });
      }

      setChecked(true);
    };

    openPrompt();

    return () => {
      alive = false;
    };
  }, [isRealUser, navigate, location, role]);

  if (!isRealUser) return null;

  return children;
}