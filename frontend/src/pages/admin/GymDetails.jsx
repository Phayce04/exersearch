// src/pages/admin/GymDetails.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext, useParams, useLocation, useNavigate } from "react-router-dom";
import { adminThemes } from "./AdminLayout";
import "./Homestyles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const ASSET_BASE = import.meta.env.VITE_ASSET_BASE_URL || ""; // optional

function getAssetHost() {
  // Prefer explicit asset host, then API host.
  const host = (ASSET_BASE || API_BASE || "").replace(/\/$/, "");

  // If still empty (rare), fallback to current origin (dev server).
  return host || window.location.origin;
}

function absUrl(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;

  const host = getAssetHost();
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${host}${path}`;
}

function formatOpeningClosing(openingISO, closingISO) {
  try {
    if (!openingISO || !closingISO) return "Hours not provided";
    const open = new Date(openingISO);
    const close = new Date(closingISO);
    const fmt = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `Mon – Sun | ${fmt(open)} – ${fmt(close)}`;
  } catch {
    return "Hours not provided";
  }
}

function normalizeGym(raw) {
  if (!raw) return null;

  const gymId = raw.gym_id;
  const lat = parseFloat(raw.latitude);
  const lng = parseFloat(raw.longitude);

  // -------- GALLERY PARSER (supports array / json string / postgres literal / comma) ----------
  const parseGallery = (g) => {
    if (!g) return [];
    if (Array.isArray(g)) return g.filter(Boolean).map(String);

    if (typeof g !== "string") return [];
    const s = g.trim();
    if (!s) return [];

    // JSON string: ["a","b"]
    if (s.startsWith("[")) {
      try {
        const arr = JSON.parse(s);
        return Array.isArray(arr) ? arr.filter(Boolean).map(String) : [];
      } catch {
        return [];
      }
    }

    // Postgres literal: {"a","b"}
    if (s.startsWith("{") && s.endsWith("}")) {
      return s
        .slice(1, -1)
        .split(",")
        .map((x) =>
          x
            .trim()
            .replace(/^"(.*)"$/, "$1")
            .replace(/\\"/g, '"')
        )
        .filter(Boolean);
    }

    // fallback: comma-separated
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  };

  // -------- IMAGES ----------
  let images = [];
  if (raw.main_image_url) images.push(absUrl(raw.main_image_url));

  const gallery = parseGallery(raw.gallery_urls).map(absUrl);
  images.push(...gallery);

  // Remove duplicates + empties
  images = Array.from(new Set(images.filter(Boolean)));

  // -------- AMENITIES ----------
  const amenities = (raw.amenities || []).map((a) => ({
    icon: "✅",
    name: a.name || "Amenity",
    description: a.pivot?.notes || a.description || "",
    image_url: absUrl(a.pivot?.image_url || a.image_url || ""),
    availability: a.pivot?.availability_status ?? true,
  }));

  // -------- EQUIPMENT ----------
  const equipment = (raw.equipments || []).map((e) =>
    typeof e === "string" ? e : e.name || e.equipment_name || "Equipment"
  );

  // -------- HOURS ----------
  const hoursText = raw.is_24_hours
    ? "Mon – Sun | 24 Hours"
    : formatOpeningClosing(raw.opening_time, raw.closing_time);

  // -------- PRICE ----------
  const daily = raw.daily_price ? Number(raw.daily_price) : null;
  const monthly = raw.monthly_price ? Number(raw.monthly_price) : null;
  const annual = raw.annual_price ? Number(raw.annual_price) : null;

  const priceText = daily
    ? `₱${daily.toLocaleString()}/day`
    : monthly
    ? `₱${monthly.toLocaleString()}/month`
    : annual
    ? `₱${annual.toLocaleString()}/year`
    : "—";

  return {
    id: gymId,
    name: raw.name || "Gym",
    tagline: raw.gym_type ? `${raw.gym_type} Gym` : "Gym",
    description: raw.description || "This gym has not added a description yet.",
    hours: hoursText,

    crowd: 0,
    rating: 0,
    reviews: 0,

    price: priceText,

    location: {
      address: raw.address || "",
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    },

    stats: {
      machines: 0,
      members: 0,
      trainers: raw.has_personal_trainers ? 1 : 0,
    },

    amenities,
    equipment,

    // IMPORTANT: do NOT fallback to "/sample.jpg" because that breaks in admin
    images: images.length ? images : [],

    socialMedia: {
      facebook: raw.facebook_page || "",
      instagram: raw.instagram_page || "",
      phone: raw.contact_number || "",
      email: raw.email || "",
      website: raw.website || "",
    },

    owner: raw.owner
      ? {
          owner_id: raw.owner.owner_id,
          name: raw.owner.name,
          email: raw.owner.email,
          contact_number: raw.owner.contact_number,
          company_name: raw.owner.company_name,
          verified: !!raw.owner.verified,
          profile_photo_url: raw.owner.profile_photo_url ? absUrl(raw.owner.profile_photo_url) : null,
        }
      : null,
  };
}

export default function GymDetails() {
  const { gymId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { theme } = useOutletContext();
  const t = adminThemes[theme]?.app || adminThemes.light.app;

  // ✅ return-to-previous support
  const from = location.state?.from;

  const isAdmin = window.location.pathname.startsWith("/admin");
  const defaultBackTo = isAdmin ? "/admin/map" : "/home/results";
  const backLabel = from ? "Back" : isAdmin ? "Back to Map" : "Back to Results";

  const goBack = () => {
    if (from) navigate(from);
    else navigate(defaultBackTo);
  };

  const wrapperStyle = useMemo(
    () => ({
      background: t.bg,
      color: t.text,
      "--gd-bg": t.bg,
      "--gd-text": t.text,
      "--gd-border": t.border,
      "--gd-soft": t.soft,
      "--gd-soft2": t.soft2,
      "--gd-muted": t.mutedText,
      "--gd-shadow": t.shadow,
    }),
    [t]
  );

  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [count, setCount] = useState({ machines: 0, members: 0, trainers: 0 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const statsRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token") ||
          localStorage.getItem("auth_token");

        const res = await fetch(`${API_BASE}/api/v1/gyms/${gymId}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        const text = await res.text();
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }

        if (!res.ok) {
          const msg = (json && (json.message || json.error)) || `Failed to load gym (HTTP ${res.status})`;
          throw new Error(msg);
        }

        const payload = json?.data ?? json;
        const normalized = normalizeGym(payload);

        if (!ignore) {
          setGym(normalized);
          setCurrentImageIndex(0);
          setHasAnimated(false);
          setCount({ machines: 0, members: 0, trainers: 0 });
        }
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load gym.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [gymId]);

  const canShowMap = useMemo(() => {
    return gym?.location?.lat != null && gym?.location?.lng != null;
  }, [gym]);

  // Animate stats on scroll
  useEffect(() => {
    if (!gym) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            animateStats();
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gym, hasAnimated]);

  const animateStats = () => {
    Object.keys(gym.stats).forEach((key) => {
      let i = 0;
      const target = Number(gym.stats[key] ?? 0);
      if (!Number.isFinite(target) || target <= 0) {
        setCount((prev) => ({ ...prev, [key]: 0 }));
        return;
      }

      const increment = Math.ceil(target / 50) || 1;
      const interval = setInterval(() => {
        i += increment;
        if (i >= target) {
          setCount((prev) => ({ ...prev, [key]: target }));
          clearInterval(interval);
        } else {
          setCount((prev) => ({ ...prev, [key]: i }));
        }
      }, 30);
    });
  };

  const openDirection = () => {
    if (!gym?.location?.lat || !gym?.location?.lng) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        window.open(`https://www.google.com/maps/dir/${latitude},${longitude}/${gym.location.lat},${gym.location.lng}`, "_blank");
      },
      () => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${gym.location.lat},${gym.location.lng}`, "_blank");
      }
    );
  };

  const nextImage = () => {
    if (!gym?.images?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % gym.images.length);
  };

  const prevImage = () => {
    if (!gym?.images?.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + gym.images.length) % gym.images.length);
  };

  const getCrowdStatus = (level) => {
    if (level < 30) return "Low";
    if (level < 60) return "Moderate";
    return "Busy";
  };

  // ✅ If current image fails to load, remove it and move on
  const handleImageError = () => {
    setGym((prev) => {
      if (!prev?.images?.length) return prev;
      const bad = prev.images[currentImageIndex];
      const nextImages = prev.images.filter((u) => u !== bad);
      return { ...prev, images: nextImages };
    });

    setCurrentImageIndex((i) => Math.max(0, i - 1));
  };

  if (loading) {
    return (
      <div className={`gym-details-page ${isAdmin ? "admin-mode" : ""}`} style={wrapperStyle}>
        <div style={{ padding: 18, color: t.text }}>Loading gym details…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`gym-details-page ${isAdmin ? "admin-mode" : ""}`} style={wrapperStyle}>
        <div style={{ padding: 18, color: t.text }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Couldn’t load gym</div>
          <div style={{ opacity: 0.9 }}>{error}</div>

          <div style={{ marginTop: 12 }}>
            <button type="button" className="back-link" onClick={goBack}>
              ← {backLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className={`gym-details-page ${isAdmin ? "admin-mode" : ""}`} style={wrapperStyle}>
        <div style={{ padding: 18, color: t.text }}>Gym not found.</div>
      </div>
    );
  }

  return (
    <div className={`gym-details-page ${isAdmin ? "admin-mode" : ""}`} style={wrapperStyle}>
      {/* Hero Section */}
      <section className="gym-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
<div
  onClick={goBack}
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--gd-text)",
    opacity: 0.9,
  }}
  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
  <span>{backLabel}</span>
</div>


          <div className="hero-info">
            <div className="hero-text">
              <h1 className="gym-name">{gym.name}</h1>
              <p className="gym-tagline">{gym.tagline}</p>
              <div className="hero-meta">
                <span className="rating-badge">⭐ {gym.rating || "—"}</span>
                <span className="location-badge">📍 {gym.location.address || "—"}</span>
              </div>
            </div>

            <div className="hero-actions">
              <span className="price-tag">{gym.price}</span>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="image-gallery">
          {gym.images.length ? (
            <>
              <button className="gallery-nav prev" onClick={prevImage}>
                ‹
              </button>

              <img
                src={gym.images[currentImageIndex]}
                onError={handleImageError}
                alt={`${gym.name} - Image ${currentImageIndex + 1}`}
                className="gallery-image"
              />

              <button className="gallery-nav next" onClick={nextImage}>
                ›
              </button>

              <div className="gallery-dots">
                {gym.images.map((_, index) => (
                  <span
                    key={index}
                    className={`dot ${index === currentImageIndex ? "active" : ""}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: 18, color: "#fff", opacity: 0.9 }}>No images uploaded yet.</div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="gym-details-container">
        <div className="details-grid">
          {/* Left Column */}
          <div className="main-column">
            <div className="detail-card about-section">
              <h2 className="section-title">About This Gym</h2>
              <p className="gym-description">{gym.description}</p>
            </div>

            <div className="detail-card hours-section">
              <h2 className="section-title">Operating Hours</h2>
              <div className="hours-info">
                <div className="hours-icon">🕐</div>
                <div className="hours-text">
                  <p className="hours-time">{gym.hours}</p>
                  <span className="hours-status open">Open Now</span>
                </div>
              </div>
            </div>

            <div className="detail-card crowd-section">
              <h2 className="section-title">Current Crowd Level</h2>
              <div className="crowd-info">
                <div className="crowd-percentage">{gym.crowd}%</div>
                <div className="crowd-details">
                  <div className="crowd-bar-container">
                    <div className="crowd-bar-fill" style={{ width: `${gym.crowd}%` }} />
                  </div>
                  <span className="crowd-status">{getCrowdStatus(gym.crowd)} Traffic</span>
                </div>
              </div>
            </div>

            <div className="detail-card stats-section" ref={statsRef}>
              <h2 className="section-title">Gym Statistics</h2>

              <div className="stats-grid">
                {[
                  { icon: "🏋️", value: count.machines, label: "Machines", accent: "orange" },
                  { icon: "👥", value: count.members, label: "Members", accent: "blue" },
                  { icon: "🎯", value: count.trainers, label: "Trainers", accent: "green" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className={`stat-card stat-${s.accent}`}
                    style={{
                      background: "var(--gd-soft)",
                      border: "1px solid var(--gd-border)",
                      color: "var(--gd-text)",
                    }}
                  >
                    <div className="stat-icon">{s.icon}</div>
                    <div className="stat-content">
                      <div className="stat-value" style={{ color: "var(--gd-text)" }}>
                        {s.value}+
                      </div>
                      <div className="stat-label" style={{ color: "var(--gd-muted)" }}>
                        {s.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-card amenities-section">
              <h2 className="section-title">Amenities & Features</h2>

              <div className="amenities-grid">
                {gym.amenities.length ? (
                  gym.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="amenity-item"
                      style={{
                        background: "var(--gd-soft)",
                        border: "1px solid var(--gd-border)",
                        color: "var(--gd-text)",
                      }}
                    >
                      <span className="amenity-icon" style={{ color: "#22c55e" }}>
                        {amenity.icon}
                      </span>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className="amenity-name" style={{ color: "var(--gd-text)", fontWeight: 600 }}>
                          {amenity.name}
                        </span>

                        {amenity.description ? (
                          <span
                            style={{
                              fontSize: 12,
                              marginTop: 2,
                              color: "var(--gd-muted)",
                              opacity: 0.95,
                            }}
                          >
                            {amenity.description}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ opacity: 0.85, color: "var(--gd-muted)" }}>No amenities listed yet.</div>
                )}
              </div>
            </div>

            <div className="detail-card equipment-section">
              <h2 className="section-title">Available Equipment</h2>

              <div className="equipment-list">
                {gym.equipment.length ? (
                  gym.equipment.map((item, index) => (
                    <div key={index} className="equipment-item" style={{ color: "var(--gd-text)" }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        style={{ color: "#22c55e" }}
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>

                      <span style={{ color: "var(--gd-text)" }}>{item}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ opacity: 0.85, color: "var(--gd-muted)" }}>No equipment listed yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="sidebar-column">
            <div className="detail-card map-card">
              <h2 className="section-title">Location</h2>

              {canShowMap ? (
                <>
                  <div className="map-container">
                    <iframe
                      title="Gym Location Map"
                      className="gym-map"
                      src={`https://maps.google.com/maps?q=${gym.location.lat},${gym.location.lng}&z=15&output=embed`}
                      loading="lazy"
                    />
                  </div>

                  <p className="map-address">📍 {gym.location.address || "—"}</p>

                  <button className="direction-btn" onClick={openDirection}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
                    </svg>
                    Get Directions
                  </button>
                </>
              ) : (
                <div style={{ opacity: 0.85 }}>No coordinates available for this gym yet.</div>
              )}
            </div>

            <div className="detail-card actions-card">
              <h2 className="section-title">Owner Details</h2>

              {gym.owner ? (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img
                    src={gym.owner.profile_photo_url || "https://i.pravatar.cc/80?img=12"}
                    alt="Owner"
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 999,
                      objectFit: "cover",
                      border: "1px solid var(--gd-border)",
                    }}
                  />

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{gym.owner.name || "Owner"}</div>

                    <div style={{ opacity: 0.9, fontSize: 13, color: "var(--gd-muted)" }}>{gym.owner.email || "—"}</div>

                    <div style={{ opacity: 0.9, fontSize: 13, color: "var(--gd-muted)" }}>
                      {gym.owner.contact_number ? `📞 ${gym.owner.contact_number}` : "📞 —"}
                    </div>

                    {gym.owner.company_name ? (
                      <div style={{ opacity: 0.9, fontSize: 13, color: "var(--gd-muted)" }}>🏢 {gym.owner.company_name}</div>
                    ) : null}

                    <div style={{ marginTop: 6 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 800,
                          background: gym.owner.verified ? "#16a34a" : "var(--gd-soft)",
                          border: gym.owner.verified ? "none" : "1px solid var(--gd-border)",
                          color: gym.owner.verified ? "#fff" : "var(--gd-text)",
                        }}
                      >
                        {gym.owner.verified ? "Verified" : "Not Verified"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ opacity: 0.85, color: "var(--gd-muted)" }}>No owner info available.</div>
              )}
            </div>

            <div className="detail-card contact-card">
              <h2 className="section-title">Gym Contact</h2>

              <div className="contact-info">
                {gym.socialMedia.phone ? (
                  <p>
                    <strong>Phone:</strong> {gym.socialMedia.phone}
                  </p>
                ) : null}

                {gym.socialMedia.email ? (
                  <p>
                    <strong>Email:</strong> {gym.socialMedia.email}
                  </p>
                ) : null}

                {gym.socialMedia.website ? (
                  <p>
                    <strong>Website:</strong>{" "}
                    <a href={gym.socialMedia.website} target="_blank" rel="noopener noreferrer">
                      {gym.socialMedia.website}
                    </a>
                  </p>
                ) : null}

                {!gym.socialMedia.phone && !gym.socialMedia.email && !gym.socialMedia.website ? (
                  <p style={{ opacity: 0.85, color: "var(--gd-muted)" }}>No contact info listed yet.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}+</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
