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

  // local fallback user if context user is null
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(false);

  const containerRef = useRef(null);
  const token = localStorage.getItem("token");

  const effectiveUser = user || me;

  // Fetch /me when context user is null
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
        console.log("[HeaderUser] /me failed:", err?.response?.status, err?.response?.data);
      } finally {
        if (mounted) setMeLoading(false);
      }
    }

    if (!user && !me && token) loadMe();

    return () => {
      mounted = false;
    };
  }, [user, me, token]);

  // Avatar resolver (covers admin/owner/user shapes)
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

  // ✅ One reliable logout handler
  const handleLogout = useCallback(
    (e) => {
      if (e?.preventDefault) e.preventDefault();

      // close menus first
      setProfileDropdown(false);
      setMobileMenuOpen(false);

      // run logout (clear token/state)
      logout();

      // force route to login (so UI updates even if context is slow)
      navigate("/login", { replace: true });
    },
    [logout, navigate]
  );

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdown && containerRef.current && !containerRef.current.contains(event.target)) {
        setProfileDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [profileDropdown]);

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

        <nav className="nav-links">
          <Link to="/home">DASHBOARD</Link>
          <Link to="/home/gyms">MY GYMS</Link>

          {/* Profile */}
          <div className="profile-container" ref={containerRef}>
            <button
              className="profile-btn"
              onClick={() => setProfileDropdown((p) => !p)}
              type="button"
            >
              <img
                className="profile-avatar"
                src={avatarSrc}
                alt="profile"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_AVATAR;
                }}
              />
              <span className={`dropdown-arrow ${profileDropdown ? "open" : ""}`}>▾</span>
            </button>

            {/* Dropdown */}
            <div className={`profile-dropdown ${profileDropdown ? "open" : ""}`}>
              <div className="profile-header">
                <img
                  className="dropdown-avatar"
                  src={avatarSrc}
                  alt="profile"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_AVATAR;
                  }}
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

              {/* ✅ Logout looks like your other links (no # hash) */}
              <Link to="/login" onClick={handleLogout}>
                Logout
              </Link>
            </div>
          </div>
        </nav>

        {/* Mobile Hamburger */}
        <div className="hamburger" onClick={() => setMobileMenuOpen((prev) => !prev)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <Link to="/home" onClick={() => setMobileMenuOpen(false)}>
          DASHBOARD
        </Link>
        <Link to="/home/gyms" onClick={() => setMobileMenuOpen(false)}>
          MY GYMS
        </Link>
        <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
          My Profile
        </Link>
        <Link to="/home/settings" onClick={() => setMobileMenuOpen(false)}>
          Settings
        </Link>

        {/* ✅ Mobile logout same behavior */}
        <Link to="/login" onClick={handleLogout}>
          Logout
        </Link>
      </div>
    </>
  );
}
