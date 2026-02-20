// ✅ src/components/header/HeaderUserNoScroll.jsx
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import "./HFUserNoScroll.css";
import fallbackLogo from "../../assets/exersearchlogo.png";
import { useAuth } from "../../authcon";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = "https://exersearch.test";
const FALLBACK_AVATAR = "https://i.pravatar.cc/60?img=12";
const TOKEN_KEY = "token";
const UI_MODE_KEY = "ui_mode";

const ROLE_LEVEL = {
  user: 1,
  owner: 2,
  superadmin: 3,
};

function roleLevel(role) {
  return ROLE_LEVEL[role] ?? 0;
}
function hasAtLeastRole(role, required) {
  return roleLevel(role) >= roleLevel(required);
}

function toAbsUrl(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const base = String(API_BASE || "").replace(/\/$/, "");
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${base}${path}`;
}

function allowedUiModesForRole(role) {
  const lvl = roleLevel(role);
  const modes = [];
  if (lvl >= ROLE_LEVEL.owner) modes.push("owner");
  if (lvl >= ROLE_LEVEL.superadmin) modes.push("superadmin");
  return modes;
}

function routeForUiMode(mode) {
  if (mode === "owner") return "/owner/dashboard";
  if (mode === "superadmin") return "/admin/dashboard";
  return "/home";
}

function labelForUiMode(mode) {
  if (mode === "owner") return "Owner UI";
  if (mode === "superadmin") return "Superadmin UI";
  return "";
}

export default function HeaderUserNoScroll() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(false);
  const [userLogoUrl, setUserLogoUrl] = useState("");

  const containerRef = useRef(null);
  const token = localStorage.getItem(TOKEN_KEY);
  const effectiveUser = user || me;

  // load /me if auth context isn't ready
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
        console.log("[HeaderUserNoScroll] /me failed:", err?.response?.status);
      } finally {
        if (mounted) setMeLoading(false);
      }
    }

    if (!user && !me && token) loadMe();
    return () => {
      mounted = false;
    };
  }, [user, me, token]);

  // load public logo
  useEffect(() => {
    let mounted = true;

    async function loadUserLogo() {
      try {
        const res = await axios.get(`${API_BASE}/api/v1/settings/public`, {
          withCredentials: true,
        });
        const data = res.data?.data ?? res.data;
        const url = data?.user_logo_url || "";
        if (!mounted) return;
        setUserLogoUrl(toAbsUrl(url));
      } catch (err) {
        if (mounted) setUserLogoUrl("");
      }
    }

    loadUserLogo();
    return () => {
      mounted = false;
    };
  }, []);

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
    return toAbsUrl(raw);
  }, [effectiveUser]);

  const displayName = effectiveUser?.name || (meLoading ? "Loading..." : "User");
  const displayEmail = effectiveUser?.email || "";

  const isOwnerPlus = hasAtLeastRole(effectiveUser?.role, "owner");
  const switchModes = isOwnerPlus ? allowedUiModesForRole(effectiveUser?.role) : [];

  const handleSwitchUi = useCallback(
    (mode) => {
      localStorage.setItem(UI_MODE_KEY, mode);
      setProfileDropdown(false);
      setMobileMenuOpen(false);
      navigate(routeForUiMode(mode));
    },
    [navigate]
  );

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

  // click-outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdown && containerRef.current && !containerRef.current.contains(e.target)) {
        setProfileDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [profileDropdown]);

  const appLogo = userLogoUrl || fallbackLogo;

  return (
    <>
      {/* ✅ Always visible logo (no scroll logic) */}
      <div className="hfns-topLogo">
        <div
          style={{ cursor: "pointer" }}
          onClick={() => {
            setMobileMenuOpen(false);
            setProfileDropdown(false);
            navigate("/home");
          }}
        >
          <img
            src={appLogo}
            alt="ExerSearch Logo"
            onError={(e) => {
              e.currentTarget.src = fallbackLogo;
            }}
          />
        </div>
      </div>

      {/* ✅ Always visible header (no translate / no scroll class toggles) */}
      <header className="hfns-header">
        {/* keep space aligned; can show or hide logo inside header if you want */}
        <div
          className="hfns-logo"
          onClick={() => {
            setMobileMenuOpen(false);
            setProfileDropdown(false);
            navigate("/home");
          }}
          style={{ cursor: "pointer" }}
        >
          <img
            src={appLogo}
            alt="ExerSearch"
            onError={(e) => {
              e.currentTarget.src = fallbackLogo;
            }}
          />
        </div>

        <nav className="hfns-navLinks">
          <Link to="/home/saved-gyms" onClick={() => setMobileMenuOpen(false)}>
            SAVED GYMS
          </Link>

          <Link to="/home/find-gyms" onClick={() => setMobileMenuOpen(false)}>
            FIND GYMS
          </Link>

          <Link to="/home/workout" onClick={() => setMobileMenuOpen(false)}>
            WORKOUT PLAN
          </Link>

          <div className="hfns-profile" ref={containerRef}>
            <button
              className="hfns-profileBtn"
              type="button"
              onClick={() => setProfileDropdown((p) => !p)}
            >
              <img
                className="hfns-profileAvatar"
                src={avatarSrc}
                alt="profile"
                onError={(e) => (e.currentTarget.src = FALLBACK_AVATAR)}
              />
              <span className={`hfns-dropdownArrow ${profileDropdown ? "open" : ""}`}>▾</span>
            </button>

            <div className={`hfns-profileDropdown ${profileDropdown ? "open" : ""}`}>
              <div className="hfns-profileHeader">
                <img
                  className="hfns-dropdownAvatar"
                  src={avatarSrc}
                  alt="profile"
                  onError={(e) => (e.currentTarget.src = FALLBACK_AVATAR)}
                />
                <div>
                  <div className="hfns-profileName">{displayName}</div>
                  <div className="hfns-profileEmail">{displayEmail || " "}</div>
                </div>
              </div>

              <div className="hfns-dropdownDivider" />

              <Link to="/home/profile" onClick={() => setProfileDropdown(false)}>
                My Profile
              </Link>

              <Link to="/home/saved-gyms" onClick={() => setProfileDropdown(false)}>
                Saved Gyms
              </Link>

              <Link to="/home/workout" onClick={() => setProfileDropdown(false)}>
                Workout Plan
              </Link>

              <Link to="/home/settings" onClick={() => setProfileDropdown(false)}>
                Settings
              </Link>

              {isOwnerPlus && switchModes.length > 0 && (
                <>
                  <div className="hfns-dropdownDivider" />
                  {switchModes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className="hfns-dropdownBtn"
                      onClick={() => handleSwitchUi(m)}
                    >
                      Switch to {labelForUiMode(m)}
                    </button>
                  ))}
                </>
              )}

              <Link to="/login" onClick={handleLogout}>
                Logout
              </Link>
            </div>
          </div>
        </nav>

        <div className="hfns-hamburger" onClick={() => setMobileMenuOpen((p) => !p)}>
          <span />
          <span />
          <span />
        </div>
      </header>

      <div className={`hfns-mobileMenu ${mobileMenuOpen ? "open" : ""}`}>
        <Link to="/home" onClick={() => setMobileMenuOpen(false)}>
          DASHBOARD
        </Link>

        <Link to="/home/saved-gyms" onClick={() => setMobileMenuOpen(false)}>
          SAVED GYMS
        </Link>

        <Link to="/home/find-gyms" onClick={() => setMobileMenuOpen(false)}>
          FIND GYMS
        </Link>

        <Link to="/home/workout" onClick={() => setMobileMenuOpen(false)}>
          WORKOUT PLAN
        </Link>

        <Link to="/home/profile" onClick={() => setMobileMenuOpen(false)}>
          My Profile
        </Link>

        <Link to="/home/settings" onClick={() => setMobileMenuOpen(false)}>
          Settings
        </Link>

        {isOwnerPlus &&
          switchModes.map((m) => (
            <button key={m} type="button" onClick={() => handleSwitchUi(m)} className="hfns-mobileBtn">
              Switch to {labelForUiMode(m)}
            </button>
          ))}

        <button type="button" onClick={handleLogout} className="hfns-mobileLogout">
          Logout
        </button>
      </div>
    </>
  );
}
