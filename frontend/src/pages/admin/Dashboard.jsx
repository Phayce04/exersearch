import React, { useMemo, useState } from "react";

const MAIN = "#d23f0b";

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

  return (
    <div style={styles.page}>
      {/* TOP STICKY HEADER (like the sample) */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.brandCircle}>E</div>
          <div style={styles.brandText}>EXERSEARCH</div>
        </div>

        <div style={styles.headerSearchWrap}>
          <button style={styles.mobileMenuBtn} title="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div style={styles.searchBox}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="search for users, gyms, applications..."
              style={styles.searchInput}
            />
            <span style={styles.searchIcon}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M8.5 15.5a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M14.2 14.2 18 18"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>
        </div>

        <div style={styles.headerRight}>
          <button style={styles.iconBtn} title="Notifications">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2a5 5 0 0 0-5 5v2.8l-.9.9A1 1 0 0 0 4.8 12h10.4a1 1 0 0 0 .7-1.7l-.9-.9V7a5 5 0 0 0-5-5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M7.8 15a2.2 2.2 0 0 0 4.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span style={styles.dot} />
          </button>

          <div style={styles.avatar} title="Admin" />
          <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor" style={{ opacity: 0.9 }}>
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* MAIN LAYOUT (fills whole width, no margins) */}
      <div style={styles.mainRow}>
        <div style={styles.mainCol}>
          {/* Title + subtitle */}
          <div style={{ padding: "16px 16px 0" }}>
            <div style={styles.pageTitle}>Dashboard</div>
            <div style={styles.pageSub}>Manage gyms, approvals, users, and data from one place.</div>
          </div>

          {/* HERO BANNER */}
          <div style={{ padding: 16 }}>
            <div style={styles.hero}>
              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={styles.heroTitle}>Review and manage your platform fast</div>
                <div style={styles.heroSub}>
                  Approve gym owner applications, maintain gym data, and keep equipments/amenities updated.
                </div>

                <button style={styles.heroBtn}>Explore Now</button>
              </div>

              {/* background circles */}
              <div style={styles.heroCircle1} />
              <div style={styles.heroCircle2} />
            </div>
          </div>

          {/* Trending header + tabs */}
          <div style={styles.trendingRow}>
            <div style={styles.trendingTitle}>Trending Admin Tasks</div>

            <div style={styles.tabs}>
              {tabs.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      ...styles.tabBtn,
                      color: active ? MAIN : "rgba(255,255,255,0.55)",
                      textDecoration: active ? "underline" : "none",
                      fontWeight: active ? 900 : 800,
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards grid (replacing artworks with admin cards) */}
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

          {/* bottom spacing */}
          <div style={{ height: 18 }} />
        </div>
      </div>
    </div>
  );
}

/* ---------- styles ---------- */

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#0f1115",
    color: "#fff",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    background: "#0f1115",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 220,
  },
  brandCircle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 18,
    background: `linear-gradient(135deg, ${MAIN}, #ff7a45)`,
  },
  brandText: {
    fontWeight: 900,
    letterSpacing: 0.6,
    fontSize: 16,
  },

  headerSearchWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  mobileMenuBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    cursor: "pointer",
    display: "none",
  },

  searchBox: {
    position: "relative",
    flex: 1,
    maxWidth: 760,
  },
  searchInput: {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
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
    opacity: 0.9,
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    justifyContent: "flex-end",
    minWidth: 220,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    cursor: "pointer",
    position: "relative",
  },
  dot: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 10,
    height: 10,
    borderRadius: 999,
    background: MAIN,
    boxShadow: `0 0 0 3px rgba(210,63,11,0.18)`,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundImage: "url(/arellano.png)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  mainRow: {
    display: "flex",
    width: "100%",
  },
  mainCol: {
    flex: 1,
    width: "100%",
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: 950,
    letterSpacing: -0.2,
  },
  pageSub: {
    marginTop: 6,
    color: "rgba(255,255,255,0.6)",
    fontWeight: 700,
    fontSize: 13,
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
    border: "1px solid rgba(255,255,255,0.10)",
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
    border: "1px solid rgba(255,255,255,0.12)",
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
    border: "10px solid rgba(255,255,255,0.08)",
  },
  heroCircle2: {
    position: "absolute",
    right: 30,
    top: 30,
    width: 220,
    height: 220,
    borderRadius: 999,
    border: "10px solid rgba(255,255,255,0.06)",
  },

  trendingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "0 16px",
    marginTop: 2,
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
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
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
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
    fontWeight: 900,
    fontSize: 12,
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
    color: "rgba(255,255,255,0.65)",
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
    border: "1px solid rgba(255,255,255,0.10)",
    background: `linear-gradient(135deg, ${MAIN}, #ff7a45)`,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryAction: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
};
