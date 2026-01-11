import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setFormData({ email: "", password: "", fullName: "", confirmPassword: "" });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const redirectByRole = (role) => {
    if (role === "user") navigate("/home");
    else if (role === "owner") navigate("/owner/dashboard");
    else if (role === "superadmin") navigate("/admin/dashboard");
    else navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup" && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      setLoading(false);
      return;
    }

    const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";

    try {
      const response = await axios.post(
        `https://exersearch.test${endpoint}`,
        mode === "login"
          ? { email: formData.email, password: formData.password }
          : { name: formData.fullName, email: formData.email, password: formData.password },
        { withCredentials: true }
      );

      const data = response.data;

      if (data.token) {
        localStorage.setItem("token", data.token);
        setUser(data.user);
        redirectByRole(data.user.role);
      } else {
        alert("Authentication failed. Check your credentials.");
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const messages = Object.values(error.response.data.errors).flat().join("\n");
        alert(messages);
      } else {
        alert(error.response?.data?.message || "Error connecting to server.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("https://exersearch.test/api/v1/user", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        })
        .then((res) => {
          const fetchedUser = res.data.user || res.data;
          setUser(fetchedUser);
          redirectByRole(fetchedUser.role);
        })
        .catch(() => localStorage.removeItem("token"));
    }
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

            {user && <p>Logged in as: {user.name || user.fullName}</p>}

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
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              )}
              <button type="submit" disabled={loading}>
                {loading ? (mode === "login" ? "Logging in..." : "Signing up...") : mode === "login" ? "Login" : "Sign Up"}
              </button>
            </form>

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
