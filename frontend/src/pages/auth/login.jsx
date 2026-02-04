import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    fullName: "",
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setFormData({
      email: "",
      password: "",
      password_confirmation: "",
      fullName: "",
    });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const redirectByRole = (role) => {
    if (role === "user") navigate("/home");
    else if (role === "owner") navigate("/owner/dashboard");
    else if (role === "admin" || role === "superadmin")
      navigate("/admin/dashboard");
    else navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (
      mode === "signup" &&
      formData.password !== formData.password_confirmation
    ) {
      alert("Passwords do not match");
      setLoading(false);
      return;
    }

    const endpoint =
      mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";

    const payload =
      mode === "login"
        ? {
            email: formData.email,
            password: formData.password,
          }
        : {
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
            password_confirmation: formData.password_confirmation,
          };

    // ✅ DEBUG LOGS (no behavior change)
    console.groupCollapsed("[AUTH] Submit");
    console.log("mode:", mode);
    console.log("endpoint:", endpoint);
    // ⚠️ Passwords are sensitive; log only for debugging locally
    console.log("payload:", payload);
    console.groupEnd();

    try {
      const response = await axios.post(
        `https://exersearch.test${endpoint}`,
        payload,
        { withCredentials: true }
      );

      // ✅ DEBUG LOGS
      console.groupCollapsed("[AUTH] Success");
      console.log("status:", response.status);
      console.log("data:", response.data);
      console.groupEnd();

      const data = response.data;

      if (data.token) {
        localStorage.setItem("token", data.token);
        setUser(data.user);
        redirectByRole(data.user.role);
      } else {
        alert("Authentication failed");
      }
    } catch (error) {
      // ✅ DEBUG LOGS (very helpful for 500s)
      console.groupCollapsed("[AUTH] Error");
      console.log("message:", error?.message);
      console.log("status:", error?.response?.status);
      console.log("response data:", error?.response?.data);
      console.log("response headers:", error?.response?.headers);
      console.log("request:", error?.request);
      console.groupEnd();

      // Keep your existing UX but include fallback to show raw server response if needed
      if (error.response?.data?.errors) {
        alert(
          Object.values(error.response.data.errors)
            .flat()
            .join("\n")
        );
      } else {
        const msg =
          error.response?.data?.message ||
          (error.response?.data
            ? JSON.stringify(error.response.data, null, 2)
            : null) ||
          "Server error";
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;

  console.groupCollapsed("[AUTH] Restore session (/me)");
  console.log("token exists:", !!token);
  console.groupEnd();

  axios
    .get("https://exersearch.test/api/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    })
    .then((res) => {
      console.groupCollapsed("[AUTH] /me success");
      console.log("status:", res.status);
      console.log("data:", res.data);
      console.groupEnd();

      const fetchedUser = res.data.user || res.data;
      setUser(fetchedUser);
      redirectByRole(fetchedUser.role);
    })
    .catch((err) => {
      console.groupCollapsed("[AUTH] /me error");
      console.log("status:", err?.response?.status);
      console.log("data:", err?.response?.data);
      console.groupEnd();

      
      localStorage.removeItem("token");
     
    });
}, []); 

  return (
    <div className="login-page">
      <div className="bg-image"></div>
      <div className="overlay"></div>

      <div className="login-container">
        <div className="image-side">
          <img src="/gymlogo.png" alt="Fitness" />
        </div>

        <div className="form-side">
          <div className="login-box">
            <h1>{mode === "login" ? "Welcome Back" : "Create Account"}</h1>

            {user && <p>Logged in as: {user.name}</p>}

            <form onSubmit={handleSubmit}>
              {mode === "signup" && (
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              {mode === "signup" && (
                <input
                  type="password"
                  name="password_confirmation"
                  placeholder="Confirm Password"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                />
              )}

              <button type="submit" disabled={loading}>
                {loading
                  ? mode === "login"
                    ? "Logging in..."
                    : "Signing up..."
                  : mode === "login"
                  ? "Login"
                  : "Sign Up"}
              </button>
            </form>

            <p className="toggle-text">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <span className="toggle-link" onClick={toggleMode}>
                {mode === "login" ? "Sign Up" : "Login"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
