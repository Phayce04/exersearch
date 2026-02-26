import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../user/Header-user";
import Footer from "../user/Footer";
import "./ViewStats.css";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  DollarSign,
  Star,
  Activity,
  Award,
  Target,
  Download,
  Share2,
  MessageSquare,
  Sparkles,
  TrendingDown as TrendDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Info,
} from "lucide-react";
import { getGymRatings, normalizeGymRatingsResponse } from "../../utils/gymRatingApi";

const STOPWORDS = new Set([
  "a","an","and","are","as","at","be","but","by","for","from","has","have","he",
  "her","hers","him","his","i","if","in","is","it","its","just","me","my","no",
  "not","of","on","or","our","ours","so","that","the","their","them","then",
  "there","they","this","to","too","us","was","we","were","what","when","where",
  "which","who","will","with","you","your","yours",
  "gym","place","nice","good","great","okay","very","super","really"
]);

function tokenizeReview(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .filter((w) => w.length >= 3)
    .filter((w) => !STOPWORDS.has(w));
}

function buildKeywordTable(ratings, { topN = 8 } = {}) {
  const total = new Map();
  const verified = new Map();

  for (const r of ratings || []) {
    const uniqueWords = Array.from(new Set(tokenizeReview(r?.review)));
    for (const w of uniqueWords) {
      total.set(w, (total.get(w) || 0) + 1);
      if (r?.verified) verified.set(w, (verified.get(w) || 0) + 1);
    }
  }

  return Array.from(total.entries())
    .map(([word, mentions]) => {
      const v = verified.get(word) || 0;
      const share = mentions > 0 ? (v / mentions) * 100 : 0;
      return {
        name: word,
        visits: mentions,
        conversions: v,
        ctr: Number(share.toFixed(1)),
        cost: 0,
      };
    })
    .sort((a, b) => b.visits - a.visits)
    .slice(0, topN);
}

function buildStarDistribution(ratings, { verifiedOnly = false } = {}) {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings || []) {
    if (verifiedOnly && !r?.verified) continue;
    const s = Number(r?.stars);
    if (s >= 1 && s <= 5) dist[s] += 1;
  }
  return dist;
}

async function fetchAllGymRatings(gymId) {
  const per_page = 100;
  let page = 1;
  let all = [];
  let summary = null;

  while (true) {
    const raw = await getGymRatings(gymId, { per_page, page });
    const norm = normalizeGymRatingsResponse(raw);

    summary = norm.summary;
    all = all.concat(norm.ratings || []);

    const last = Number(norm.pagination?.last_page || 1);
    if (page >= last) break;
    page += 1;
    if (page > 20) break;
  }

  return { summary, ratings: all };
}

const MOCK_STATS = {
  gym_name: "IronForge Fitness",
  gym_id: 1,
  last_updated: "2 minutes ago",

  hero_metrics: {
    views: { current: 1247, previous: 1108, change: 12.5, trend: "up", prediction: 1380, status: "excellent" },
    members: { current: 156, previous: 144, change: 8.3, trend: "up", prediction: 168, status: "good" },
    engagement: { current: 410, previous: 372, change: 10.2, trend: "up", prediction: 450, status: "good" },
    rating: { current: 0, previous: 0, change: 0, trend: "up", prediction: 4.9, status: "excellent" },
  },

  performance_score: { overall: 87, visibility: 92, engagement: 78, satisfaction: 94, growth: 85 },

  timeline_data: [
    { date: "Feb 1", views: 42, members: 8, engagement: 10, rating: 4.7 },
    { date: "Feb 2", views: 38, members: 6, engagement: 9, rating: 4.7 },
    { date: "Feb 3", views: 51, members: 10, engagement: 13, rating: 4.8 },
    { date: "Feb 4", views: 45, members: 7, engagement: 11, rating: 4.7 },
    { date: "Feb 5", views: 48, members: 9, engagement: 12, rating: 4.8 },
    { date: "Feb 6", views: 55, members: 11, engagement: 15, rating: 4.8 },
    { date: "Feb 7", views: 39, members: 6, engagement: 9, rating: 4.7 },
    { date: "Feb 8", views: 44, members: 8, engagement: 10, rating: 4.8 },
    { date: "Feb 9", views: 52, members: 10, engagement: 14, rating: 4.8 },
    { date: "Feb 10", views: 47, members: 9, engagement: 13, rating: 4.8 },
  ],

  conversion_funnel: [
    { stage: "Profile Views", count: 1247, percentage: 100, drop: 0 },
    { stage: "Saved", count: 312, percentage: 25.0, drop: 75.0 },
    { stage: "Inquiries", count: 98, percentage: 7.9, drop: 17.1 },
    { stage: "Membership Intents", count: 44, percentage: 3.5, drop: 4.4 },
    { stage: "Sign-ups", count: 156, percentage: 12.5, drop: 0 },
  ],

  engagement_details: {
    by_action: [
      { name: "Saves", value: 312, members: 312, avg: 10.4, growth: 6.1 },
      { name: "Inquiries", value: 98, members: 98, avg: 3.3, growth: 12.8 },
      { name: "Verified Reviews", value: 0, members: 0, avg: 1.3, growth: 9.7 },
      { name: "Free Visits Used", value: 21, members: 21, avg: 0.7, growth: -4.2 },
    ],
  },

  reviews_analytics: {
    total: 0,
    average_verified: null,
    verified_total: 0,
    unverified_total: 0,
    distribution_verified: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    distribution_all: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recent_trend: 0,
    top_keywords: [],
  },

  rating_keywords_table: [],

  inquiry_keywords_table: [
    { name: "membership", visits: 29, conversions: 18, ctr: 62.1, cost: 0 },
    { name: "schedule", visits: 22, conversions: 14, ctr: 63.6, cost: 0 },
    { name: "rates", visits: 20, conversions: 12, ctr: 60.0, cost: 0 },
    { name: "promos", visits: 15, conversions: 9, ctr: 60.0, cost: 0 },
    { name: "amenities", visits: 12, conversions: 7, ctr: 58.3, cost: 0 },
  ],

  demographics: {
    age: [
      { range: "18-24", count: 34, percentage: 22 },
      { range: "25-34", count: 59, percentage: 38 },
      { range: "35-44", count: 37, percentage: 24 },
      { range: "45-54", count: 19, percentage: 12 },
      { range: "55+", count: 7, percentage: 4 },
    ],
    gender: { male: 91, female: 62, other: 3 },
  },

  competitor_comparison: {
    your_gym: { rating: 0, members: 156, price: 2500 },
    area_average: { rating: 4.3, members: 98, price: 2800 },
    top_competitor: { rating: 4.6, members: 203, price: 2400 },
  },

  executive_summary: [
    {
      type: "success",
      icon: "rating",
      title: "Rating Health",
      message: "No verified reviews yet. Unverified reviews are visible but don’t affect the score.",
      action: "View reviews",
    },
    {
      type: "info",
      icon: "visibility",
      title: "Visibility Up",
      message: "Profile views increased by 12.5% this period. Saves are also trending upward.",
      action: "See timeline",
    },
    {
      type: "success",
      icon: "growth",
      title: "Member Growth",
      message: "Active members grew by 8.3%. Push renewals to keep momentum.",
      action: "View members",
    },
    {
      type: "warning",
      icon: "engagement",
      title: "Engagement Opportunity",
      message: "Inquiries are rising. Add clearer pricing/schedule details to reduce repeated questions.",
      action: "See inquiries",
    },
  ],

  goals: [
    { name: "Monthly Sign-ups", current: 12, target: 15, percentage: 80 },
    { name: "Rating Target", current: 4.8, target: 4.9, percentage: 98 },
    { name: "Engagement Goal", current: 410, target: 450, percentage: 91 },
    { name: "Visibility Goal", current: 1247, target: 1500, percentage: 83 },
  ],
};

export default function ViewStats() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("views");
  const [showInsights, setShowInsights] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const gymId = Number(id || MOCK_STATS.gym_id);
        const base = { ...MOCK_STATS, gym_id: gymId };

        const { summary, ratings } = await fetchAllGymRatings(gymId);

        const verifiedAvg = typeof summary?.public_avg_stars === "number" ? summary.public_avg_stars : null;
        const verifiedCount = Number(summary?.verified_count || 0);
        const unverifiedCount = Number(summary?.unverified_count || 0);
        const totalCount = Number(summary?.total_count || ratings.length);

        const distVerified = buildStarDistribution(ratings, { verifiedOnly: true });
        const distAll = buildStarDistribution(ratings, { verifiedOnly: false });

        const keywordTable = buildKeywordTable(ratings, { topN: 8 });

        const next = {
          ...base,
          hero_metrics: {
            ...base.hero_metrics,
            rating: {
              ...base.hero_metrics.rating,
              current: verifiedAvg ?? 0,
              previous: base.hero_metrics.rating.previous ?? 0,
              change: base.hero_metrics.rating.change ?? 0,
            },
          },
          competitor_comparison: {
            ...base.competitor_comparison,
            your_gym: {
              ...base.competitor_comparison.your_gym,
              rating: verifiedAvg ?? 0,
            },
          },
          reviews_analytics: {
            ...base.reviews_analytics,
            total: totalCount,
            verified_total: verifiedCount,
            unverified_total: unverifiedCount,
            average_verified: verifiedAvg,
            distribution_verified: distVerified,
            distribution_all: distAll,
          },
          rating_keywords_table: keywordTable,
          engagement_details: {
            ...base.engagement_details,
            by_action: Array.isArray(base.engagement_details?.by_action)
              ? base.engagement_details.by_action.map((row) => {
                  if (String(row?.name || "").toLowerCase().includes("verified reviews")) {
                    return { ...row, value: verifiedCount, members: verifiedCount };
                  }
                  return row;
                })
              : [],
          },
          executive_summary: Array.isArray(base.executive_summary)
            ? base.executive_summary.map((c) => {
                if (c.icon !== "rating") return c;
                return {
                  ...c,
                  message:
                    verifiedAvg !== null
                      ? `Public score is ${verifiedAvg} from ${verifiedCount} verified reviews. Unverified reviews are visible but don’t affect the score.`
                      : `No verified reviews yet. Unverified reviews are visible but don’t affect the score.`,
                };
              })
            : base.executive_summary,
        };

        if (alive) setStats(next);
      } catch (e) {
        console.error(e);
        if (alive) setStats(MOCK_STATS);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="ultimate-stats">
        <Header />
        <div className="ultimate-loading">
          <div className="ultimate-spinner"></div>
          <p className="loading-text">Crunching the numbers...</p>
          <span className="loading-subtext">Analyzing your gym's performance</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="ultimate-stats">
        <Header />
        <div className="ultimate-error">
          <AlertCircle size={48} />
          <p>Unable to load analytics</p>
        </div>
        <Footer />
      </div>
    );
  }

  const executiveSummary = Array.isArray(stats?.executive_summary) ? stats.executive_summary : [];
  const goals = Array.isArray(stats?.goals) ? stats.goals : [];
  const timeline = Array.isArray(stats?.timeline_data) ? stats.timeline_data : [];
  const funnel = Array.isArray(stats?.conversion_funnel) ? stats.conversion_funnel : [];
  const engagementByAction = Array.isArray(stats?.engagement_details?.by_action) ? stats.engagement_details.by_action : [];
  const ratingKeywords = Array.isArray(stats?.rating_keywords_table) ? stats.rating_keywords_table : [];
  const inquiryKeywords = Array.isArray(stats?.inquiry_keywords_table) ? stats.inquiry_keywords_table : [];
  const ageGroups = Array.isArray(stats?.demographics?.age) ? stats.demographics.age : [];

  const getStatusColor = (status) => {
    const colors = { excellent: "#10b981", good: "#3b82f6", warning: "#f59e0b", danger: "#ef4444" };
    return colors[status] || "#666";
  };

  return (
    <div className="ultimate-stats">
      <Header />

      <div className="ultimate-container">
        <div className="ultimate-header">
          <div className="header-left">
            <button className="ultimate-back" onClick={() => navigate(-1)}>
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="ultimate-title">{stats.gym_name}</h1>
              <div className="header-meta">
                <span className="live-indicator">
                  <span className="pulse-dot"></span>
                  Live Data
                </span>
                <span className="update-time">Updated {stats.last_updated}</span>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <div className="time-range-selector">
              <button className={timeRange === "7d" ? "active" : ""} onClick={() => setTimeRange("7d")}>
                7D
              </button>
              <button className={timeRange === "30d" ? "active" : ""} onClick={() => setTimeRange("30d")}>
                30D
              </button>
              <button className={timeRange === "90d" ? "active" : ""} onClick={() => setTimeRange("90d")}>
                90D
              </button>
              <button className={timeRange === "1y" ? "active" : ""} onClick={() => setTimeRange("1y")}>
                1Y
              </button>
            </div>
            <button className="action-btn secondary">
              <Download size={18} />
              Export
            </button>
            <button className="action-btn primary">
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>

        {showInsights && (
          <div className="insights-banner">
            <div className="insights-header">
              <div className="insights-title">
                <Sparkles size={20} />
                <h3>Executive Summary</h3>
                <span className="insights-badge">{executiveSummary.length} New</span>
              </div>
              <button className="close-insights" onClick={() => setShowInsights(false)}>
                <XCircle size={18} />
              </button>
            </div>

            <div className="insights-grid">
              {executiveSummary.map((item, i) => (
                <div key={i} className={`insight-card ${item.type}`}>
                  <div className="insight-icon">
                    {item.icon === "rating" && <Star size={20} />}
                    {item.icon === "visibility" && <Eye size={20} />}
                    {item.icon === "growth" && <Users size={20} />}
                    {item.icon === "engagement" && <MessageSquare size={20} />}
                  </div>
                  <div className="insight-content">
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                    <button className="insight-action">
                      {item.action} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="performance-score-section">
          <div className="score-card main-score">
            <div className="score-header">
              <h3>Overall Performance</h3>
              <Info size={16} />
            </div>
            <div className="score-display">
              <div className="score-circle">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#f0f0f0" strokeWidth="8"></circle>
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeDasharray={`${stats.performance_score.overall * 3.39} 339`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  ></circle>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="score-value">{stats.performance_score.overall}</div>
              </div>
              <div className="score-label">
                <span>Excellent</span>
                <p>Top 10% in Pasig</p>
              </div>
            </div>
          </div>

          <div className="score-breakdown">
            {Object.entries(stats.performance_score)
              .filter(([key]) => key !== "overall")
              .map(([key, value]) => (
                <div key={key} className="score-item">
                  <div className="score-item-header">
                    <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <strong>{value}</strong>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${value}%` }}></div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="ultimate-hero-grid">
          {Object.entries(stats.hero_metrics).map(([key, data]) => (
            <div key={key} className={`ultimate-hero-card ${data.status}`}>
              <div className="hero-card-header">
                <div className="hero-icon" style={{ background: getStatusColor(data.status) }}>
                  {key === "views" && <Eye size={24} />}
                  {key === "members" && <Users size={24} />}
                  {key === "engagement" && <Activity size={24} />}
                  {key === "rating" && <Star size={24} />}
                </div>
                <div className={`hero-change ${data.trend}`}>
                  {data.trend === "up" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(data.change)}%
                </div>
              </div>

              <div className="hero-content">
                <span className="hero-label">
                  {key === "views" && "Profile Views"}
                  {key === "members" && "Active Members"}
                  {key === "engagement" && "Engagement"}
                  {key === "rating" && "Avg Rating"}
                </span>

                <h2 className="hero-value">
                  {key === "rating" ? `${Number(data.current || 0).toFixed(1)}` : Number(data.current || 0).toLocaleString()}
                  {key === "rating" && "/5.0"}
                </h2>

                <div className="hero-prediction">
                  <span className="prediction-label">Predicted next month:</span>
                  <strong>
                    {key === "rating"
                      ? `${Number(data.prediction || 0).toFixed(1)}/5.0`
                      : Number(data.prediction || 0).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="hero-sparkline">
                <div className="sparkline-placeholder"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="goals-section">
          <div className="section-header">
            <h3>
              <Target size={20} /> Monthly Goals
            </h3>
            <button className="view-all-btn">
              View all <ChevronRight size={16} />
            </button>
          </div>
          <div className="goals-grid">
            {goals.map((goal, i) => (
              <div key={i} className="goal-card">
                <div className="goal-header">
                  <span className="goal-name">{goal.name}</span>
                  <span className={`goal-status ${goal.percentage >= 100 ? "complete" : goal.percentage >= 75 ? "ontrack" : "behind"}`}>
                    {goal.percentage >= 100 ? <CheckCircle size={16} /> : <Activity size={16} />}
                    {goal.percentage}%
                  </span>
                </div>

                <div className="goal-progress">
                  <div className="goal-values">
                    <strong>{goal.current}</strong>
                    <span>/ {goal.target}</span>
                  </div>
                  <div className="goal-bar">
                    <div
                      className="goal-fill"
                      style={{
                        width: `${Math.min(goal.percentage, 100)}%`,
                        background: goal.percentage >= 100 ? "#10b981" : goal.percentage >= 75 ? "#3b82f6" : "#f59e0b",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-main-grid">
          <div className="analytics-card timeline-card">
            <div className="card-header">
              <div>
                <h3>Performance Timeline</h3>
                <p>Track your key metrics over time</p>
              </div>
              <div className="metric-selector">
                <button className={selectedMetric === "views" ? "active" : ""} onClick={() => setSelectedMetric("views")}>
                  Views
                </button>
                <button className={selectedMetric === "members" ? "active" : ""} onClick={() => setSelectedMetric("members")}>
                  Members
                </button>
                <button className={selectedMetric === "engagement" ? "active" : ""} onClick={() => setSelectedMetric("engagement")}>
                  Engagement
                </button>
              </div>
            </div>

            <div className="timeline-chart">
              {timeline.map((day, i) => {
                const value = day?.[selectedMetric] ?? 0;
                const maxValue = Math.max(...timeline.map((d) => Number(d?.[selectedMetric] ?? 0)), 1);
                const height = (Number(value) / maxValue) * 100;
                return (
                  <div key={i} className="timeline-bar-wrapper">
                    <div className="timeline-bar" style={{ height: `${height}%` }} data-value={value}>
                      <span className="bar-tooltip">{value}</span>
                    </div>
                    <span className="timeline-label">{String(day?.date || "").split(" ")[1] || day?.date || "-"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="analytics-card funnel-card">
            <div className="card-header">
              <div>
                <h3>Conversion Funnel</h3>
                <p>User journey from view to sign-up</p>
              </div>
            </div>
            <div className="conversion-funnel">
              {funnel.map((stage, i) => (
                <div key={i} className="funnel-stage">
                  <div className="funnel-stage-header">
                    <span className="stage-name">{stage.stage}</span>
                    <div className="stage-stats">
                      <strong>{stage.count}</strong>
                      <span className="stage-percentage">{stage.percentage}%</span>
                    </div>
                  </div>
                  <div className="funnel-bar">
                    <div className="funnel-fill" style={{ width: `${stage.percentage}%` }}></div>
                  </div>
                  {i < funnel.length - 1 && (
                    <div className="funnel-drop">
                      <TrendDown size={14} />
                      {stage.drop}% drop
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-card revenue-card">
            <div className="card-header">
              <div>
                <h3>Engagement Analysis</h3>
                <p>Breakdown by user actions</p>
              </div>
            </div>
            <div className="revenue-breakdown-list">
              {engagementByAction.map((row, i) => (
                <div key={i} className="revenue-plan">
                  <div className="plan-header">
                    <div className="plan-info">
                      <strong>{row.name}</strong>
                      <span>{row.members} records</span>
                    </div>
                    <div className="plan-revenue">
                      <strong>{Number(row.value || 0).toLocaleString()}</strong>
                      <span className={`plan-growth ${row.growth > 0 ? "up" : "down"}`}>
                        {row.growth > 0 ? "+" : ""}
                        {row.growth}%
                      </span>
                    </div>
                  </div>
                  <div className="plan-meta">
                    <span>Avg/day: {row.avg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-card traffic-card">
            <div className="card-header">
              <div>
                <h3>Rating Keywords</h3>
                <p>Most mentioned words from reviews</p>
              </div>
            </div>
            <div className="traffic-table">
              <div className="table-header">
                <span>Keyword</span>
                <span>Mentions</span>
                <span>Verified</span>
                <span>Share</span>
              </div>
              {ratingKeywords.map((k, i) => (
                <div key={i} className="table-row">
                  <div className="source-cell">
                    <div className="source-rank">{i + 1}</div>
                    <span>{k.name}</span>
                  </div>
                  <span className="visits-cell">{k.visits}</span>
                  <span className="conv-cell">{k.conversions}</span>
                  <span className="ctr-cell">
                    <span className={`ctr-badge ${k.ctr > 60 ? "good" : "normal"}`}>{k.ctr}%</span>
                  </span>
                </div>
              ))}
              {!ratingKeywords.length && (
                <div className="table-row" style={{ opacity: 0.7 }}>
                  <div className="source-cell">
                    <div className="source-rank">—</div>
                    <span>No review keywords yet</span>
                  </div>
                  <span className="visits-cell">—</span>
                  <span className="conv-cell">—</span>
                  <span className="ctr-cell">
                    <span className="ctr-badge normal">—</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="analytics-card heatmap-card">
            <div className="card-header">
              <div>
                <h3>Inquiry Keywords</h3>
                <p>Common topics asked by users</p>
              </div>
            </div>

            <div className="traffic-table">
              <div className="table-header">
                <span>Keyword</span>
                <span>Mentions</span>
                <span>Resolved</span>
                <span>Share</span>
              </div>
              {inquiryKeywords.map((k, i) => (
                <div key={i} className="table-row">
                  <div className="source-cell">
                    <div className="source-rank">{i + 1}</div>
                    <span>{k.name}</span>
                  </div>
                  <span className="visits-cell">{k.visits}</span>
                  <span className="conv-cell">{k.conversions}</span>
                  <span className="ctr-cell">
                    <span className={`ctr-badge ${k.ctr > 60 ? "good" : "normal"}`}>{k.ctr}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-card demographics-card">
            <div className="card-header">
              <div>
                <h3>Member Demographics</h3>
                <p>Age, gender, and location</p>
              </div>
            </div>
            <div className="demographics-layout">
              <div className="demo-chart age-chart">
                <h4>Age Distribution</h4>
                <div className="age-bars">
                  {ageGroups.map((group, i) => (
                    <div key={i} className="age-bar">
                      <div className="age-fill" style={{ height: `${group.percentage * 2.5}%` }}>
                        <span className="age-value">{group.percentage}%</span>
                      </div>
                      <span className="age-label">{group.range}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="demo-split">
                <div className="gender-chart">
                  <h4>Gender Split</h4>
                  <div className="gender-bars">
                    <div className="gender-item male">
                      <strong>{stats.demographics?.gender?.male ?? 0}</strong>
                      <span>Male</span>
                    </div>
                    <div className="gender-item female">
                      <strong>{stats.demographics?.gender?.female ?? 0}</strong>
                      <span>Female</span>
                    </div>
                    <div className="gender-item other">
                      <strong>{stats.demographics?.gender?.other ?? 0}</strong>
                      <span>Other</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="competitor-section">
          <div className="section-header">
            <h3>
              <Award size={20} /> Market Position
            </h3>
            <span className="section-subtitle">Compare with competitors</span>
          </div>
          <div className="competitor-grid">
            <div className="competitor-card you">
              <div className="competitor-label">Your Gym</div>
              <div className="competitor-stats">
                <div className="comp-stat">
                  <Star size={16} />
                  <strong>{Number(stats.competitor_comparison.your_gym.rating || 0).toFixed(1)}</strong>
                  <span>Rating</span>
                </div>
                <div className="comp-stat">
                  <Users size={16} />
                  <strong>{stats.competitor_comparison.your_gym.members}</strong>
                  <span>Members</span>
                </div>
                <div className="comp-stat">
                  <DollarSign size={16} />
                  <strong>₱{stats.competitor_comparison.your_gym.price}</strong>
                  <span>Monthly</span>
                </div>
              </div>
            </div>

            <div className="competitor-card average">
              <div className="competitor-label">Area Average</div>
              <div className="competitor-stats">
                <div className="comp-stat">
                  <Star size={16} />
                  <strong>{stats.competitor_comparison.area_average.rating}</strong>
                  <span className="better">↑ +0.5</span>
                </div>
                <div className="comp-stat">
                  <Users size={16} />
                  <strong>{stats.competitor_comparison.area_average.members}</strong>
                  <span className="better">↑ +58</span>
                </div>
                <div className="comp-stat">
                  <DollarSign size={16} />
                  <strong>₱{stats.competitor_comparison.area_average.price}</strong>
                  <span className="worse">↓ -₱300</span>
                </div>
              </div>
            </div>

            <div className="competitor-card top">
              <div className="competitor-label">Top Competitor</div>
              <div className="competitor-stats">
                <div className="comp-stat">
                  <Star size={16} />
                  <strong>{stats.competitor_comparison.top_competitor.rating}</strong>
                  <span className="better">↑ +0.2</span>
                </div>
                <div className="comp-stat">
                  <Users size={16} />
                  <strong>{stats.competitor_comparison.top_competitor.members}</strong>
                  <span className="worse">↓ -47</span>
                </div>
                <div className="comp-stat">
                  <DollarSign size={16} />
                  <strong>₱{stats.competitor_comparison.top_competitor.price}</strong>
                  <span className="better">↑ +₱100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}