import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import "./OwnerReviewsModal.css";
import {
  Star,
  X,
  Search,
  Filter,
  ShieldCheck,
  ShieldOff,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Stars,
} from "lucide-react";
import {
  getGymRatings,
  normalizeGymRatingsResponse,
  ratingBadgeMeta,
} from "../../utils/gymRatingApi";

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString();
}

function StarsRow({ value = 0 }) {
  const n = Math.max(0, Math.min(5, safeNum(value)));
  return (
    <div className="or-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`or-star ${i < n ? "is-on" : ""}`} size={16} />
      ))}
    </div>
  );
}

function avgFrom(list) {
  const rows = Array.isArray(list) ? list : [];
  const nums = rows.map((r) => safeNum(r?.stars)).filter((n) => n >= 1 && n <= 5);
  if (!nums.length) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return sum / nums.length;
}

function sortFallback(rows, sort) {
  const list = Array.isArray(rows) ? [...rows] : [];
  const dt = (x) => {
    const t = new Date(String(x || "")).getTime();
    return Number.isFinite(t) ? t : 0;
  };
  if (sort === "oldest") return list.sort((a, b) => dt(a?.created_at) - dt(b?.created_at));
  if (sort === "highest") return list.sort((a, b) => safeNum(b?.stars) - safeNum(a?.stars));
  if (sort === "lowest") return list.sort((a, b) => safeNum(a?.stars) - safeNum(b?.stars));
  return list.sort((a, b) => dt(b?.created_at) - dt(a?.created_at)); // newest
}

function applyClientFilters(rows, { tab, stars, q }) {
  let list = Array.isArray(rows) ? [...rows] : [];

  if (tab === "verified") list = list.filter((r) => !!r?.verified || !!r?.verified_via);
  if (tab === "unverified") list = list.filter((r) => !r?.verified && !r?.verified_via);

  if (stars >= 1 && stars <= 5) list = list.filter((r) => safeNum(r?.stars) === stars);

  const qq = String(q || "").trim().toLowerCase();
  if (qq) {
    list = list.filter((r) => {
      const user = r?.user || {};
      const hay = `${r?.review || ""} ${user?.name || ""} ${user?.email || ""}`.toLowerCase();
      return hay.includes(qq);
    });
  }

  return list;
}

export default function OwnerReviewsModal({
  open = true,
  gymId,
  gymName = "Gym",
  onClose,
}) {
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState("all"); // all | verified | unverified
  const [stars, setStars] = useState(0); // 0 = all
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest"); // newest|oldest|highest|lowest

  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const [data, setData] = useState({
    summary: {
      public_avg_stars: null,
      verified_count: 0,
      unverified_count: 0,
      total_count: 0,
      note: "",
    },
    ratings: [],
    pagination: { current_page: 1, per_page: 10, last_page: 1, total: 0 },
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  // NOTE: your backend currently doesn't implement these filters;
  // so we only request basic pagination and we filter locally.
  const apiParams = useMemo(() => {
    return { per_page: perPage, page };
  }, [perPage, page]);

  useEffect(() => {
    if (!open || !gymId) return;

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getGymRatings(gymId, apiParams);
        if (!alive) return;
        setData(normalizeGymRatingsResponse(res));
      } catch (e) {
        if (!alive) return;
        Swal.fire("Error", e?.message || "Failed to load reviews", "error");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, gymId, apiParams]);

  // reset to page 1 when filters change (UX)
  useEffect(() => {
    if (!open) return;
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, stars, sort, q, open]);

  if (!open) return null;

  const summary = data?.summary || {};
  const rawRatings = Array.isArray(data?.ratings) ? data.ratings : [];
  const pagination =
    data?.pagination || { current_page: 1, last_page: 1, total: 0 };

  const filtered = useMemo(() => {
    const f = applyClientFilters(rawRatings, { tab, stars, q });
    return sortFallback(f, sort);
  }, [rawRatings, tab, stars, q, sort]);

  const overallAvg = avgFrom(rawRatings); // all on page
  const publicAvg =
    summary.public_avg_stars == null ? null : safeNum(summary.public_avg_stars);

  const canPrev = Number(pagination.current_page || 1) > 1;
  const canNext =
    Number(pagination.current_page || 1) < Number(pagination.last_page || 1);

  return (
    <div className="or-overlay" onMouseDown={onClose}>
      <div className="or-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="or-header">
          <div>
            <div className="or-title">Reviews • {gymName}</div>
            <div className="or-sub">
              Public rating uses <b>verified</b> reviews only.
              {summary?.note ? ` ${summary.note}` : ""}
            </div>
          </div>

          <button
            className="or-close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="or-layout">
          <div className="or-rail">
            <div className="or-card or-card--public">
              <div className="or-card-top">
                <div className="or-card-label">
                  <Sparkles size={16} /> Public Score
                </div>
              </div>
              <div className="or-card-value">
                {publicAvg == null ? "—" : publicAvg.toFixed(2)}
                <span className="or-card-muted"> / 5</span>
              </div>
              <div className="or-card-mini">Verified-only</div>
            </div>

            <div className="or-card or-card--overall">
              <div className="or-card-top">
                <div className="or-card-label">
                  <Stars size={16} /> Overall Avg
                </div>
              </div>
              <div className="or-card-value">
                {overallAvg == null ? "—" : overallAvg.toFixed(2)}
                <span className="or-card-muted"> / 5</span>
              </div>
              <div className="or-card-mini">Verified + Unverified</div>
            </div>

            <div className="or-card or-card--verified">
              <div className="or-card-top">
                <div className="or-card-label">
                  <ShieldCheck size={16} /> Verified
                </div>
              </div>
              <div className="or-card-value">{Number(summary.verified_count || 0)}</div>
              <div className="or-card-mini">Counts toward public score</div>
            </div>

            <div className="or-card or-card--unverified">
              <div className="or-card-top">
                <div className="or-card-label">
                  <ShieldOff size={16} /> Unverified
                </div>
              </div>
              <div className="or-card-value">{Number(summary.unverified_count || 0)}</div>
              <div className="or-card-mini">Displayed with label</div>
            </div>
          </div>

          <div className="or-main">
            <div className="or-controls">
              <div className="or-tabs">
                <button
                  className={`or-tab ${tab === "all" ? "is-on" : ""}`}
                  onClick={() => setTab("all")}
                  type="button"
                >
                  All
                </button>
                <button
                  className={`or-tab ${tab === "verified" ? "is-on" : ""}`}
                  onClick={() => setTab("verified")}
                  type="button"
                >
                  Verified
                </button>
                <button
                  className={`or-tab ${tab === "unverified" ? "is-on" : ""}`}
                  onClick={() => setTab("unverified")}
                  type="button"
                >
                  Unverified
                </button>
              </div>

              <div className="or-filters">
                {/* SWITCHED: order filter first */}
                <select
                  className="or-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="highest">Highest Stars</option>
                  <option value="lowest">Lowest Stars</option>
                </select>

                {/* SWITCHED: search after order */}
                <div className="or-search">
                  <Search size={16} />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search review or user..."
                  />
                </div>

                <div className="or-stars-filter" title="Filter by star rating">
                  <Filter size={16} />
                  <div className="or-starchips">
                    <button
                      className={`or-chip ${stars === 0 ? "is-on" : ""}`}
                      onClick={() => setStars(0)}
                      type="button"
                    >
                      All
                    </button>
                    {[5, 4, 3, 2, 1].map((s) => (
                      <button
                        key={s}
                        className={`or-chip ${stars === s ? "is-on" : ""}`}
                        onClick={() => setStars(s)}
                        type="button"
                      >
                        {s}★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="or-list">
              {loading ? (
                <div className="or-empty">Loading reviews…</div>
              ) : filtered.length === 0 ? (
                <div className="or-empty">No reviews match your filters.</div>
              ) : (
                filtered.map((r) => {
                  const badge = ratingBadgeMeta(r);
                  const user = r.user || {};
                  return (
                    <div className="or-item" key={r.rating_id}>
                      <div className="or-item-top">
                        <div className="or-user">
                          <div className="or-user-name">{user.name || "User"}</div>
                          <div className="or-user-sub">
                            {user.email || ""}
                            <span className="or-dot">•</span>
                            {fmtDate(r.created_at)}
                          </div>
                        </div>

                        <div className="or-right">
                          <span className={`or-badge ${badge.tone}`}>{badge.label}</span>
                          <StarsRow value={r.stars} />
                        </div>
                      </div>

                      {r.review ? (
                        <div className="or-review">{r.review}</div>
                      ) : (
                        <div className="or-review or-muted">No written review.</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="or-footer">
              <div className="or-pageinfo">
                Page <b>{pagination.current_page || 1}</b> of{" "}
                <b>{pagination.last_page || 1}</b>
                <span className="or-dot">•</span>
                Total <b>{pagination.total || 0}</b>
              </div>

              <div className="or-pager">
                <button
                  className="or-pagebtn"
                  disabled={!canPrev}
                  onClick={() => canPrev && setPage((p) => p - 1)}
                  type="button"
                >
                  <ArrowLeft size={16} /> Prev
                </button>
                <button
                  className="or-pagebtn"
                  disabled={!canNext}
                  onClick={() => canNext && setPage((p) => p + 1)}
                  type="button"
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}