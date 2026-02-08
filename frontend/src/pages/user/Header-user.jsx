import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import "./HF.css";
import logo from "../../assets/exersearchlogo.png";
import { useAuth } from "../../authcon";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = "https://exersearch.test";
const FALLBACK_AVATAR = "https://i.pravatar.cc/60?img=12";

export default function HeaderUser() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // fallback user if context is slow
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(false);

  const containerRef = useRef(null);
  const token = localStorage.getItem("token");

  const effectiveUser = user || me;

  // fetch /me if needed
  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      if (!token) return;
      setMeLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/v1/me`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        if (!mounted) return;
        setMe(res.data || null);
      } catch (err) {
        console.log("[HeaderUser] /me failed:", err?.response?.status);
      } finally {
        if (mounted) setMeLoading(false);
      }
    }

    if (!user && !me && token) loadMe();
    return () => (mounted = false);
  }, [user, me, token]);

  // avatar resolver
  const avatarSrc = useMemo(() => {
    const u = effectiveUser;
    if (!u) return FALLBACK_AVATAR;

    const raw =
      u?.admin_profile?.avatar_url ||
      u?.owner_profile?.profile_photo_url ||
      u?.user_profile?.profile_photo_url ||
      u?.adminProfile?.avatar_url ||
      u?.ownerProfile?.profile_photo_url ||
      u?.userProfile?.profile_photo_url ||
      u?.avatar_url ||
      u?.profile_photo_url ||
      u?.photoURL ||
      u?.avatar ||
      "";

    if (!raw) return FALLBACK_AVATAR;
    if (raw.startsWith("http")) return raw;
    return `${API_BASE}${raw}`;
  }, [effectiveUser]);

  const displayName = effectiveUser?.name || (meLoading ? "Loading..." : "User");
  const displayEmail = effectiveUser?.email || "";

  // logout handler
  const handleLogout = useCallback(
    (e) => {
      if (e?.preventDefault) e.preventDefault();
      setProfileDropdown(false);
      setMobileMenuOpen(false);
      logout();
      navigate("/login", { replace: true });
    },
    [logout, navigate]
  );

  // click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdown && containerRef.current && !containerRef.current.contains(e.target)) {
        setProfileDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [profileDropdown]);

  // scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.pageYOffset > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className={`header ${isScrolled ? "header--scrolled" : ""}`}>
        <div className="logo">
          <img src={logo} alt="ExerSearch" />
        </div>

        {/* DESKTOP NAV */}
        <nav className="nav-links">
          <Link to="/home">DASHBOARD</Link>
          <Link to="/home/gyms">MY GYMS</Link>
          <Link to="/home/find-gyms">FIND GYMS</Link>

          {/* PROFILE */}
          <div className="profile-container" ref={containerRef}>
            <button
              className="profile-btn"
              type="button"
              onClick={() => setProfileDropdown((p) => !p)}
            >
              <img
                className="profile-avatar"
                src={avatarSrc}
                alt="profile"
                onError={(e) => (e.currentTarget.src = FALLBACK_AVATAR)}
              />
              <span className={`dropdown-arrow ${profileDropdown ? "open" : ""}`}>▾</span>
            </button>

            <div className={`profile-dropdown ${profileDropdown ? "open" : ""}`}>
              <div className="profile-header">
                <img
                  className="dropdown-avatar"
                  src={avatarSrc}
                  alt="profile"
                  onError={(e) => (e.currentTarget.src = FALLBACK_AVATAR)}
                />
                <div>
                  <div className="profile-name">{displayName}</div>
                  <div className="profile-email">{displayEmail || " "}</div>
                </div>
              </div>

              <div className="dropdown-divider" />

              <Link to="/home/profile" onClick={() => setProfileDropdown(false)}>
                My Profile
              </Link>

              <Link to="/home/settings" onClick={() => setProfileDropdown(false)}>
                Settings
              </Link>

              <Link to="/login" onClick={handleLogout}>
                Logout
              </Link>
            </div>
          </div>
        </nav>

        {/* HAMBURGER */}
        <div className="hamburger" onClick={() => setMobileMenuOpen((p) => !p)}>
          <span />
          <span />
          <span />
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <Link to="/home" onClick={() => setMobileMenuOpen(false)}>
          DASHBOARD
        </Link>

        <Link to="/home/gyms" onClick={() => setMobileMenuOpen(false)}>
          MY GYMS
        </Link>

        <Link to="/home/find-gyms" onClick={() => setMobileMenuOpen(false)}>
          FIND GYMS
        </Link>

        <Link to="/home/profile" onClick={() => setMobileMenuOpen(false)}>
          My Profile
        </Link>

        <Link to="/home/settings" onClick={() => setMobileMenuOpen(false)}>
          Settings
        </Link>

        <Link to="/login" onClick={handleLogout}>
          Logout
        </Link>
      </div>
    </>
  );
}
