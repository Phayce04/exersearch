// src/pages/user/HomeHeader.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HF.css";

import {
  Search,
  X,
  Bell,
  ChevronDown,
  Flame,
  Dumbbell,
  UtensilsCrossed,
  UserCircle,
  Trophy,
  Heart,
  MessageCircle,
  Settings,
  LogOut,
  Bookmark,
} from "lucide-react";

import { FALLBACK_AVATAR, initials } from "../../utils/userHomeApi";

import {
  listNotifications,
  getUnreadNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../utils/notificationApi";

const TOKEN_KEY = "token";

function iconForNotifType(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("workout")) return Flame;
  if (t.includes("meal")) return UtensilsCrossed;
  if (t.includes("saved") || t.includes("follow")) return Heart;
  if (t.includes("membership")) return Trophy;
  if (t.includes("inquiry") || t.includes("message")) return MessageCircle;
  return Bell;
}

export default function HomeHeader({
  appLogo,
  fallbackLogo,
  searchQuery,
  setSearchQuery,
  onClearSearch, // clears query + removes ?q=
  goBestMatch,

  // profile info
  avatarSrc,
  displayName,
  displayEmail,

  // role switching
  isOwnerPlus,
  switchModes,
  labelForUiMode,
  handleSwitchUi,

  // logout
  handleLogout,
}) {
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const token = localStorage.getItem(TOKEN_KEY);

  // =========================
  // Notifications (REAL)
  // =========================
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifErr, setNotifErr] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!token) return;
    try {
      const c = await getUnreadNotificationsCount();
      setUnreadCount(Number(c) || 0);
    } catch {
      // ignore
    }
  }, [token]);

  const loadNotifs = useCallback(async () => {
    if (!token) return;
    setNotifLoading(true);
    setNotifErr("");
    try {
      const paged = await listNotifications({ page: 1, per_page: 20 });
      setNotifications(Array.isArray(paged?.data) ? paged.data : []);
    } catch {
      setNotifErr("Failed to load notifications.");
    } finally {
      setNotifLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshUnread();
    const onFocus = () => refreshUnread();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUnread]);

  useEffect(() => {
    const close = (e) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    const esc = (e) => {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setProfileOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [notifOpen, profileOpen]);

  const closeAll = () => {
    setMobileMenuOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  };

  return (
    <>
      <div className="top-logo scrolled">
        <div
          style={{ cursor: "pointer" }}
          onClick={() => {
            closeAll();
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

      <header className="header header--scrolled">
        <div
          className="logo"
          onClick={() => {
            closeAll();
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

        <div className="uhv-header__search-wrap">
          <Search size={14} className="uhv-header__search-icon" />
          <input
            className="uhv-header__search-input"
            type="text"
            placeholder="Search gyms, areas, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="uhv-header__search-clear" type="button" onClick={onClearSearch}>
              <X size={12} />
            </button>
          )}
        </div>

        <div className="uhv-header__actions">
          <Link to="/home/workout" className="uhv-chip uhv-chip--fire" onClick={() => closeAll()}>
            <Flame size={12} /> Workout Plan
          </Link>

          <Link
            to="/home/find-gyms"
            className="uhv-chip uhv-chip--find"
            onClick={() => {
              goBestMatch();
              closeAll();
            }}
          >
            <Dumbbell size={12} /> Best Match Gyms
          </Link>

          <Link to="/home/meal-plan" className="uhv-chip uhv-chip--meal" onClick={() => closeAll()}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <UtensilsCrossed size={12} /> Meal Plan
            </span>
          </Link>

          {/* ✅ Notifications (REAL) */}
          <div className="uhv-notif-wrap" ref={notifRef}>
            <button
              type="button"
              className={"uhv-notif" + (unreadCount > 0 ? " has-unread" : "")}
              onClick={() => {
                setNotifOpen((o) => {
                  const next = !o;
                  if (next) loadNotifs();
                  return next;
                });
                setProfileOpen(false);
              }}
            >
              <Bell size={16} />
              {unreadCount > 0 && <span className="uhv-notif__dot" />}
            </button>

            {notifOpen && (
              <div className="uhv-notif-pop">
                <div className="uhv-notif-pop__hdr">
                  <span>Notifications</span>
                  <div className="uhv-notif-actions">
                    <button
                      type="button"
                      className="uhv-notif-clear"
                      onClick={async () => {
                        try {
                          await markAllNotificationsRead();
                          setNotifications((prev) => prev.map((x) => ({ ...x, unread: false })));
                          setUnreadCount(0);
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      Mark all as read
                    </button>

                    <button type="button" className="uhv-notif-close" onClick={() => setNotifOpen(false)}>
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="uhv-notif-pop__list">
                  {notifLoading && <div className="uhv-notif-empty">Loading...</div>}
                  {!notifLoading && notifErr && <div className="uhv-notif-empty">{notifErr}</div>}

                  {!notifLoading && !notifErr && notifications.length === 0 && (
                    <div className="uhv-notif-empty">All caught up!</div>
                  )}

                  {!notifLoading &&
                    !notifErr &&
                    notifications.map((n) => {
                      const Icon = iconForNotifType(n.type);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          className={"uhv-notif-item" + (n.unread ? " unread" : "")}
                          onClick={async () => {
                            // optimistic
                            setNotifications((prev) =>
                              prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x))
                            );
                            setUnreadCount((c) => Math.max(0, c - (n.unread ? 1 : 0)));

                            try {
                              await markNotificationRead(n.id);
                            } catch {
                              refreshUnread();
                              loadNotifs();
                            }
                          }}
                        >
                          <div className="uhv-notif-icon">
                            <Icon size={14} />
                          </div>
                          <div className="uhv-notif-body">
                            <p>{n.title}</p>
                            <span>{n.message}</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="uhv-profile-wrap" ref={profileRef}>
            <button
              type="button"
              className="uhv-profile-btn"
              onClick={() => {
                setProfileOpen((o) => !o);
                setNotifOpen(false);
              }}
            >
              <div className="uhv-profile-avatar">
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="uhv-profile-avatar__img"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_AVATAR;
                  }}
                />
                <span className="uhv-profile-avatar__fallback">{initials(displayName)}</span>
              </div>
              <ChevronDown size={13} className={"uhv-profile-chevron" + (profileOpen ? " open" : "")} />
            </button>

            {profileOpen && (
              <div className="uhv-profile-pop">
                <div className="uhv-profile-pop__top">
                  <div className="uhv-profile-pop__bigavatar">
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_AVATAR;
                      }}
                    />
                    <span>{initials(displayName)}</span>
                  </div>
                  <div>
                    <p className="uhv-profile-pop__name">{displayName}</p>
                    <p className="uhv-profile-pop__email">{displayEmail || " "}</p>
                  </div>
                </div>

                <div className="uhv-profile-pop__menu">
                  <Link to="/home/profile" className="uhv-profile-menu-item" onClick={() => setProfileOpen(false)}>
                    <div className="uhv-pmi-icon" style={{ background: "#eff6ff", color: "#3b82f6" }}>
                      <UserCircle size={15} />
                    </div>
                    My Profile
                  </Link>

                  <Link to="/home/workout" className="uhv-profile-menu-item" onClick={() => setProfileOpen(false)}>
                    <div className="uhv-pmi-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
                      <Flame size={15} />
                    </div>
                    Workout Plan
                  </Link>

                  <Link
                    to="/home/find-gyms"
                    className="uhv-profile-menu-item"
                    onClick={() => {
                      goBestMatch();
                      setProfileOpen(false);
                    }}
                  >
                    <div className="uhv-pmi-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                      <Dumbbell size={15} />
                    </div>
                    Best Match Gyms
                  </Link>

                  <Link to="/home/meal-plan" className="uhv-profile-menu-item" onClick={() => setProfileOpen(false)}>
                    <div className="uhv-pmi-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                      <span style={{ display: "inline-flex", alignItems: "center" }}>
                        <UtensilsCrossed size={15} />
                      </span>
                    </div>
                    Meal Plan
                  </Link>

                  <Link to="/home/memberships" className="uhv-profile-menu-item" onClick={() => setProfileOpen(false)}>
                    <div className="uhv-pmi-icon" style={{ background: "#fff7ed", color: "#f59e0b" }}>
                      <Trophy size={15} />
                    </div>
                    Memberships
                  </Link>

                  <Link to="/home/saved-gyms" className="uhv-profile-menu-item" onClick={() => setProfileOpen(false)}>
                    <div className="uhv-pmi-icon" style={{ background: "#fef2f2", color: "#ef4444" }}>
                      <Heart size={15} />
                    </div>
                    Saved Gyms
                  </Link>

                  <Link to="/home/inquiries" className="uhv-profile-menu-item" onClick={() => setProfileOpen(false)}>
                    <div className="uhv-pmi-icon" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
                      <MessageCircle size={15} />
                    </div>
                    Inquiries
                  </Link>

                  {isOwnerPlus && switchModes.length > 0 && (
                    <>
                      <div className="uhv-profile-pop__divider" />
                      {switchModes.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className="uhv-profile-menu-item"
                          onClick={() => {
                            handleSwitchUi(m);
                            setProfileOpen(false);
                          }}
                        >
                          <div className="uhv-pmi-icon" style={{ background: "#f3f4f6", color: "#111827" }}>
                            <Settings size={15} />
                          </div>
                          Switch to {labelForUiMode(m)}
                        </button>
                      ))}
                    </>
                  )}

                  <div className="uhv-profile-pop__divider" />
                  <button
                    type="button"
                    className="uhv-profile-menu-item uhv-profile-menu-item--logout"
                    onClick={(e) => {
                      setProfileOpen(false);
                      setNotifOpen(false);
                      setMobileMenuOpen(false);
                      handleLogout(e);
                    }}
                  >
                    <div className="uhv-pmi-icon" style={{ background: "#fef2f2", color: "#ef4444" }}>
                      <LogOut size={15} />
                    </div>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* hamburger */}
        <div className="hamburger" onClick={() => setMobileMenuOpen((p) => !p)}>
          <span />
          <span />
          <span />
        </div>
      </header>

      {/* mobile menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <Link to="/home" onClick={() => setMobileMenuOpen(false)}>
          DASHBOARD
        </Link>
        <Link to="/home/saved-gyms" onClick={() => setMobileMenuOpen(false)}>
          SAVED GYMS
        </Link>
        <Link
          to="/home/find-gyms"
          onClick={() => {
            goBestMatch();
            setMobileMenuOpen(false);
          }}
        >
          BEST MATCH GYMS
        </Link>
        <Link to="/home/workout" onClick={() => setMobileMenuOpen(false)}>
          WORKOUT PLAN
        </Link>
        <Link to="/home/meal-plan" onClick={() => setMobileMenuOpen(false)}>
          MEAL PLAN
        </Link>
        <Link to="/home/profile" onClick={() => setMobileMenuOpen(false)}>
          MY PROFILE
        </Link>
        <Link to="/home/inquiries" onClick={() => setMobileMenuOpen(false)}>
          INQUIRIES
        </Link>

        {isOwnerPlus &&
          switchModes.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                handleSwitchUi(m);
                setMobileMenuOpen(false);
              }}
              style={{
                background: "transparent",
                border: "none",
                textAlign: "left",
                padding: "12px 16px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Switch to {labelForUiMode(m)}
            </button>
          ))}

        <Link
          to="/login"
          onClick={(e) => {
            setMobileMenuOpen(false);
            handleLogout(e);
          }}
        >
          LOGOUT
        </Link>
      </div>
    </>
  );
}