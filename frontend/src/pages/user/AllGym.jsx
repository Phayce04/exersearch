// src/pages/user/AllGym.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

import { SlidersHorizontal, X } from "lucide-react";

import "./AllGyms.css";

const API_BASE = "https://exersearch.test";
const V1 = `${API_BASE}/api/v1`;
const DEFAULT_GYM_IMG = `/defaultgym.png`;

/* -----------------------------
  Helpers
----------------------------- */
function safeArr(v) {
  return Array.isArray(v) ? v : [];
}
function safeStr(v) {
  return v == null ? "" : String(v);
}
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function toAbsImgUrl(u) {
  if (!u) return DEFAULT_GYM_IMG;
  const s = String(u).trim();
  if (!s) return DEFAULT_GYM_IMG;
  if (/^https?:\/\//i.test(s)) return s;
  const base = String(API_BASE || "").replace(/\/$/, "");
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${base}${path}`;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((x) => x == null)) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* -----------------------------
  Leaflet icon fix (Vite)
----------------------------- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* -----------------------------
  Map helper: fit bounds to markers
----------------------------- */
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (!points || points.length === 0) return;
    const latLngs = points
      .map((p) => [p.latitude, p.longitude])
      .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
    if (latLngs.length === 0) return;
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds.pad(0.25), { animate: true });
  }, [map, points]);
  return null;
}

/* ================================
   MobileSelect (NOT default export)
   - bottom sheet so no overflow
================================ */
function MobileSelect({ title, value, onChange, options }) {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    options.find((o) => String(o.value) === String(value))?.label ??
    options?.[0]?.label ??
    "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="gr-mobile-select"
        style={{
          width: "100%",
          border: "1px solid #e6e6e6",
          background: "#fff",
          borderRadius: 8,
          padding: "10px 10px",
          fontWeight: 800,
          color: "#222",
          fontSize: "0.9rem",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedLabel}
        </span>
        <span style={{ fontWeight: 900, opacity: 0.65 }}>▾</span>
      </button>

      {open && (
        <div
          className="gr-sheet-backdrop"
          onClick={() => setOpen(false)}
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: 14,
          }}
        >
          <div
            className="gr-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={title}
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#fff",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 22px 60px rgba(0,0,0,0.35)",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <div
              className="gr-sheet__top"
              style={{
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <div className="gr-sheet__title" style={{ fontWeight: 900 }}>
                {title}
              </div>
              <button
                type="button"
                className="gr-sheet__close"
                onClick={() => setOpen(false)}
                style={{
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: 900,
                  padding: "8px 10px",
                  borderRadius: 12,
                }}
              >
                Close
              </button>
            </div>

            <div
              className="gr-sheet__list"
              style={{
                maxHeight: "55vh",
                overflow: "auto",
                padding: 10,
              }}
            >
              {options.map((opt) => {
                const active = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`gr-sheet__item ${active ? "is-active" : ""}`}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: active ? "2px solid #d23f0b" : "1px solid #eee",
                      background: "#fff",
                      borderRadius: 14,
                      padding: "12px 12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      marginBottom: 10,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* -----------------------------
  MAIN COMPONENT (single default export)
----------------------------- */
export default function AllGym() {
  // screen
  const [isMobile, setIsMobile] = useState(false);

  // data
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // user location (optional)
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);

  // UI state
  const [selectedGymId, setSelectedGymId] = useState(null);

  // filters
  const [sortBy, setSortBy] = useState("match"); // match | distance | rating
  const [priceBand, setPriceBand] = useState("all"); // all | under_1000 | 1000_1500 | 1500_plus
  const [freeFirstVisit, setFreeFirstVisit] = useState("all"); // all | yes

  const mapRef = useRef(null);

  // responsive
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // get location (optional)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {
        // ignore if blocked
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // fetch gyms
  async function fetchGyms() {
    setLoading(true);
    setErr("");
    try {
      // CHANGE THIS ENDPOINT if yours differs:
      // common patterns: /gyms, /gyms/approved, /gyms/recommended, etc.
      const res = await axios.get(`${V1}/gyms`, { withCredentials: true });

      // Accept common API shapes
      const payload = res?.data;
      const list =
        safeArr(payload?.data) ||
        safeArr(payload?.gyms) ||
        safeArr(payload) ||
        [];

      const normalized = list.map((g) => ({
        gym_id: g.gym_id ?? g.id,
        name: safeStr(g.name),
        address: safeStr(g.address),
        description: safeStr(g.description),
        latitude: toNum(g.latitude),
        longitude: toNum(g.longitude),
        monthly_price: toNum(g.monthly_price),
        daily_price: toNum(g.daily_price),
        rating_avg: toNum(g.rating_avg ?? g.average_rating ?? g.rating),
        reviews_count: toNum(g.reviews_count ?? g.review_count ?? 0),
        image_url: toAbsImgUrl(g.gym_photo_url ?? g.image_url ?? g.photo_url),
        amenities: safeArr(g.amenities),
        free_first_visit_enabled: Boolean(
          g.free_first_visit_enabled ?? g.freeFirstVisitEnabled
        ),
      }));

      setGyms(normalized);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load gyms."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGyms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priceOptions = useMemo(
    () => [
      { value: "all", label: "All Prices" },
      { value: "under_1000", label: "Under ₱1,000 / month" },
      { value: "1000_1500", label: "₱1,000 – ₱1,500 / month" },
      { value: "1500_plus", label: "₱1,500+ / month" },
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      { value: "match", label: "Best Match" },
      { value: "distance", label: "Nearest" },
      { value: "rating", label: "Top Rated" },
    ],
    []
  );

  const freeVisitOptions = useMemo(
    () => [
      { value: "all", label: "All" },
      { value: "yes", label: "Free First Visit" },
    ],
    []
  );

  const filtered = useMemo(() => {
    let list = gyms.slice();

    // filter: price
    if (priceBand !== "all") {
      list = list.filter((g) => {
        const p = g.monthly_price;
        if (p == null) return false;
        if (priceBand === "under_1000") return p < 1000;
        if (priceBand === "1000_1500") return p >= 1000 && p <= 1500;
        if (priceBand === "1500_plus") return p > 1500;
        return true;
      });
    }

    // filter: free first visit
    if (freeFirstVisit === "yes") {
      list = list.filter((g) => g.free_first_visit_enabled);
    }

    // sort
    if (sortBy === "distance") {
      list.sort((a, b) => {
        const da = haversineKm(userLat, userLng, a.latitude, a.longitude);
        const db = haversineKm(userLat, userLng, b.latitude, b.longitude);
        if (da == null && db == null) return 0;
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      });
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0));
    } else {
      // match: keep server order
    }

    return list;
  }, [gyms, priceBand, freeFirstVisit, sortBy, userLat, userLng]);

  const mapPoints = useMemo(
    () =>
      filtered
        .map((g) => ({
          gym_id: g.gym_id,
          name: g.name,
          latitude: g.latitude,
          longitude: g.longitude,
          address: g.address,
        }))
        .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)),
    [filtered]
  );

  function clearFilters() {
    setSortBy("match");
    setPriceBand("all");
    setFreeFirstVisit("all");
  }

  const selectedGym = useMemo(
    () => filtered.find((g) => g.gym_id === selectedGymId) || null,
    [filtered, selectedGymId]
  );

  function flyToGym(g) {
    const map = mapRef.current;
    if (!map) return;
    if (!Number.isFinite(g.latitude) || !Number.isFinite(g.longitude)) return;
    map.flyTo([g.latitude, g.longitude], 16, { animate: true, duration: 0.8 });
  }

  return (
    <div className="gym-results-page">
      {/* HEADER */}
      <div className="gr-header-full">
        <div className="gr-header-inner">
          <h1>Gym Results</h1>
          <p>Find your best match gym nearby</p>
        </div>
      </div>

      {/* SPLIT: MAP + RESULTS */}
      <div className="gr-split">
        {/* LEFT: MAP */}
        <div className="gr-left">
          <div className="gr-map-card">
            <div className="gr-map-top">
              <div className="gr-map-top__left">
                <div style={{ fontWeight: 900 }}>Map</div>
                <div className="gr-map-top__sub">
                  {filtered.length} result{filtered.length === 1 ? "" : "s"}
                </div>
              </div>

              <button
                className="gr-map-btn"
                type="button"
                onClick={() => {
                  // fit to markers
                  if (!mapRef.current) return;
                  if (!mapPoints.length) return;
                  const bounds = L.latLngBounds(
                    mapPoints.map((p) => [p.latitude, p.longitude])
                  );
                  mapRef.current.fitBounds(bounds.pad(0.25), { animate: true });
                }}
              >
                Fit
              </button>
            </div>

            <div className="gr-map">
              <MapContainer
                center={[14.5995, 120.9842]} // Manila fallback
                zoom={12}
                scrollWheelZoom
                style={{ width: "100%", height: "100%" }}
                whenCreated={(map) => {
                  mapRef.current = map;
                }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds points={mapPoints} />

                {mapPoints.map((p) => (
                  <Marker
                    key={p.gym_id}
                    position={[p.latitude, p.longitude]}
                    eventHandlers={{
                      click: () => setSelectedGymId(p.gym_id),
                    }}
                  >
                    <Popup>
                      <div className="gr-popup__title">{p.name}</div>
                      <div className="gr-popup__sub">{p.address}</div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* RIGHT: FILTERS + RESULTS */}
        <div className="gr-right">
          {/* FILTER BAR */}
          <div className="filter-bar">
            <div className="container">
              <div className="filter-controls">
                {/* Sort */}
                <div className="filter-group">
                  <label>Sort</label>
                  {isMobile ? (
                    <MobileSelect
                      title="Sort"
                      value={sortBy}
                      onChange={setSortBy}
                      options={sortOptions}
                    />
                  ) : (
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      {sortOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Price */}
                <div className="filter-group">
                  <label>Monthly Price</label>
                  {isMobile ? (
                    <MobileSelect
                      title="Monthly Price"
                      value={priceBand}
                      onChange={setPriceBand}
                      options={priceOptions}
                    />
                  ) : (
                    <select value={priceBand} onChange={(e) => setPriceBand(e.target.value)}>
                      {priceOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Free first visit */}
                <div className="filter-group">
                  <label>Free Visit</label>
                  {isMobile ? (
                    <MobileSelect
                      title="Free First Visit"
                      value={freeFirstVisit}
                      onChange={setFreeFirstVisit}
                      options={freeVisitOptions}
                    />
                  ) : (
                    <select
                      value={freeFirstVisit}
                      onChange={(e) => setFreeFirstVisit(e.target.value)}
                    >
                      {freeVisitOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button className="clear-filters-btn" type="button" onClick={clearFilters}>
                  Clear
                </button>
              </div>

              {selectedGym && (
                <div className="gr-muted-note">
                  Selected: <strong>{selectedGym.name}</strong>{" "}
                  <button
                    type="button"
                    className="gr-map-btn"
                    style={{ marginLeft: 10, padding: "8px 10px", borderRadius: 10 }}
                    onClick={() => flyToGym(selectedGym)}
                  >
                    Show on map
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RESULTS */}
          <div className="results-section">
            {loading && <div className="gr-empty">Loading gyms…</div>}
            {!loading && err && <div className="gr-error">{err}</div>}
            {!loading && !err && filtered.length === 0 && (
              <div className="gr-empty">No gyms match your filters.</div>
            )}

            <div className="results-grid">
              {filtered.map((g) => {
                const selected = g.gym_id === selectedGymId;
                const dist =
                  userLat != null && userLng != null
                    ? haversineKm(userLat, userLng, g.latitude, g.longitude)
                    : null;

                return (
                  <div
                    key={g.gym_id}
                    className={`result-card show ${selected ? "is-selected" : ""}`}
                    onClick={() => {
                      setSelectedGymId(g.gym_id);
                      flyToGym(g);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSelectedGymId(g.gym_id);
                        flyToGym(g);
                      }
                    }}
                  >
                    <div className="card-image">
                      <img src={g.image_url} alt={g.name} loading="lazy" />
                      {g.free_first_visit_enabled && (
                        <div className="card-badge gr-freevisit-badge">Free 1st Visit</div>
                      )}
                      {dist != null && (
                        <div className="card-badge">
                          {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                        </div>
                      )}
                    </div>

                    <div className="card-content">
                      <h3>{g.name}</h3>
                      <p className="gym-location">{g.address}</p>

                      <div className="gym-rating-row">
                        <div className="rating">
                          {g.rating_avg != null ? g.rating_avg.toFixed(1) : "—"}
                        </div>
                        <div className="reviews">
                          {g.reviews_count != null ? `${g.reviews_count} reviews` : "No reviews"}
                        </div>
                      </div>

                      <p className="gym-description">
                        {g.description ? g.description : "No description provided."}
                      </p>

                      <div className="card-actions">
                        <Link className="see-more-btn" to={`/home/gym/${g.gym_id}`}>
                          See Details
                        </Link>

                        <button
                          type="button"
                          className="favorite-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            // hook your favorite logic here
                          }}
                          aria-label="Favorite"
                        >
                          ❤
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA SECTION (optional) */}
            <div className="cta-section">
              <div className="container">
                <h2>Ready to train?</h2>
                <p>Compare gyms, amenities, and pricing — then choose your best match.</p>
                <Link className="cta-btn" to="/home">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}