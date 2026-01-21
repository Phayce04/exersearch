import React, { useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { MAIN, adminThemes } from "./AdminLayout";

/* ---------------- MOCK DATA ---------------- */

const KPI = [
  {
    key: "k1",
    title: "Pending Applications",
    value: "12",
    delta: "+3 today",
    badge: "Pending",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-0.jpg",
  },
  {
    key: "k2",
    title: "Total Gyms",
    value: "248",
    delta: "+2 this week",
    badge: "Gyms",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-1.jpg",
  },
  {
    key: "k3",
    title: "Interactions (Today)",
    value: "1,892",
    delta: "+14%",
    badge: "Traffic",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-4.jpg",
  },
  {
    key: "k4",
    title: "Failed Jobs",
    value: "0",
    delta: "last 24h",
    badge: "System",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-5.jpg",
  },
];

const ACTIVITY = [
  {
    key: "a1",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-0.jpg",
    title: "New gym owner application",
    subtitle: "Titan Fitness — Pasig • 10:42 AM",
    badge: "Application",
  },
  {
    key: "a2",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-2.jpg",
    title: "Gym equipment updated",
    subtitle: "Ironhouse — Makati • 10:18 AM",
    badge: "Update",
  },
  {
    key: "a3",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-1.jpg",
    title: "New gym added",
    subtitle: "Pulse District — Taguig • 09:55 AM",
    badge: "New",
  },
  {
    key: "a4",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-3.jpg",
    title: "Amenities updated",
    subtitle: "Added Sauna • Ironhouse — Makati",
    badge: "Amenity",
  },
  {
    key: "a5",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-4.jpg",
    title: "Interaction spike",
    subtitle: "87 interactions in 30 mins • Today",
    badge: "Activity",
  },
];

// NOTE: keep your mock arrays; in real app you'd swap based on range
const approvalsByMonth = [
  { label: "Jan", value: 12 },
  { label: "Feb", value: 18 },
  { label: "Mar", value: 8 },
  { label: "Apr", value: 22 },
  { label: "May", value: 16 },
  { label: "Jun", value: 26 },
  { label: "Jul", value: 19 },
  { label: "Aug", value: 14 },
  { label: "Sep", value: 20 },
  { label: "Oct", value: 11 },
  { label: "Nov", value: 17 },
  { label: "Dec", value: 23 },
];

const interactionsTrend = [12, 14, 11, 18, 24, 19, 28, 31, 26, 33, 29, 35];

/* ---------------- DASHBOARD ---------------- */

export default function AdminDashboard() {
  const { theme } = useOutletContext();
  const t = adminThemes[theme]?.app || adminThemes.light.app;
  const isDark = theme === "dark";
  const styles = makeStyles(t, isDark);

  const [q, setQ] = useState("");
  const [range, setRange] = useState("30d"); // default: last 30 days

  const rangeLabel =
    range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "Last 12 months";

  const filteredActivity = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ACTIVITY;
    return ACTIVITY.filter((x) =>
      (x.title + " " + x.subtitle).toLowerCase().includes(s)
    );
  }, [q]);

  // ✅ Ensure "Details" is readable in dark mode
  const detailsBtnStyle = useMemo(
    () => ({
      ...styles.secondaryAction,
      color: t.text,
    }),
    [styles.secondaryAction, t.text]
  );

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.topRow}>
        <div>
          <div style={styles.pageTitle}>Dashboard</div>
        </div>

        <div style={styles.searchBox}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search recent activity…"
            style={styles.searchInput}
          />
          <span style={styles.searchIcon}>⌕</span>
        </div>
      </div>

      {/* KPI CARDS */}
      <div
        style={{
          ...styles.gridWrap,
          gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
          paddingTop: 12,
        }}
      >
        {KPI.map((x) => (
          <div key={x.key} style={styles.card}>
            <div
              style={{
                ...styles.cardImg,
                height: 110,
                backgroundImage: `url(${x.image})`,
              }}
            >
              <div style={styles.cardBadge}>{x.badge}</div>
            </div>

            <div style={styles.cardBody}>
              <div style={{ ...styles.cardSub, marginTop: 0 }}>{x.title}</div>
              <div style={{ ...styles.cardTitle, fontSize: 22, marginTop: 6 }}>
                {x.value}
              </div>
              <div style={{ ...styles.cardSub, marginTop: 6 }}>{x.delta}</div>

              <div style={styles.cardActions}>
                <button style={detailsBtnStyle}>Details</button>
                <button style={styles.primaryAction}>Open</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PLATFORM ACTIVITY (replaces "Trends") */}
      <div style={{ padding: "0 16px", marginTop: 10 }}>
        <div
          style={{
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            background: t.soft2,
            boxShadow: t.shadow,
            overflow: "hidden",
          }}
        >
          {/* Header: title + range inside + actions */}
          <div
            style={{
              padding: 14,
              borderBottom: `1px solid ${t.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              background: t.soft,
            }}
          >
            <div>
              <div style={{ fontWeight: 950, fontSize: 18 }}>Platform activity</div>
              <div style={styles.pageSub}>{rangeLabel}</div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {/* Range moved here */}
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                style={{
                  height: 38,
                  padding: "0 12px",
                  borderRadius: 12,
                  border: `1px solid ${t.border}`,
                  background: t.soft2,
                  color: t.text,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                title="Range (UI only for now)"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="12m">Last 12 months</option>
              </select>

              <button
                style={{
                  height: 38,
                  padding: "0 14px",
                  borderRadius: 12,
                  border: `1px solid ${t.border}`,
                  background: t.soft2,
                  color: t.text,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                onClick={() => {}}
              >
                Export
              </button>
            </div>
          </div>

          {/* ✅ Taller charts + interactive hover */}
          <div style={{ padding: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <ChartBlock t={t} title="Applications approved">
                <InteractiveBarChart data={approvalsByMonth} height={420} color={MAIN} t={t} />
              </ChartBlock>

              <ChartBlock t={t} title="Interactions trend">
                <InteractiveLineChart points={interactionsTrend} height={420} stroke={MAIN} t={t} />
              </ChartBlock>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT */}
      <div style={{ padding: "0 16px", marginTop: 18 }}>
        <div style={styles.trendingRow}>
          <div style={styles.trendingTitle}>Recent</div>
        </div>
      </div>

      <div style={styles.gridWrap}>
        {filteredActivity.map((x) => (
          <div key={x.key} style={styles.card}>
            <div
              style={{
                ...styles.cardImg,
                backgroundImage: `url(${x.image})`,
              }}
            >
              <div style={styles.cardBadge}>{x.badge}</div>
            </div>

            <div style={styles.cardBody}>
              <div style={styles.cardTitle}>{x.title}</div>
              <div style={styles.cardSub}>{x.subtitle}</div>

              <div style={styles.cardActions}>
                <button style={styles.primaryAction}>Open</button>
                <button style={detailsBtnStyle}>Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function ChartBlock({ t, title, children }) {
  return (
    <div
      style={{
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: 12,
        background: t.soft,
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
      <div style={{ marginTop: 10, position: "relative" }}>{children}</div>
    </div>
  );
}

/* ---------------- INTERACTIVE CHARTS ---------------- */

function InteractiveBarChart({ data, height, color, t }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const width = 1600;
  const pad = 28;
  const gap = 14;

  const max = Math.max(1, ...data.map((d) => d.value));
  const barW = (width - pad * 2 - gap * (data.length - 1)) / data.length;

  const onMove = (e) => {
    const el = svgRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const x = (mx / r.width) * width;

    const idx = Math.floor((x - pad) / (barW + gap));
    if (idx < 0 || idx >= data.length) {
      setHover(null);
      return;
    }

    const d = data[idx];
    const barX = pad + idx * (barW + gap);
    const barH = ((height - pad * 2) * d.value) / max;
    const barY = height - pad - barH;

    setHover({
      idx,
      label: d.label,
      value: d.value,
      x: barX + barW / 2,
      y: barY,
    });
  };

  const onLeave = () => setHover(null);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", display: "block", cursor: "crosshair" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* baseline */}
      <line
        x1={pad}
        y1={height - pad}
        x2={width - pad}
        y2={height - pad}
        stroke={t.border}
      />

      {data.map((d, i) => {
        const h = ((height - pad * 2) * d.value) / max;
        const x = pad + i * (barW + gap);
        const y = height - pad - h;

        const active = hover?.idx === i;

        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx="14"
              fill={color}
              opacity={active ? 1 : 0.88}
            />
          </g>
        );
      })}

      {/* hover indicator + tooltip */}
      {hover && (
        <g>
          <line
            x1={hover.x}
            y1={pad}
            x2={hover.x}
            y2={height - pad}
            stroke="rgba(0,0,0,0.08)"
          />

          <circle cx={hover.x} cy={Math.max(pad, hover.y)} r="7" fill={color} />

          <Tooltip
            x={hover.x}
            y={Math.max(pad + 8, hover.y - 14)}
            title={hover.label}
            value={hover.value}
          />
        </g>
      )}
    </svg>
  );
}

function InteractiveLineChart({ points, height, stroke, t }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const width = 1600;
  const pad = 28;

  const max = Math.max(1, ...points);
  const min = Math.min(...points);
  const span = Math.max(1, max - min);

  const step = (width - pad * 2) / (points.length - 1);

  const xyAt = (i) => {
    const x = pad + i * step;
    const y = height - pad - ((points[i] - min) / span) * (height - pad * 2);
    return { x, y };
  };

  const path = points
    .map((p, i) => {
      const { x, y } = xyAt(i);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const onMove = (e) => {
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const x = (mx / r.width) * width;

    const idx = Math.round((x - pad) / step);
    if (idx < 0 || idx >= points.length) {
      setHover(null);
      return;
    }
    const { x: hx, y: hy } = xyAt(idx);
    setHover({ idx, x: hx, y: hy, value: points[idx], label: `Point ${idx + 1}` });
  };

  const onLeave = () => setHover(null);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", display: "block", cursor: "crosshair" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* baseline */}
      <line
        x1={pad}
        y1={height - pad}
        x2={width - pad}
        y2={height - pad}
        stroke={t.border}
      />

      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {hover && (
        <g>
          <line
            x1={hover.x}
            y1={pad}
            x2={hover.x}
            y2={height - pad}
            stroke="rgba(0,0,0,0.08)"
          />
          <circle cx={hover.x} cy={hover.y} r="8" fill={stroke} />
          <Tooltip
            x={hover.x}
            y={Math.max(pad + 8, hover.y - 14)}
            title="Value"
            value={hover.value}
          />
        </g>
      )}
    </svg>
  );
}

function Tooltip({ x, y, title, value }) {
  const w = 190;
  const h = 66;

  const left = x - w / 2;
  const top = y - h - 10;

  return (
    <g transform={`translate(${left}, ${top})`}>
      <rect x="0" y="0" width={w} height={h} rx="14" fill="rgba(0,0,0,0.65)" />
      <text x="14" y="26" fill="#fff" fontSize="14" fontWeight="800">
        {title}
      </text>
      <text x="14" y="48" fill="#fff" fontSize="16" fontWeight="900">
        {value}
      </text>
    </g>
  );
}

/* ---------------- STYLES (UNCHANGED) ---------------- */

function makeStyles(t, isDark) {
  return {
    page: {
      width: "100%",
      background: t.bg,
      color: t.text,
    },

    topRow: {
      padding: "16px 16px 0",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
    },

    pageTitle: {
      fontSize: 26,
      fontWeight: 950,
      letterSpacing: -0.2,
    },
    pageSub: {
      marginTop: 6,
      color: t.mutedText,
      fontWeight: 700,
      fontSize: 13,
      maxWidth: 560,
    },

    searchBox: {
      position: "relative",
      flex: 1,
      minWidth: 220,
      maxWidth: 420,
    },
    searchInput: {
      width: "100%",
      height: 42,
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      background: t.soft,
      color: t.text,
      padding: "0 44px 0 12px",
      outline: "none",
      fontWeight: 800,
    },
    searchIcon: {
      position: "absolute",
      right: 12,
      top: 0,
      bottom: 0,
      display: "grid",
      placeItems: "center",
      opacity: 0.85,
      color: t.mutedText,
    },

    trendingRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "0 0",
      marginTop: 2,
      flexWrap: "wrap",
    },
    trendingTitle: {
      fontSize: 18,
      fontWeight: 900,
    },

    gridWrap: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: 12,
      padding: 16,
    },

    card: {
      borderRadius: 14,
      overflow: "hidden",
      border: `1px solid ${t.border}`,
      background: t.soft2,
      boxShadow: t.shadow,
    },
    cardImg: {
      height: 150,
      backgroundSize: "cover",
      backgroundPosition: "center",
      position: "relative",
    },
    cardBadge: {
      position: "absolute",
      left: 12,
      bottom: 12,
      padding: "8px 10px",
      borderRadius: 12,
      background: "rgba(0,0,0,0.35)",
      border: `1px solid ${
        isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.18)"
      }`,
      backdropFilter: "blur(10px)",
      fontWeight: 900,
      fontSize: 12,
      color: "#fff",
    },

    cardBody: {
      padding: 12,
    },
    cardTitle: {
      fontWeight: 950,
      fontSize: 16,
      marginTop: 2,
    },
    cardSub: {
      marginTop: 6,
      color: t.mutedText,
      fontWeight: 700,
      fontSize: 13,
    },

    cardActions: {
      display: "flex",
      gap: 10,
      marginTop: 12,
    },
    primaryAction: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      background: `linear-gradient(135deg, ${MAIN}, #ff7a45)`,
      color: "#fff",
      fontWeight: 900,
      cursor: "pointer",
    },
    secondaryAction: {
      flex: 1,
      height: 42,
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      background: t.soft,
      color: t.text,
      fontWeight: 900,
      cursor: "pointer",
    },
  };
}
