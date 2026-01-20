import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { MAIN, adminThemes } from "./AdminLayout"; // adjust ../ if your dashboard is deeper

const items = [
  {
    key: "1",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-0.jpg",
    title: "Gym Owner Application #1021",
    subtitle: "Titan Fitness — Pasig",
    badge: "Pending",
  },
  {
    key: "2",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-1.jpg",
    title: "New Gym Added",
    subtitle: "Ironhouse — Makati",
    badge: "New",
  },
  {
    key: "3",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-2.jpg",
    title: "Equipment Update",
    subtitle: "Added 5 items",
    badge: "Update",
  },
  {
    key: "4",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-3.jpg",
    title: "Amenity Update",
    subtitle: "Added Sauna",
    badge: "Update",
  },
  {
    key: "5",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-4.jpg",
    title: "User Activity Spike",
    subtitle: "87 interactions today",
    badge: "Activity",
  },
  {
    key: "6",
    image: "https://assets.codepen.io/3685267/nft-dashboard-art-5.jpg",
    title: "New Users",
    subtitle: "12 signups today",
    badge: "New",
  },
];

export default function AdminDashboard() {
  // ✅ theme from AdminLayout via Outlet context
  const { theme } = useOutletContext();
  const t = adminThemes[theme]?.app || adminThemes.light.app;
  const isDark = theme === "dark";

  const [tab, setTab] = useState("overview");
  const [q, setQ] = useState("");

  const tabs = useMemo(
    () => [
      { key: "overview", label: "Overview" },
      { key: "applications", label: "Applications" },
      { key: "gyms", label: "Gyms" },
      { key: "users", label: "Users" },
    ],
    []
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => (x.title + " " + x.subtitle).toLowerCase().includes(s));
  }, [q]);

  const styles = makeStyles(t, isDark);

  return (
    <div style={styles.page}>
      {/* Title + subtitle */}
      <div style={styles.topRow}>
        <div>
          <div style={styles.pageTitle}>Dashboard</div>
          <div style={styles.pageSub}>Manage gyms, approvals, users, and data from one place.</div>
        </div>

        {/* OPTIONAL: keep this search inside the page (NOT header) */}
        <div style={styles.searchBox}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cards…"
            style={styles.searchInput}
          />
          <span style={styles.searchIcon}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M8.5 15.5a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" stroke="currentColor" strokeWidth="1.7" />
              <path d="M14.2 14.2 18 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </div>

      {/* HERO */}
      <div style={{ padding: 16 }}>
        <div style={styles.hero}>
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={styles.heroTitle}>Review and manage your platform fast</div>
            <div style={styles.heroSub}>
              Approve gym owner applications, maintain gym data, and keep equipments/amenities updated.
            </div>
            <button style={styles.heroBtn}>Explore Now</button>
          </div>

          <div style={styles.heroCircle1} />
          <div style={styles.heroCircle2} />
        </div>
      </div>

      {/* Trending + tabs */}
      <div style={styles.trendingRow}>
        <div style={styles.trendingTitle}>Trending Admin Tasks</div>

        <div style={styles.tabs}>
          {tabs.map((x) => {
            const active = tab === x.key;
            return (
              <button
                key={x.key}
                onClick={() => setTab(x.key)}
                style={{
                  ...styles.tabBtn,
                  color: active ? MAIN : t.mutedText,
                  textDecoration: active ? "underline" : "none",
                  fontWeight: active ? 900 : 800,
                }}
              >
                {x.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div style={styles.gridWrap}>
        {filtered.map((x) => (
          <div key={x.key} style={styles.card}>
            <div style={{ ...styles.cardImg, backgroundImage: `url(${x.image})` }}>
              <div style={styles.cardBadge}>{x.badge}</div>
            </div>

            <div style={styles.cardBody}>
              <div style={styles.cardTitle}>{x.title}</div>
              <div style={styles.cardSub}>{x.subtitle}</div>

              <div style={styles.cardActions}>
                <button style={styles.primaryAction}>Open</button>
                <button style={styles.secondaryAction}>Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 18 }} />
    </div>
  );
}

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

    hero: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 14,
      height: 180,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      border: `1px solid ${t.border}`,
      backgroundImage: "url(https://assets.codepen.io/3685267/nft-dashboard-art-6.jpg)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: 950,
      maxWidth: 520,
      lineHeight: 1.05,
      textShadow: "0 6px 22px rgba(0,0,0,0.55)",
    },
    heroSub: {
      marginTop: 10,
      maxWidth: 620,
      color: "rgba(255,255,255,0.78)",
      fontWeight: 750,
      textShadow: "0 6px 22px rgba(0,0,0,0.55)",
    },
    heroBtn: {
      marginTop: 12,
      width: 170,
      height: 42,
      borderRadius: 12,
      border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"}`,
      background: `linear-gradient(135deg, ${MAIN}, #ff7a45)`,
      color: "#fff",
      fontWeight: 900,
      cursor: "pointer",
    },
    heroCircle1: {
      position: "absolute",
      right: -40,
      top: -60,
      width: 200,
      height: 200,
      borderRadius: 999,
      border: `10px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.16)"}`,
    },
    heroCircle2: {
      position: "absolute",
      right: 30,
      top: 30,
      width: 220,
      height: 220,
      borderRadius: 999,
      border: `10px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.14)"}`,
    },

    trendingRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "0 16px",
      marginTop: 2,
      flexWrap: "wrap",
    },
    trendingTitle: {
      fontSize: 18,
      fontWeight: 900,
    },
    tabs: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
    },
    tabBtn: {
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: 13,
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
      border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.18)"}`,
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
