import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Memberships.css";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Dumbbell,
  CalendarDays,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import Swal from "sweetalert2";
import { getMyMemberships } from "../../utils/membershipApi";

function safeArr(v) {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  return [];
}

function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(String(d));
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString();
}

function statusMeta(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return { label: "Active", cls: "um-status um-status--active", Icon: CheckCircle2 };
  if (s === "intent") return { label: "Intent", cls: "um-status um-status--intent", Icon: Clock };
  if (s === "expired") return { label: "Expired", cls: "um-status um-status--expired", Icon: AlertTriangle };
  if (s === "cancelled") return { label: "Cancelled", cls: "um-status um-status--cancelled", Icon: XCircle };
  if (s === "rejected") return { label: "Rejected", cls: "um-status um-status--rejected", Icon: XCircle };
  return { label: status || "Unknown", cls: "um-status", Icon: AlertTriangle };
}

function toMs(d) {
  if (!d) return null;
  const dt = new Date(String(d));
  const t = dt.getTime();
  if (Number.isNaN(t)) return null;
  return t;
}

function calcCountdown(endDate) {
  const endMs = toMs(endDate);
  if (!endMs) return null;

  const now = Date.now();
  let diff = endMs - now;
  if (diff < 0) diff = 0;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  return { days, totalSeconds };
}

function isActive(m) {
  return String(m?.status || "").toLowerCase() === "active";
}

export default function Memberships() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);

  const memberships = useMemo(() => safeArr(rows), [rows]);

  const activeList = useMemo(
    () => memberships.filter((m) => String(m.status || "").toLowerCase() === "active"),
    [memberships]
  );
  const historyList = useMemo(
    () => memberships.filter((m) => String(m.status || "").toLowerCase() !== "active"),
    [memberships]
  );

  const pageMeta = useMemo(() => {
    const cur = rows?.current_page || page;
    const last = rows?.last_page || 1;
    const total = rows?.total || memberships.length;
    return { cur, last, total };
  }, [rows, page, memberships.length]);

  const [selectedId, setSelectedId] = useState(null);
  const selected = useMemo(() => {
    if (!selectedId) return null;
    return (
      memberships.find(
        (m) => String(m.membership_id ?? m.id ?? `${m.gym_id}-${m.user_id}-${m.created_at}`) === String(selectedId)
      ) || null
    );
  }, [memberships, selectedId]);

  const [countdown, setCountdown] = useState(null);
  const tickRef = useRef(null);

  const fetchMemberships = async (p = 1) => {
    setLoading(true);
    try {
      const data = await getMyMemberships({ page: p, per_page: 20 });
      setRows(data);

      const list = safeArr(data);
      if (list.length) {
        const firstActive = list.find((m) => String(m.status || "").toLowerCase() === "active");
        const pick = firstActive || list[0];
        const pid = pick.membership_id ?? pick.id ?? `${pick.gym_id}-${pick.user_id}-${pick.created_at}`;
        setSelectedId(String(pid));
      } else {
        setSelectedId(null);
      }
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.message || e.message || "Failed to load memberships", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships(1);
  }, []);

  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    const m = selected;
    if (!m || !isActive(m)) {
      setCountdown(null);
      return;
    }

    const update = () => {
      const c = calcCountdown(m.end_date);
      setCountdown(c);
    };

    update();
    tickRef.current = setInterval(update, 60_000);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [selected]);

  const renderClock = () => {
    const hasSel = !!selected;
    const sel = selected || {};
    const gym = sel.gym || {};
    const meta = statusMeta(sel.status);
    const Icon = meta.Icon;
    const gymRouteId = gym.gym_id ?? gym.id ?? sel.gym_id;

    const days = hasSel && isActive(sel) && countdown ? countdown.days : 0;

    const showRenew = !hasSel || (isActive(sel) && days <= 3);
    const urgent = hasSel ? isActive(sel) && days <= 3 : true;
    const expired = hasSel ? isActive(sel) && days <= 0 : true;

    const rightCls = [
      "um-timerSplit__right",
      urgent ? "um-timerSplit__right--urgent" : "",
      expired ? "um-timerSplit__right--expired" : "",
    ].join(" ");

    const subtitle = hasSel ? gym.name || "Gym" : "Select a membership to view the timer.";

    return (
      <div className="um-card um-card--clock">
        <div className="um-card__hdr">
          <div className="um-card__hdr-ico">
            <Clock size={16} />
          </div>

          <div className="um-card__hdr-text">
            <h3>Membership Timer</h3>
            <p>{subtitle}</p>
          </div>

          {hasSel ? (
            <div className={meta.cls}>
              <Icon size={14} />
              {meta.label}
            </div>
          ) : null}
        </div>

        <div className="um-clock">
          <div className="um-timer">
            <div className="um-timerSplit">
              <div className="um-timerSplit__left">
                <div className="um-daysBig">
                  <span className="um-daysBig__num">{days}</span>
                  <span className="um-daysBig__label">days remaining</span>
                </div>
              </div>

              <div className={rightCls}>
                {showRenew ? (
                  <div className="um-renew">
                    <button
                      type="button"
                      className={[
                        "um-renewBtn",
                        urgent ? "um-renewBtn--urgent" : "",
                        expired ? "um-renewBtn--expired" : "",
                      ].join(" ")}
                      onClick={() =>
                        Swal.fire(
                          "Renewal",
                          "Please contact the gym to renew your membership.",
                          "info"
                        )
                      }
                      aria-label="Renew"
                      title="Renew"
                    >
                      <RotateCw size={18} />
                    </button>

                    <div className="um-renew__text">
                      <div className="um-renew__title">{expired ? "Renew now" : "Renew now"}</div>
                      <div className="um-renew__date">
                        {hasSel ? fmtDate(sel.end_date) : "No active membership"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="um-endOnly">
                    <div className="um-endOnly__title">End date</div>
                    <div className="um-endOnly__date">{fmtDate(sel.end_date)}</div>
                  </div>
                )}
              </div>
            </div>

            {hasSel && sel.notes ? (
              <div className="um-notes">
                <p>{sel.notes}</p>
              </div>
            ) : null}

            <div className="um-clock__actions">
              {hasSel && gymRouteId ? (
                <Link className="um-btn um-btn--ghost" to={`/home/gym/${gymRouteId}`}>
                  View gym <ChevronRight size={14} />
                </Link>
              ) : (
                <span />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStatus = () => {
    const activeCount = activeList.length;
    const historyCount = historyList.length;
    const totalCount = pageMeta.total;

    return (
      <div className="um-hero__leftStack">
        <div className="um-heroCard um-heroCard--title">
          <div className="um-heroTitleKicker">Memberships</div>

          <div className="um-heroTitleRow">
            <div>
              <div className="um-heroTitle">Your Gym Status</div>
              <div className="um-heroTitleSub">See your active memberships and your full membership history.</div>
            </div>

            <div className="um-heroChip">
              <Dumbbell size={18} />
            </div>
          </div>
        </div>

        <div className="um-heroCard um-heroCard--stats">
          <div className="um-statsRow">
            <div className="um-statBlock">
              <div className="um-statTop">
                <span className="um-statNum">{activeCount}</span>
                <span className="um-statLabel">Active</span>
              </div>
            </div>

            <div className="um-statBlock">
              <div className="um-statTop">
                <span className="um-statNum">{historyCount}</span>
                <span className="um-statLabel">History</span>
              </div>
            </div>

            <div className="um-statBlock">
              <div className="um-statTop">
                <span className="um-statNum">{totalCount}</span>
                <span className="um-statLabel">Total</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCard = (m) => {
    const gym = m.gym || {};
    const meta = statusMeta(m.status);
    const Icon = meta.Icon;
    const id = String(m.membership_id ?? m.id ?? `${m.gym_id}-${m.user_id}-${m.created_at}`);
    const selectedCls = String(selectedId || "") === id ? " um-item--selected" : "";

    return (
      <button key={id} type="button" className={`um-item${selectedCls}`} onClick={() => setSelectedId(id)}>
        <div className="um-item__top">
          <div className="um-item__title">
            <p className="um-item__gym">{gym.name || "Gym"}</p>
            <p className="um-item__sub">{gym.address ? gym.address : "—"}</p>
          </div>
          <div className={meta.cls}>
            <Icon size={14} />
            {meta.label}
          </div>
        </div>

        <div className="um-item__meta">
          <div className="um-mrow">
            <span className="um-mlabel">Plan</span>
            <span className="um-mval">{m.plan_type || "-"}</span>
          </div>
          <div className="um-mrow">
            <span className="um-mlabel">Start</span>
            <span className="um-mval">{fmtDate(m.start_date)}</span>
          </div>
          <div className="um-mrow">
            <span className="um-mlabel">End</span>
            <span className="um-mval">{fmtDate(m.end_date)}</span>
          </div>
        </div>

        <div className="um-item__hint">
          <span>View timer</span>
          <ChevronRight size={16} />
        </div>
      </button>
    );
  };

  return (
    <div className="um-app">
      <div className="um-container">
        <div className="um-hero">
          <div className="um-hero__narrow">{renderStatus()}</div>
          <div className="um-hero__right">{renderClock()}</div>
        </div>

        <div className="um-section">
          <div className="um-section__hdr">
            <h2>
              <CalendarDays size={18} /> Memberships
            </h2>
            <button className="um-btn um-btn--mini" onClick={() => fetchMemberships(1)} disabled={loading}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="um-skel">
              <div className="um-skel__bar" />
              <div className="um-skel__bar" />
              <div className="um-skel__bar" />
            </div>
          ) : memberships.length === 0 ? (
            <div className="um-empty">
              <div className="um-empty__box">
                <Dumbbell size={22} />
              </div>
              <h3>No memberships yet</h3>
              <p>When you have a membership, it will show up here with your remaining time.</p>
              <Link to="/home/find-gyms" className="um-btn um-btn--primary">
                Find gyms
              </Link>
            </div>
          ) : (
            <>
              {activeList.length ? (
                <div className="um-block">
                  <div className="um-block__hdr">
                    <h3 className="um-block__title">Active Memberships</h3>
                    <p className="um-block__sub">Tap one to see the big timer.</p>
                  </div>
                  <div className="um-grid">{activeList.map(renderCard)}</div>
                </div>
              ) : null}

              {historyList.length ? (
                <div className="um-block">
                  <div className="um-block__hdr">
                    <h3 className="um-block__title">History</h3>
                    <p className="um-block__sub">Expired, cancelled, rejected, and other past records.</p>
                  </div>
                  <div className="um-grid">{historyList.map(renderCard)}</div>
                </div>
              ) : null}

              <div className="um-pager">
                <button
                  className="um-btn um-btn--mini"
                  disabled={pageMeta.cur <= 1 || loading}
                  onClick={() => {
                    const np = pageMeta.cur - 1;
                    setPage(np);
                    fetchMemberships(np);
                  }}
                >
                  Prev
                </button>
                <span className="um-pager__text">
                  Page <strong>{pageMeta.cur}</strong> of <strong>{pageMeta.last}</strong>
                </span>
                <button
                  className="um-btn um-btn--mini"
                  disabled={pageMeta.cur >= pageMeta.last || loading}
                  onClick={() => {
                    const np = pageMeta.cur + 1;
                    setPage(np);
                    fetchMemberships(np);
                  }}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}