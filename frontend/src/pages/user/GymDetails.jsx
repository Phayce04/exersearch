// ✅ WHOLE FILE: src/pages/user/GymDetails.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import "./Homestyles.css";
import { api } from "../../utils/apiClient";
import { absoluteUrl } from "../../utils/findGymsData";

const GYM_SHOW_ENDPOINT = (id) => `/gyms/${id}`;

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtPeso(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `₱${x.toLocaleString()}`;
}

function formatTimeMaybeISO(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  // If API sends 00:00:00 for “time only”, this will still show 12:00 AM.
  // That’s fine; if you want to hide midnight-only, uncomment the guard below.
  // if (d.getHours() === 0 && d.getMinutes() === 0) return "—";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function joinImages(main, gallery) {
  const arr = [];
  if (main) arr.push(main);
  if (Array.isArray(gallery)) arr.push(...gallery);
  // remove duplicates / falsy
  return [...new Set(arr.filter(Boolean).map((x) => String(x)))];
}

export default function GymDetails() {
  const { id } = useParams(); // expects route like /home/gym/:id
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [gym, setGym] = useState(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Like (localStorage)
  const [isLiked, setIsLiked] = useState(false);

  // Stats animation (simple, only if you have counts)
  const statsRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [count, setCount] = useState({ machines: 0, members: 0, trainers: 0 });

  // If you pass from results: location.state?.plan_type (daily/monthly)
  const preferredPlan = location?.state?.plan_type || null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(GYM_SHOW_ENDPOINT(id));
        const data = res.data?.data || res.data?.gym || res.data || null;
        if (!cancelled) {
          setGym(data);
          setCurrentImageIndex(0);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(
            e?.response?.data?.message || e?.message || "Failed to load gym details"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id != null) load();
    else {
      setLoading(false);
      setError("Missing gym id");
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    // liked state by gym id
    const saved = localStorage.getItem("likedGyms");
    if (!saved) return;
    try {
      const set = new Set(JSON.parse(saved));
      setIsLiked(set.has(Number(id)));
    } catch {}
  }, [id]);

  const images = useMemo(() => {
    if (!gym) return [];
    const list = joinImages(gym?.main_image_url, gym?.gallery_urls);
    return list.length ? list.map((u) => absoluteUrl(u)) : [];
  }, [gym]);

  const displayPrice = useMemo(() => {
    if (!gym) return "—";

    const daily = safeNum(gym?.daily_price);
    const monthly = safeNum(gym?.monthly_price);
    const annual = safeNum(gym?.annual_price);

    // Use preferred plan if present
    if (preferredPlan === "daily" && daily > 0) return `${fmtPeso(daily)}/day`;
    if (preferredPlan === "monthly" && monthly > 0) return `${fmtPeso(monthly)}/month`;
    if (preferredPlan === "annual" && annual > 0) return `${fmtPeso(annual)}/year`;

    // fallback: show the best available
    if (monthly > 0) return `${fmtPeso(monthly)}/month`;
    if (daily > 0) return `${fmtPeso(daily)}/day`;
    if (annual > 0) return `${fmtPeso(annual)}/year`;
    return "—";
  }, [gym, preferredPlan]);

  const hoursText = useMemo(() => {
    if (!gym) return "—";
    const open = formatTimeMaybeISO(gym?.opening_time);
    const close = formatTimeMaybeISO(gym?.closing_time);
    if (open === "—" && close === "—") return "—";
    return `${open} – ${close}`;
  }, [gym]);

  const toggleLike = () => {
    const gymIdNum = Number(id);
    const saved = localStorage.getItem("likedGyms");
    let set = new Set();
    try {
      if (saved) set = new Set(JSON.parse(saved));
    } catch {}

    if (set.has(gymIdNum)) set.delete(gymIdNum);
    else set.add(gymIdNum);

    localStorage.setItem("likedGyms", JSON.stringify([...set]));
    setIsLiked(set.has(gymIdNum));
  };

  const nextImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // ✅ open direction: uses current device location -> gym lat/lng
  const openDirection = () => {
    const gLat = gym?.latitude;
    const gLng = gym?.longitude;
    if (gLat == null || gLng == null) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${gLat},${gLng}&travelmode=driving`,
          "_blank"
        );
      },
      () => {
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${gLat},${gLng}`,
          "_blank"
        );
      }
    );
  };

  // Optional: stat animation (if you later add counts)
  useEffect(() => {
    if (!gym) return;

    const target = {
      machines: Array.isArray(gym?.equipments) ? gym.equipments.length : 0,
      members: 0,
      trainers: gym?.has_personal_trainers ? 1 : 0,
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            Object.keys(target).forEach((k) => {
              let i = 0;
              const t = target[k];
              const inc = Math.max(1, Math.ceil(t / 25));
              const interval = setInterval(() => {
                i += inc;
                if (i >= t) {
                  setCount((p) => ({ ...p, [k]: t }));
                  clearInterval(interval);
                } else {
                  setCount((p) => ({ ...p, [k]: i }));
                }
              }, 20);
            });
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.25 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [gym, hasAnimated]);

  if (loading) {
    return (
      <div className="gym-details-page">
        <div style={{ padding: 24, fontWeight: 900 }}>Loading gym…</div>
      </div>
    );
  }

  if (error || !gym) {
    return (
      <div className="gym-details-page">
        <div style={{ padding: 24 }}>
          <div style={{ fontWeight: 950, color: "#dc2626" }}>
            {error || "Gym not found"}
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              className="favorite-btn-small"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const gLat = gym?.latitude;
  const gLng = gym?.longitude;

  return (
    <div className="gym-details-page">
      {/* Hero Section */}
      <section className="gym-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
<button
  type="button"
  onClick={() => navigate(-1)}
  className="back-link-btn"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
  Back to Results
</button>



          <div className="hero-info">
            <div className="hero-text">
              <h1 className="gym-name">{gym?.name}</h1>
              <p className="gym-tagline">
                {gym?.gym_type ? `${gym.gym_type} Gym` : "Gym Details"}
              </p>

              <div className="hero-meta">
                <span className="location-badge">📍 {gym?.address || "—"}</span>
                {gym?.has_personal_trainers ? (
                  <span className="rating-badge">🎯 Personal Trainers</span>
                ) : null}
                {gym?.has_classes ? (
                  <span className="rating-badge">📅 Classes</span>
                ) : null}
                {gym?.is_24_hours ? (
                  <span className="rating-badge">🕐 24 Hours</span>
                ) : null}
              </div>
            </div>

            <div className="hero-actions">
              <span className="price-tag">{displayPrice}</span>

              <button
                className={`favorite-btn-hero ${isLiked ? "liked" : ""}`}
                onClick={toggleLike}
                title={isLiked ? "Saved" : "Save"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="image-gallery">
          <button
            className="gallery-nav prev"
            onClick={prevImage}
            disabled={!images.length}
            title="Previous"
          >
            ‹
          </button>

          <img
            src={
              images[currentImageIndex] ||
              "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=700&fit=crop"
            }
            alt={`${gym?.name} - Image ${currentImageIndex + 1}`}
            className="gallery-image"
          />

          <button
            className="gallery-nav next"
            onClick={nextImage}
            disabled={!images.length}
            title="Next"
          >
            ›
          </button>

          <div className="gallery-dots">
            {images.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentImageIndex ? "active" : ""}`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="gym-details-container">
        <div className="details-grid">
          {/* Left Column */}
          <div className="main-column">
            {/* About */}
            <div className="detail-card about-section">
              <h2 className="section-title">About This Gym</h2>
              <p className="gym-description">
                {gym?.description || "No description provided."}
              </p>
            </div>

            {/* Operating Hours */}
            <div className="detail-card hours-section">
              <h2 className="section-title">Operating Hours</h2>
              <div className="hours-info">
                <div className="hours-icon">🕐</div>
                <div className="hours-text">
                  <p className="hours-time">{hoursText}</p>
                  <span className="hours-status open">
                    {gym?.is_24_hours ? "Open 24 Hours" : "Hours Available"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="detail-card hours-section">
              <h2 className="section-title">Pricing</h2>
              <div style={{ display: "grid", gap: 10 }}>
                <div className="equipment-item" style={{ fontWeight: 800 }}>
                  💰 Daily: {safeNum(gym?.daily_price) ? fmtPeso(gym.daily_price) : "—"}
                </div>
                <div className="equipment-item" style={{ fontWeight: 800 }}>
                  💳 Monthly: {safeNum(gym?.monthly_price) ? fmtPeso(gym.monthly_price) : "—"}
                </div>
                <div className="equipment-item" style={{ fontWeight: 800 }}>
                  🏆 Annual: {safeNum(gym?.annual_price) ? fmtPeso(gym.annual_price) : "—"}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="detail-card stats-section" ref={statsRef}>
              <h2 className="section-title">Gym Statistics</h2>
              <div className="stats-grid">
                <StatCard icon="🏋️" value={count.machines} label="Equipments" color="orange" />
                <StatCard icon="🎯" value={count.trainers} label="Trainers" color="green" />
                <StatCard
                  icon={gym?.is_airconditioned ? "❄️" : "🌿"}
                  value={gym?.is_airconditioned ? 1 : 0}
                  label={gym?.is_airconditioned ? "Aircon" : "No Aircon"}
                  color="blue"
                />
              </div>
            </div>

            {/* Amenities */}
            <div className="detail-card amenities-section">
              <h2 className="section-title">Amenities & Features</h2>
              <div className="amenities-grid">
                {(Array.isArray(gym?.amenities) ? gym.amenities : []).length === 0 ? (
                  <div style={{ opacity: 0.75, fontWeight: 700 }}>
                    No amenities listed.
                  </div>
                ) : (
                  gym.amenities.map((a) => {
                    const available = a?.pivot?.availability_status ?? true;
                    const note = a?.pivot?.notes || a?.description || "";
                    const img = a?.pivot?.image_url || a?.image_url || null;

                    return (
                      <div
                        key={a.amenity_id}
                        className="amenity-item"
                        title={note}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          opacity: available ? 1 : 0.6,
                        }}
                      >
                        {img ? (
                          <img
                            src={absoluteUrl(img)}
                            alt={a.name}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              objectFit: "cover",
                              border: "2px solid rgba(0,0,0,0.06)",
                            }}
                          />
                        ) : (
                          <span className="amenity-icon">✨</span>
                        )}
                        <span className="amenity-name">
                          {a.name} {available ? "" : "(Unavailable)"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Equipment */}
            <div className="detail-card equipment-section">
              <h2 className="section-title">Available Equipment</h2>
              <div className="equipment-list">
                {(Array.isArray(gym?.equipments) ? gym.equipments : []).length === 0 ? (
                  <div style={{ opacity: 0.75, fontWeight: 700 }}>
                    No equipments listed.
                  </div>
                ) : (
                  gym.equipments.map((e) => (
                    <div key={e.equipment_id} className="equipment-item">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      <span style={{ textTransform: "capitalize" }}>{e.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="sidebar-column">
            {/* Map Card */}
            <div className="detail-card map-card">
              <h2 className="section-title">Location</h2>
              <div className="map-container">
                <iframe
                  title="Gym Location Map"
                  className="gym-map"
                  src={`https://maps.google.com/maps?q=${gLat},${gLng}&z=15&output=embed`}
                  loading="lazy"
                />
              </div>
              <p className="map-address">📍 {gym?.address || "—"}</p>
              <button className="direction-btn" onClick={openDirection}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
                </svg>
                Get Directions
              </button>
            </div>

            {/* Contact & Social */}
            <div className="detail-card contact-card">
              <h2 className="section-title">Get in Touch</h2>

              <div className="contact-info" style={{ display: "grid", gap: 8 }}>
                <p>
                  <strong>Phone:</strong> {gym?.contact_number || "—"}
                </p>
                <p>
                  <strong>Email:</strong> {gym?.email || "—"}
                </p>
                <p>
                  <strong>Website:</strong>{" "}
                  {gym?.website ? (
                    <a href={gym.website} target="_blank" rel="noreferrer">
                      {gym.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>

              <div className="social-links" style={{ marginTop: 12 }}>
                {gym?.facebook_page ? (
                  <a
                    href={gym.facebook_page}
                    className="social-link facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Facebook"
                  >
                    f
                  </a>
                ) : null}

                {gym?.instagram_page ? (
                  <a
                    href={gym.instagram_page}
                    className="social-link instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Instagram"
                  >
                    ig
                  </a>
                ) : null}
              </div>

              {gym?.owner ? (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>
                    Owner
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {gym?.owner?.profile_photo_url ? (
                      <img
                        src={gym.owner.profile_photo_url}
                        alt={gym.owner.name}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 999,
                          objectFit: "cover",
                          border: "2px solid rgba(0,0,0,0.06)",
                        }}
                      />
                    ) : null}
                    <div style={{ lineHeight: 1.15 }}>
                      <div style={{ fontWeight: 900 }}>{gym.owner.name}</div>
                      <div style={{ opacity: 0.8, fontWeight: 650 }}>
                        {gym.owner.email}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quick Actions (optional UI only) */}
            <div className="detail-card actions-card">
              <h2 className="section-title">Quick Actions</h2>
              <div className="action-buttons">
                <button className="action-btn primary">
                  <span className="action-icon">🎫</span>
                  Get Membership
                </button>
                <button className="action-btn secondary">
                  <span className="action-icon">📅</span>
                  Book a Trainer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
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
