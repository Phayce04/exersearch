import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SavedGyms.css";
import { api } from "../../utils/apiClient";
import { absoluteUrl } from "../../utils/findGymsData";

const MAIN_ORANGE = "#ff8c00";
const SAVED_ENDPOINT = "/user/saved-gyms";

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtPeso(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `₱${x.toLocaleString()}`;
}

function pickPlanPrice(g, planType) {
  const plan = (planType || "").toLowerCase();
  if (plan === "daily") return safeNum(g?.daily_price);
  if (plan === "annual" || plan === "yearly") return safeNum(g?.annual_price);
  return safeNum(g?.monthly_price);
}

function prettyPlan(planType) {
  const p = (planType || "").toLowerCase();
  if (p === "daily") return "day";
  if (p === "annual" || p === "yearly") return "year";
  return "month";
}

export default function SavedGyms() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busyGymId, setBusyGymId] = useState(null);
  const [error, setError] = useState(null);

  const [rows, setRows] = useState([]);
  const [planType] = useState("monthly");

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(SAVED_ENDPOINT);
      const data = res.data?.data;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message || e?.message || "Failed to load saved gyms"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const unsave = async (gymId) => {
    if (!gymId) return;
    setBusyGymId(gymId);

    const prev = rows;
    setRows((cur) => cur.filter((x) => x.gym_id !== gymId));

    try {
      await api.delete(`${SAVED_ENDPOINT}/${gymId}`);
    } catch (e) {
      console.error(e);
      setRows(prev);
      setError(
        e?.response?.data?.message || e?.message || "Failed to unsave gym"
      );
    } finally {
      setBusyGymId(null);
    }
  };

  const savedCount = rows.length;

  const normalized = useMemo(() => {
    return rows.map((g) => {
      const image =
        g?.main_image_url
          ? absoluteUrl(g.main_image_url)
          : "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop";

      const price = pickPlanPrice(g, planType);
      const addr =
        g?.address ||
        (g?.latitude != null && g?.longitude != null
          ? `${g.latitude}, ${g.longitude}`
          : "—");

      return {
        ...g,
        _image: image,
        _addr: addr,
        _price: price,
      };
    });
  }, [rows, planType]);

  return (
    <div className="saved-page">
      <section className="saved-header">
        <div className="container">
          <div className="saved-header-top">
            <div>
              <h1>Saved Gyms</h1>
              <p>Your bookmarked gyms — ready when you are.</p>
            </div>

            <div className="saved-header-actions">
              <button
                className="btn-outline"
                onClick={() => navigate("/home/gym-results")}
                title="Back to results"
              >
                ← Results
              </button>
              <button className="btn-solid" onClick={fetchSaved} title="Refresh">
                Refresh
              </button>
            </div>
          </div>

          <div className="saved-summary">
            <span className="summary-pill">
              ★ Saved: <b>{savedCount}</b>
            </span>
            <span className="summary-pill">
              Plan: <b>{prettyPlan(planType)}</b>
            </span>
          </div>
        </div>
      </section>

      <section className="saved-body">
        <div className="container">
          {loading ? (
            <div className="state-box">
              <div className="state-title">Loading your saved gyms…</div>
              <div className="state-sub">Please wait.</div>
            </div>
          ) : error ? (
            <div className="state-box error">
              <div className="state-title">Oops.</div>
              <div className="state-sub">{error}</div>
              <div className="state-actions">
                <button className="btn-solid" onClick={fetchSaved}>
                  Retry
                </button>
              </div>
            </div>
          ) : savedCount === 0 ? (
            <div className="empty-wrap">
              <div className="empty-card">
                <div className="empty-icon">♡</div>
                <div className="empty-title">No saved gyms yet</div>
                <div className="empty-sub">
                  Start exploring and tap <b>Save</b> to keep gyms here.
                </div>

                <div className="empty-actions">
                  <Link className="btn-solid" to="/home/gym-results">
                    Back to Results
                  </Link>
                  <Link className="btn-outline" to="/home/find-gyms">
                    Update Preferences
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="saved-list">
              {normalized.map((gym) => {
                const gymId = gym.gym_id;
                const isBusy = busyGymId === gymId;

                return (
                  <div key={gym.saved_id || gymId} className="saved-card">
                    <div className="saved-image">
                      <img src={gym._image} alt={gym.name} />
                    </div>

                    <div className="saved-details">
                      <div className="saved-toprow">
                        <div>
                          <h2 className="saved-title">{gym.name}</h2>
                          <p className="saved-location">📍 {gym._addr}</p>
                        </div>

                        <div className="saved-price">
                          <span className="price-pill">
                            💰 {fmtPeso(gym._price)} / {prettyPlan(planType)}
                          </span>
                        </div>
                      </div>

                      <div className="saved-meta">
                        <span className="meta-pill">
                          🕒 {gym.opening_time || "—"} -{" "}
                          {gym.closing_time || "—"}
                        </span>
                        <span className="meta-pill">
                          🏷️ {gym.gym_type || "Gym"}
                        </span>
                        <span className="meta-pill">
                          ✅ Saved{" "}
                          {gym.saved_at
                            ? new Date(gym.saved_at).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>

                      <div className="saved-actions">
                        <Link
                          to={`/home/gym/${gymId}`}
                          className="btn-solid"
                          title="Open gym details"
                        >
                          View Full Details
                        </Link>

                        <button
                          className="btn-outline danger"
                          onClick={() => unsave(gymId)}
                          disabled={isBusy}
                          title="Remove from saved"
                        >
                          {isBusy ? "Removing…" : "Unsave"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
