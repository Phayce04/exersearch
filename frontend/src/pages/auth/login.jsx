import React, { useState, useEffect } from "react";
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
  if (m === "superadmin") return "Superadmin";
  return m;
}

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
  const API = "https://exersearch.test/api/v1";

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

  const hasUiChoice = (role) => allowedUiModes(role).length > 1;

  const fetchMeAndRedirect = async (token) => {
    const res = await axios.get(`${API}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });

    const me = res.data;
    setUser(me);

    if (!me?.email_verified_at) {
      navigate("/verify-email");
      return;
    }

    if (hasUiChoice(me.role)) {
      return;
    }

    setUiMode("user");
    redirectAfterAuth(me, navigate);
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await axios.post(`${API}/auth/google`, {
        id_token: credentialResponse.credential,
      });

      localStorage.setItem("token", res.data.token);
      await fetchMeAndRedirect(res.data.token);
    } catch (err) {
      alert("Google sign-in failed");
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
      const response = await axios.post(`${API}${endpoint}`, payload);
      const data = response.data;

      if (!data?.token) {
        alert("Authentication failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      await fetchMeAndRedirect(data.token);
    } catch (error) {
      alert(error.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

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

                <div style={{ marginTop: 20 }}>
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => alert("Google sign-in failed")}
                  />
                </div>
              </>
            )}

            <p className="toggle-text">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
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