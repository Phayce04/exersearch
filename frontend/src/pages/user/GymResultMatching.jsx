// ✅ WHOLE FILE: src/pages/user/GymResultsMatching.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./GymRes-Matching.css";
import { api } from "../../utils/apiClient";
import { absoluteUrl } from "../../utils/findGymsData";

const MAIN_ORANGE = "#ff8c00";
const RECOMMEND_ENDPOINT = "/gyms/recommend";
const GYM_SHOW_ENDPOINT = (id) => `/gyms/${id}`;
const DEFAULT_MODE = "driving";
const SAVED_ENDPOINT = "/user/saved-gyms";

// --------- cache (sessionStorage) ----------
const REC_CACHE_PREFIX = "rec_cache_v1__";
const REC_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function cacheKey(mode) {
  return `${REC_CACHE_PREFIX}${mode || DEFAULT_MODE}`;
}

function saveRecCache(mode, payload) {
  try {
    sessionStorage.setItem(
      cacheKey(mode),
      JSON.stringify({ ts: Date.now(), payload })
    );
  } catch {}
}

function loadRecCache(mode) {
  try {
    const raw = sessionStorage.getItem(cacheKey(mode));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.ts || !obj?.payload) return null;
    if (Date.now() - obj.ts > REC_CACHE_TTL_MS) return null;
    return obj.payload;
  } catch {
    return null;
  }
}

// Call this from FindGyms after saving prefs (optional)
// export function clearRecCacheAll() {
//   try {
//     Object.keys(sessionStorage).forEach((k) => {
//       if (k.startsWith(REC_CACHE_PREFIX)) sessionStorage.removeItem(k);
//     });
//   } catch {}
// }

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtPeso(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `₱${x.toLocaleString()}`;
}

function toSet(arr) {
  return new Set(Array.isArray(arr) ? arr : []);
}

// user-facing % (no TOPSIS shown as %)
function buildMatchPercent(gym) {
  const equip = safeNum(gym?.equipment_match); // 0..1
  const amen = safeNum(gym?.amenity_match); // 0..1
  const pen = safeNum(gym?.budget_penalty); // 0..1

  const score01 = equip * 0.45 + amen * 0.35 + pen * 0.2;
  return Math.round(Math.max(0, Math.min(1, score01)) * 100);
}

// ExerSearch Score from TOPSIS (0..1 -> 0..100 whole number)
function buildExerSearchScore(gym) {
  const t = safeNum(gym?.topsis_score);
  return Math.round(Math.max(0, Math.min(1, t)) * 100);
}

export default function GymResultsMatching() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ prefer state payload (coming back), else session cache
  const stateMode = location?.state?.mode || null;
  const statePayload = location?.state?.recommendation || null;

  const initialMode = stateMode || DEFAULT_MODE;
  const cachedPayload = !statePayload ? loadRecCache(initialMode) : null;

  const initialPayload = statePayload || cachedPayload || null;

  const [mode, setMode] = useState(initialMode);

  const [loading, setLoading] = useState(!initialPayload);
  const [error, setError] = useState(null);

  const [user, setUser] = useState(initialPayload?.user || null);
  const [gyms, setGyms] = useState(initialPayload?.gyms || []);

  const [gymImages, setGymImages] = useState({});
  const [gymAddresses, setGymAddresses] = useState({});

  // modal state
  const [openBreakdown, setOpenBreakdown] = useState(false);
  const [activeGym, setActiveGym] = useState(null);

  // saved gyms (server-backed)
  const [likedGyms, setLikedGyms] = useState(new Set());
  const [savingGymId, setSavingGymId] = useState(null);

  const fetchRecommend = useCallback(async (m) => {
    setLoading(true);
    setError(null);
    try {
      const finalMode = m || DEFAULT_MODE;
      const res = await api.get(RECOMMEND_ENDPOINT, {
        params: { mode: finalMode },
      });

      const payload = {
        user: res.data?.user || null,
        gyms: Array.isArray(res.data?.gyms) ? res.data.gyms : [],
      };

      setUser(payload.user);
      setGyms(payload.gyms);

      // ✅ cache for instant back navigation
      saveRecCache(finalMode, payload);
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load recommendations"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ on first mount: if we already have initial payload, do NOT fetch
  useEffect(() => {
    if (initialPayload) return;
    fetchRecommend(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ when mode changes: use cache instantly if available, otherwise fetch
  useEffect(() => {
    const cached = loadRecCache(mode);
    if (cached?.gyms) {
      setUser(cached.user || null);
      setGyms(Array.isArray(cached.gyms) ? cached.gyms : []);
      setLoading(false);
      setError(null);
      return;
    }
    fetchRecommend(mode);
  }, [mode, fetchRecommend]);

  // ✅ load saved gyms from backend once
  useEffect(() => {
    let mounted = true;

    async function loadSaved() {
      try {
        const res = await api.get(SAVED_ENDPOINT);
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        const ids = rows.map((r) => r.gym_id).filter((x) => x != null);
        if (mounted) setLikedGyms(new Set(ids));
      } catch {
        // silent
      }
    }

    loadSaved();
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ toggle save/unsave via backend
  const toggleLike = async (gymId) => {
    if (!gymId) return;
    if (savingGymId) return;

    const wasLiked = likedGyms.has(gymId);

    // optimistic UI
    setLikedGyms((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(gymId);
      else next.add(gymId);
      return next;
    });

    setSavingGymId(gymId);

    try {
      if (wasLiked) {
        await api.delete(`${SAVED_ENDPOINT}/${gymId}`);
      } else {
        await api.post(SAVED_ENDPOINT, { gym_id: gymId });
      }
    } catch (e) {
      console.error(e);
      // rollback
      setLikedGyms((prev) => {
        const rollback = new Set(prev);
        if (wasLiked) rollback.add(gymId);
        else rollback.delete(gymId);
        return rollback;
      });
    } finally {
      setSavingGymId(null);
    }
  };

  // fetch main_image_url + address via /gyms/{id}
  useEffect(() => {
    if (!gyms?.length) return;

    let cancelled = false;

    async function loadDetails() {
      const missing = gyms
        .map((g) => g.gym_id)
        .filter((id) => id != null && gymImages[id] === undefined);

      if (missing.length === 0) return;

      const batch = missing.slice(0, 30);

      const imgResults = {};
      const addrResults = {};

      await Promise.all(
        batch.map(async (id) => {
          try {
            const r = await api.get(GYM_SHOW_ENDPOINT(id));
            const gymObj = r.data?.data || r.data?.gym || r.data || null;

            const main =
              gymObj?.main_image_url ||
              gymObj?.mainImageUrl ||
              gymObj?.main_image ||
              null;

            imgResults[id] = main ? absoluteUrl(main) : null;

            const addr =
              gymObj?.address ||
              gymObj?.full_address ||
              gymObj?.location ||
              null;

            addrResults[id] = addr ? String(addr) : null;
          } catch {
            imgResults[id] = null;
            addrResults[id] = null;
          }
        })
      );

      if (!cancelled) {
        setGymImages((prev) => ({ ...prev, ...imgResults }));
        setGymAddresses((prev) => ({ ...prev, ...addrResults }));
      }
    }

    loadDetails();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gyms]);

  const rankedGyms = useMemo(() => gyms || [], [gyms]);

  if (loading) {
    return (
      <div className="matching-results-page">
        <section className="matching-header">
          <div className="container">
            <h1>Your Best Matches</h1>
            <p>Gyms ranked by how well they match your preferences</p>
          </div>
        </section>
        <section className="matching-results">
          <div className="container">
            <div style={{ padding: "24px", fontWeight: 800 }}>
              Loading ranked gyms…
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="matching-results-page">
        <section className="matching-header">
          <div className="container">
            <h1>Your Best Matches</h1>
            <p>Gyms ranked by how well they match your preferences</p>
          </div>
        </section>
        <section className="matching-results">
          <div className="container">
            <div style={{ padding: "24px" }}>
              <div style={{ fontWeight: 900, color: "#dc2626" }}>{error}</div>
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <button
                  className="favorite-btn-small"
                  onClick={() => fetchRecommend(mode)}
                >
                  Retry
                </button>
                <button
                  className="favorite-btn-small"
                  onClick={() => navigate("/home/find-gyms")}
                >
                  Back to Preferences
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="matching-results-page">
      <section className="matching-header">
        <div className="container">
          <h1>Your Best Matches</h1>
          <p>Gyms ranked by how well they match your preferences</p>

          <div className="mode-switch">
            {["driving", "walking", "transit"].map((m) => (
              <button
                key={m}
                className="favorite-btn-small"
                aria-pressed={mode === m}
                onClick={() => setMode(m)} // ✅ no double-fetch
                style={{
                  borderColor: mode === m ? MAIN_ORANGE : undefined,
                  background: mode === m ? "#fff5e6" : "white",
                }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="matching-results">
        <div className="container">
          <div className="results-list">
            {rankedGyms.map((gym, idx) => {
              const matchPercentage = buildMatchPercent(gym);
              const exerScore = buildExerSearchScore(gym);
              const isOverBudget = safeNum(gym?.price) > safeNum(user?.budget);

              const img =
                gymImages[gym.gym_id] ||
                "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop";

              const addressText = gymAddresses[gym.gym_id]
                ? gymAddresses[gym.gym_id]
                : gym?.latitude != null && gym?.longitude != null
                ? `${gym.latitude}, ${gym.longitude}`
                : "—";

              const distanceText =
                safeNum(gym?.google_distance_km) > 0
                  ? `${gym.google_distance_km} km`
                  : `${gym.distance_km} km`;

              const isSaved = likedGyms.has(gym.gym_id);
              const isSaving = savingGymId === gym.gym_id;

              return (
                <div key={gym.gym_id} className="match-card">
                  <div className="match-card-inner">
                    <div className="match-image">
                      <img src={img} alt={gym.name} />

                      <div className="rank-badge">#{idx + 1}</div>

                      <div className="match-badge">
                        <div className="match-percentage">
                          {matchPercentage}%
                        </div>
                        <div className="match-label">MATCH</div>
                      </div>
                    </div>

                    <div className="match-details">
                      <div className="match-header">
                        <div>
                          <h2>{gym.name}</h2>

                          <p className="gym-location">📍 {addressText}</p>

                          <p className="gym-subline">
                            {distanceText} away{" "}
                            {gym?.travel_time_min
                              ? `• ${gym.travel_time_min} min`
                              : ""}
                          </p>
                        </div>

                        <div
                          className="score-star"
                          title="Derived from TOPSIS score (0–100)"
                        >
                          <span className="star">★</span>
                          <span className="score-text">
                            ExerSearch Score: {exerScore}
                          </span>
                        </div>
                      </div>

                      <div className="quick-info">
                        <div className="info-pill distance">
                          📍 {distanceText} away
                        </div>

                        <div
                          className={`info-pill price ${
                            isOverBudget ? "over-budget" : "in-budget"
                          }`}
                        >
                          💰 {fmtPeso(gym?.price)} / {user?.plan_type || "plan"}{" "}
                          {isOverBudget ? "• Over" : "• Good"}
                        </div>
                      </div>

                      <div className="match-breakdown">
                        <div className="breakdown-title">
                          <span>MATCH BREAKDOWN</span>

                          <button
                            type="button"
                            className="breakdown-view"
                            onClick={() => {
                              setActiveGym(gym);
                              setOpenBreakdown(true);
                            }}
                            title="View equipment & amenities breakdown"
                          >
                            View →
                          </button>
                        </div>

                        <div className="breakdown-bars">
                          <div className="breakdown-bar-item">
                            <span className="breakdown-bar-label">
                              Amenities
                            </span>
                            <div className="breakdown-bar-container">
                              <div
                                className="breakdown-bar-fill"
                                style={{
                                  width: `${Math.round(
                                    safeNum(gym?.amenity_match) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="breakdown-bar-value">
                              {Math.round(safeNum(gym?.amenity_match) * 100)}%
                            </span>
                          </div>

                          <div className="breakdown-bar-item">
                            <span className="breakdown-bar-label">
                              Equipment
                            </span>
                            <div className="breakdown-bar-container">
                              <div
                                className="breakdown-bar-fill"
                                style={{
                                  width: `${Math.round(
                                    safeNum(gym?.equipment_match) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="breakdown-bar-value">
                              {Math.round(safeNum(gym?.equipment_match) * 100)}%
                            </span>
                          </div>

                          <div className="breakdown-bar-item">
                            <span className="breakdown-bar-label">
                              Budget Fit
                            </span>
                            <div className="breakdown-bar-container">
                              <div
                                className="breakdown-bar-fill"
                                style={{
                                  width: `${Math.round(
                                    safeNum(gym?.budget_penalty) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="breakdown-bar-value">
                              {Math.round(safeNum(gym?.budget_penalty) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="match-actions-row">
                        <Link
                          to={`/home/gym/${gym.gym_id}`}
                          className="view-full-btn"
                          title="Open gym details page"
                        >
                          View Full Details
                        </Link>

                        <button
                          className={`save-btn ${isSaved ? "liked" : ""}`}
                          onClick={() => toggleLike(gym.gym_id)}
                          disabled={isSaving}
                          title={isSaved ? "Remove from saved" : "Save this gym"}
                        >
                          <span className="heart">{isSaved ? "♥" : "♡"}</span>
                          {isSaving
                            ? isSaved
                              ? "Removing…"
                              : "Saving…"
                            : isSaved
                            ? "Saved"
                            : "Save"}
                        </button>
                      </div>

                      {/* OPTIONAL: go to Saved Gyms without refetching results */}
                      <div style={{ marginTop: 10 }}>
                        <button
                          className="favorite-btn-small"
                          onClick={() =>
                            navigate("/home/saved-gyms", {
                              state: {
                                from: "/home/gym-results",
                                mode,
                                recommendation: { user, gyms },
                              },
                            })
                          }
                        >
                          Go to Saved Gyms →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {rankedGyms.length === 0 ? (
              <div style={{ padding: "24px", fontWeight: 800 }}>
                No gyms found for your current filters.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {openBreakdown && activeGym && (
        <BreakdownModal
          gym={activeGym}
          user={user}
          onClose={() => {
            setOpenBreakdown(false);
            setActiveGym(null);
          }}
        />
      )}
    </div>
  );
}

function BreakdownModal({ gym, user, onClose }) {
  const prefEq = Array.isArray(user?.preferred_equipments)
    ? user.preferred_equipments
    : [];
  const prefAm = Array.isArray(user?.preferred_amenities)
    ? user.preferred_amenities
    : [];

  const matchedEq = toSet(gym?.matched_equipment_ids);
  const matchedAm = toSet(gym?.matched_amenity_ids);

  const preferredEquipments = prefEq.map((e) => ({
    ...e,
    matched: matchedEq.has(e.equipment_id),
  }));
  const preferredAmenities = prefAm.map((a) => ({
    ...a,
    matched: matchedAm.has(a.amenity_id),
  }));

  const matchedEqCount = preferredEquipments.filter((x) => x.matched).length;
  const matchedAmCount = preferredAmenities.filter((x) => x.matched).length;

  return (
    <div className="breakdown-overlay" onClick={onClose}>
      <div className="breakdown-modal" onClick={(e) => e.stopPropagation()}>
        <div className="breakdown-top">
          <div className="breakdown-heading">Breakdown • {gym?.name}</div>
          <button className="breakdown-close" onClick={onClose} title="Close">
            ✖
          </button>
        </div>

        <div className="breakdown-body">
          <div className="breakdown-stats">
            <span>Preferred Amenities: {prefAm.length}</span>
            <span>Matched: {matchedAmCount}</span>
            <span>Preferred Equipment: {prefEq.length}</span>
            <span>Matched: {matchedEqCount}</span>
          </div>

          <div className="breakdown-section">
            <div className="breakdown-section-title">
              Your Preferred Amenities
            </div>
            <div className="breakdown-grid">
              {preferredAmenities.length === 0 ? (
                <div className="breakdown-empty">
                  No preferred amenities selected.
                </div>
              ) : (
                preferredAmenities.map((a) => (
                  <div
                    key={a.amenity_id}
                    className={`breakdown-chip ${a.matched ? "ok" : "bad"}`}
                    title={a.matched ? "This gym has it" : "Missing in this gym"}
                  >
                    {a.image_url ? (
                      <img src={absoluteUrl(a.image_url)} alt={a.name} />
                    ) : (
                      <div className="breakdown-img-fallback" />
                    )}
                    <span className="mark">{a.matched ? "✓" : "✖"}</span>
                    <span className="txt">{a.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="breakdown-section">
            <div className="breakdown-section-title">
              Your Preferred Equipment
            </div>
            <div className="breakdown-grid">
              {preferredEquipments.length === 0 ? (
                <div className="breakdown-empty">
                  No preferred equipment selected.
                </div>
              ) : (
                preferredEquipments.map((e) => (
                  <div
                    key={e.equipment_id}
                    className={`breakdown-chip ${e.matched ? "ok" : "bad"}`}
                    title={e.matched ? "This gym has it" : "Missing in this gym"}
                  >
                    {e.image_url ? (
                      <img src={absoluteUrl(e.image_url)} alt={e.name} />
                    ) : (
                      <div className="breakdown-img-fallback" />
                    )}
                    <span className="mark">{e.matched ? "✓" : "✖"}</span>
                    <span className="txt" style={{ textTransform: "capitalize" }}>
                      {e.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <details className="breakdown-details">
            <summary>Show what this gym has</summary>

            <div className="breakdown-has">
              <div>
                <div className="has-title">Gym Amenities</div>
                <div className="has-tags">
                  {(Array.isArray(gym?.gym_amenities) ? gym.gym_amenities : []).map(
                    (a) => (
                      <span key={a.amenity_id} className="has-tag">
                        {a.name}
                      </span>
                    )
                  )}
                  {(Array.isArray(gym?.gym_amenities) ? gym.gym_amenities : [])
                    .length === 0 ? (
                    <div className="breakdown-empty">No amenities listed.</div>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="has-title">Gym Equipments</div>
                <div className="has-tags">
                  {(Array.isArray(gym?.gym_equipments) ? gym.gym_equipments : []).map(
                    (e) => (
                      <span
                        key={e.equipment_id}
                        className="has-tag"
                        style={{ textTransform: "capitalize" }}
                      >
                        {e.name}
                      </span>
                    )
                  )}
                  {(Array.isArray(gym?.gym_equipments) ? gym.gym_equipments : [])
                    .length === 0 ? (
                    <div className="breakdown-empty">No equipments listed.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
