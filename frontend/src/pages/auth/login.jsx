import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "./login.css";

import { redirectAfterAuth } from "../../utils/redirects";
import { allowedUiModes } from "../../utils/roles";
import { setUiMode } from "../../utils/appMode";

function prettyModeLabel(m) {
  if (m === "user") return "User";
  if (m === "owner") return "Owner";
  if (m === "admin") return "Admin";
  if (m === "superadmin") return "Superadmin";
  return m;
}

export default function Login() {
  const navigate = useNavigate();
  const API_BASE = "https://exersearch.test/api/v1";

  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    fullName: "",
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setFormData({
      email: "",
      password: "",
      password_confirmation: "",
      fullName: "",
    });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const hasUiChoice = (role) => (allowedUiModes(role) || []).length > 1;

  const fetchMe = async (token) => {
    const res = await axios.get(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    return res.data;
  };

  const finalizeAuth = async (token) => {
    const me = await fetchMe(token);
    setUser(me);

    if (!me?.email_verified_at) {
      navigate("/verify-email");
      return;
    }

    if (hasUiChoice(me.role)) return;

    const modes = allowedUiModes(me.role) || [];
    const onlyMode = modes[0] || "user";
    setUiMode(onlyMode);
    redirectAfterAuth(me, navigate);
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE}/auth/google`,
        { id_token: credentialResponse.credential },
        { withCredentials: true }
      );

      const token = res?.data?.token;
      if (!token) throw new Error("No token from backend");

      localStorage.setItem("token", token);
      setAuthToken(token);

      await finalizeAuth(token);
    } catch (err) {
      alert(err?.response?.data?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup" && formData.password !== formData.password_confirmation) {
      alert("Passwords do not match");
      setLoading(false);
      return;
    }

    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";

    const payload =
      mode === "login"
        ? { email: formData.email, password: formData.password }
        : {
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
            password_confirmation: formData.password_confirmation,
          };

    try {
      const res = await axios.post(`${API_BASE}${endpoint}`, payload, {
        withCredentials: true,
      });

      const token = res?.data?.token;
      if (!token) {
        alert("Authentication failed");
        return;
      }

      localStorage.setItem("token", token);
      setAuthToken(token);

      await finalizeAuth(token);
    } catch (err) {
      alert(err?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setAuthToken(token);
    finalizeAuth(token).catch(() => {
      localStorage.removeItem("token");
      setUser(null);
      setAuthToken(null);
    });
  }, [navigate]);

  const handleContinueAs = (uiMode) => {
    setUiMode(uiMode);
    redirectAfterAuth(user, navigate);
  };

  return (
    <div className="login-page">
      <div className="bg-image" />
      <div className="overlay" />

      <div className="login-container">
        <div className="image-side">
          <img src="/gymlogo.png" alt="Fitness" />
        </div>

        <div className="form-side">
          <div className="login-box">
            <h1>{mode === "login" ? "Welcome Back" : "Create Account"}</h1>

            {user && hasUiChoice(user.role) && (
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                <p style={{ margin: 0 }}>
                  Continue as <b>{user.name}</b>
                </p>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {(allowedUiModes(user.role) || []).map((m) => (
                    <button key={m} type="button" onClick={() => handleContinueAs(m)}>
                      Continue as {prettyModeLabel(m)}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("token");
                    setUser(null);
                    setAuthToken(null);
                  }}
                >
                  Logout
                </button>
              </div>
            )}

            {!user && (
              <>
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

                <div style={{ marginTop: 20, opacity: loading ? 0.6 : 1 }}>
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => alert("Google sign-in failed")}
                  />
                </div>

                <p className="toggle-text">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <span className="toggle-link" onClick={toggleMode}>
                    {mode === "login" ? "Sign Up" : "Login"}
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}