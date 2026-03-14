import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  MapPin,
  Settings,
  Inbox,
  BarChart3,
} from "lucide-react";
import jsPDF from "jspdf";

import { loadViewStats } from "../../utils/viewStatsApi";

const MOCK_STATS = {
  gym_name: "IronForge Fitness",
  gym_id: 1,
  last_updated: "just now",
  hero_metrics: {
    views: { current: 0, previous: 0, change: 0, trend: "up", prediction: 0, status: "excellent" },
    members: { current: 0, previous: 0, change: 0, trend: "up", prediction: 0, status: "good" },
    engagement: { current: 0, previous: 0, change: 0, trend: "up", prediction: 0, status: "good" },
    rating: { current: 0, previous: 0, change: 0, trend: "up", prediction: 0, status: "excellent" },
  },
  performance_score: { overall: 0, visibility: 0, engagement: 0, satisfaction: 0, growth: 0 },
  timeline_data: [],
  conversion_funnel: [
    { stage: "Profile Views", count: 0, percentage: 100, drop: 0 },
    { stage: "Saved", count: 0, percentage: 0, drop: 0 },
    { stage: "Inquiries", count: 0, percentage: 0, drop: 0 },
    { stage: "Membership Intents", count: 0, percentage: 0, drop: 0 },
    { stage: "Active Members", count: 0, percentage: 0, drop: 0 },
  ],
  engagement_details: {
    by_action: [
      { name: "Saves", value: 0, members: 0, avg: 0, growth: 0 },
      { name: "Inquiries", value: 0, members: 0, avg: 0, growth: 0 },
      { name: "Verified Reviews", value: 0, members: 0, avg: 0, growth: 0 },
      { name: "Free Visits Used", value: 0, members: 0, avg: 0, growth: 0 },
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
  inquiry_keywords_table: [],
  demographics: {
    age: [
      { range: "18-24", count: 0, percentage: 0 },
      { range: "25-34", count: 0, percentage: 0 },
      { range: "35-44", count: 0, percentage: 0 },
      { range: "45-54", count: 0, percentage: 0 },
      { range: "55+", count: 0, percentage: 0 },
    ],
    gender: { male: 0, female: 0, other: 0 },
  },
  competitor_comparison: null,
  executive_summary: [
    {
      type: "info",
      icon: "visibility",
      title: "Loading Live Metrics",
      message: "We’re pulling your gym’s latest analytics.",
      action: "Refresh",
    },
  ],
  goals: [
    { name: "Monthly Sign-ups", current: 0, target: 15, percentage: 0 },
    { name: "Rating Target", current: 0, target: 4.9, percentage: 0 },
    { name: "Engagement Goal", current: 0, target: 450, percentage: 0 },
    { name: "Visibility Goal", current: 0, target: 1500, percentage: 0 },
  ],
};

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtTimelineLabel(x) {
  const s = String(x || "");
  if (!s) return "-";
  if (s.includes("–")) return s;
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(5, 10);
  return s.length > 12 ? s.slice(0, 12) : s;
}

function rangeLabel(range) {
  const map = {
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
    "1y": "Last 1 Year",
  };
  return map[range] || String(range || "").toUpperCase();
}

export default function ViewStats() {
  const { id } = useParams();
  const navigate = useNavigate();

  const timelineRef = useRef(null);
  const marketRef = useRef(null);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("views");
  const [showInsights, setShowInsights] = useState(true);
  const [showPerfInfo, setShowPerfInfo] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setShowPerfInfo(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const gymId = Number(id || MOCK_STATS.gym_id);
        const next = await loadViewStats(gymId, { baseStats: MOCK_STATS, range: timeRange });
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
  }, [id, timeRange]);

  const getStatusColor = (status) => {
    const colors = { excellent: "#10b981", good: "#3b82f6", warning: "#f59e0b", danger: "#ef4444" };
    return colors[status] || "#666";
  };

  const gymId = Number(id || stats?.gym_id || MOCK_STATS.gym_id || 0);

  const executiveSummary = Array.isArray(stats?.executive_summary) ? stats.executive_summary : [];
  const goals = Array.isArray(stats?.goals) ? stats.goals : [];
  const timeline = Array.isArray(stats?.timeline_data) ? stats.timeline_data : [];
  const funnel = Array.isArray(stats?.conversion_funnel) ? stats.conversion_funnel : [];
  const engagementByAction = Array.isArray(stats?.engagement_details?.by_action)
    ? stats.engagement_details.by_action
    : [];
  const ratingKeywords = Array.isArray(stats?.rating_keywords_table) ? stats.rating_keywords_table : [];
  const inquiryKeywords = Array.isArray(stats?.inquiry_keywords_table) ? stats.inquiry_keywords_table : [];
  const ageGroups = Array.isArray(stats?.demographics?.age) ? stats.demographics.age : [];

  const metricMax = useMemo(() => {
    if (!timeline.length) return 1;
    const arr = timeline
      .map((d) => safeNum(d?.[selectedMetric]))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);

    if (!arr.length) return 1;

    const idx = Math.floor(arr.length * 0.95);
    const p95 = arr[idx] ?? arr[arr.length - 1] ?? 1;
    return Math.max(p95, 1);
  }, [timeline, selectedMetric]);

  const trendBadge = useMemo(() => {
    const m = stats?.hero_metrics?.[selectedMetric];
    const ch = safeNum(m?.change);
    const up = ch >= 0;
    return {
      label: up ? `+${Math.abs(ch)}%` : `-${Math.abs(ch)}%`,
      icon: up ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
      cls: up ? "up" : "down",
    };
  }, [stats, selectedMetric]);

  const handleInsightAction = (item) => {
    const action = String(item?.action || "").toLowerCase();

    if (action.includes("refresh")) {
      setTimeRange((r) => String(r));
      return;
    }

    if (action.includes("timeline")) {
      timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (action.includes("inbox")) {
      navigate("/owner/inbox");
      return;
    }

    if (action.includes("competitor") || action.includes("market")) {
      marketRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (action.includes("fix") || action.includes("location")) {
      navigate(`/owner/edit-gym/${gymId}`);
      return;
    }

    navigate(`/owner/view-gym/${gymId}`);
  };

  const handleDownloadPresentationPdf = async () => {
    if (downloadingPdf) return;

    try {
      setDownloadingPdf(true);

      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = 210;
      const pageH = 297;
      const margin = 14;
      const contentW = pageW - margin * 2;

      const safeGymName = String(stats?.gym_name || "gym-stats")
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();

      const colors = {
        text: [16, 24, 32],
        muted: [90, 90, 90],
        light: [120, 120, 120],
        orange: [252, 74, 0],
        orangeDark: [171, 50, 0],
        line: [235, 240, 245],
        softFill: [248, 250, 252],
        white: [255, 255, 255],
      };

      const setText = (rgb = colors.text) => pdf.setTextColor(...rgb);

      const drawTitle = (title, subtitle) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(22);
        setText(colors.text);
        pdf.text(String(title || "Gym Analytics"), margin, 22);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        setText(colors.muted);
        pdf.text(String(subtitle || ""), margin, 29);

        pdf.setDrawColor(...colors.line);
        pdf.line(margin, 34, pageW - margin, 34);
      };

      const drawSectionTitle = (title, y) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        setText(colors.orangeDark);
        pdf.text(title, margin, y);
        return y + 6;
      };

      const drawCard = (x, y, w, h, title, value, sub = "", fill = colors.white) => {
        pdf.setFillColor(...fill);
        pdf.setDrawColor(...colors.line);
        pdf.roundedRect(x, y, w, h, 4, 4, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        setText(colors.muted);
        pdf.text(String(title), x + 4, y + 8);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        setText(colors.text);
        pdf.text(String(value), x + 4, y + 18);

        if (sub) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          setText(colors.light);
          pdf.text(String(sub), x + 4, y + 25);
        }
      };

      const drawWrappedText = (
        text,
        x,
        y,
        maxWidth,
        lineHeight = 5,
        color = colors.muted,
        fontSize = 10,
        weight = "normal"
      ) => {
        pdf.setFont("helvetica", weight);
        pdf.setFontSize(fontSize);
        setText(color);
        const lines = pdf.splitTextToSize(String(text || ""), maxWidth);
        pdf.text(lines, x, y);
        return y + lines.length * lineHeight;
      };

      const hasMeaningfulTimeline =
        Array.isArray(timeline) && timeline.some((d) => safeNum(d?.[selectedMetric]) > 0);

      const hasMeaningfulFunnel =
        Array.isArray(funnel) && funnel.some((s) => safeNum(s?.count) > 0);

      const hasMeaningfulEngagement =
        Array.isArray(engagementByAction) && engagementByAction.some((r) => safeNum(r?.value) > 0);

      const hasMeaningfulDemographics =
        (Array.isArray(ageGroups) && ageGroups.some((g) => safeNum(g?.percentage) > 0)) ||
        safeNum(stats?.demographics?.gender?.male) > 0 ||
        safeNum(stats?.demographics?.gender?.female) > 0 ||
        safeNum(stats?.demographics?.gender?.other) > 0;

      const perf = stats?.performance_score || {};
      const hero = stats?.hero_metrics || {};
      const rangeText = rangeLabel(timeRange);

      drawTitle(
        stats?.gym_name || "Gym Analytics",
        `${rangeText} • Updated ${stats?.last_updated || "recently"}`
      );

      let y = 45;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      setText(colors.orange);
      pdf.text("Executive Summary", margin, y);
      y += 8;

      const summaryItems = executiveSummary.length
        ? executiveSummary.slice(0, 4)
        : [{ title: "No summary yet", message: "Insights will appear here once more analytics data becomes available." }];

      summaryItems.forEach((item) => {
        const itemMessageLines = pdf.splitTextToSize(String(item?.message || ""), contentW - 8);
        const boxH = Math.max(18, 10 + itemMessageLines.length * 4.5);

        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(...colors.line);
        pdf.roundedRect(margin, y, contentW, boxH, 4, 4, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        setText(colors.text);
        pdf.text(String(item?.title || "Insight"), margin + 4, y + 7);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        setText(colors.muted);
        pdf.text(itemMessageLines, margin + 4, y + 13);

        y += boxH + 4;
      });

      y += 2;
      y = drawSectionTitle("Overall Performance", y);

      drawCard(margin, y, 42, 28, "Overall Score", `${perf?.overall ?? 0}`, "Out of 100", [255, 247, 242]);
      drawCard(margin + 46, y, 34, 28, "Visibility", `${perf?.visibility ?? 0}`);
      drawCard(margin + 84, y, 34, 28, "Engagement", `${perf?.engagement ?? 0}`);
      drawCard(margin + 122, y, 34, 28, "Satisfaction", `${perf?.satisfaction ?? 0}`);
      drawCard(margin + 160, y, 36, 28, "Growth", `${perf?.growth ?? 0}`);
      y += 38;

      y = drawSectionTitle("Key Metrics", y);

      const heroEntries = Object.entries(hero);
      const heroCardW = (contentW - 8) / 2;
      const heroCardH = 26;

      heroEntries.slice(0, 4).forEach(([key, data], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = margin + col * (heroCardW + 8);
        const yy = y + row * (heroCardH + 8);

        const label =
          key === "views" ? "Profile Views" :
          key === "members" ? "Active Members" :
          key === "engagement" ? "Engagement" :
          key === "rating" ? "Average Rating" :
          key;

        const value =
          key === "rating"
            ? `${Number(data?.current || 0).toFixed(1)}/5.0`
            : Number(data?.current || 0).toLocaleString();

        const sub = `Change: ${Number(data?.change || 0) > 0 ? "+" : ""}${Number(data?.change || 0)}%`;

        drawCard(x, yy, heroCardW, heroCardH, label, value, sub);
      });

      pdf.addPage();
      drawTitle(stats?.gym_name || "Gym Analytics", `${rangeText} • Performance Details`);

      y = 45;
      y = drawSectionTitle("Performance Timeline", y);

      if (hasMeaningfulTimeline) {
        const chartX = margin;
        const chartY = y + 2;
        const chartW = contentW;
        const chartH = 70;

        pdf.setDrawColor(...colors.line);
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(chartX, chartY, chartW, chartH, 4, 4, "FD");

        const visibleTimeline = timeline.slice(0, 12);
        const values = visibleTimeline.map((d) => safeNum(d?.[selectedMetric]));
        const maxVal = Math.max(...values, 1);
        const barGap = 4;
        const innerX = chartX + 8;
        const innerY = chartY + 8;
        const innerW = chartW - 16;
        const innerH = chartH - 18;
        const barW = (innerW - (visibleTimeline.length - 1) * barGap) / Math.max(visibleTimeline.length, 1);

        visibleTimeline.forEach((day, i) => {
          const v = safeNum(day?.[selectedMetric]);
          const h = maxVal > 0 ? Math.max((v / maxVal) * innerH, v > 0 ? 3 : 1) : 1;
          const bx = innerX + i * (barW + barGap);
          const by = innerY + innerH - h;

          pdf.setFillColor(...colors.orange);
          pdf.roundedRect(bx, by, barW, h, 1.5, 1.5, "F");

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7);
          setText(colors.light);
          pdf.text(fmtTimelineLabel(day?.date), bx, chartY + chartH - 3, { maxWidth: barW + 6 });
        });

        y = chartY + chartH + 12;
      } else {
        y = drawWrappedText("No significant timeline activity recorded for this selected range.", margin, y + 4, contentW);
        y += 8;
      }

      y = drawSectionTitle("Conversion Funnel", y);

      if (hasMeaningfulFunnel) {
        funnel.forEach((stage) => {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          setText(colors.text);
          pdf.text(`${stage?.stage || "Stage"}`, margin, y);

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          setText(colors.muted);
          pdf.text(`${stage?.count ?? 0} • ${stage?.percentage ?? 0}%`, pageW - margin, y, { align: "right" });

          const trackY = y + 3;
          pdf.setFillColor(...colors.line);
          pdf.roundedRect(margin, trackY, contentW, 5, 2, 2, "F");

          pdf.setFillColor(...colors.orangeDark);
          pdf.roundedRect(margin, trackY, Math.max((contentW * safeNum(stage?.percentage)) / 100, 1), 5, 2, 2, "F");

          y += 12;
        });
      } else {
        y = drawWrappedText("No meaningful conversion funnel data is available yet for this selected range.", margin, y + 4, contentW);
        y += 8;
      }

      y += 2;
      y = drawSectionTitle("Engagement Analysis", y);

      if (hasMeaningfulEngagement) {
        const tableX = margin;
        const tableY = y + 2;
        const rowH = 10;
        const col1 = 70;
        const col2 = 36;
        const col3 = 36;
        const col4 = contentW - col1 - col2 - col3;

        pdf.setFillColor(255, 247, 242);
        pdf.setDrawColor(...colors.line);
        pdf.rect(tableX, tableY, contentW, rowH, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        setText(colors.text);
        pdf.text("Action", tableX + 3, tableY + 6.5);
        pdf.text("Total", tableX + col1 + 3, tableY + 6.5);
        pdf.text("Records", tableX + col1 + col2 + 3, tableY + 6.5);
        pdf.text("Growth", tableX + col1 + col2 + col3 + 3, tableY + 6.5);

        let rowY = tableY + rowH;

        engagementByAction.slice(0, 6).forEach((row) => {
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(...colors.line);
          pdf.rect(tableX, rowY, contentW, rowH, "FD");

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          setText(colors.text);
          pdf.text(String(row?.name || ""), tableX + 3, rowY + 6.5);
          pdf.text(String(Number(row?.value || 0).toLocaleString()), tableX + col1 + 3, rowY + 6.5);
          pdf.text(String(row?.members ?? 0), tableX + col1 + col2 + 3, rowY + 6.5);
          pdf.text(`${row?.growth ?? 0}%`, tableX + col1 + col2 + col3 + 3, rowY + 6.5);

          rowY += rowH;
        });
      } else {
        drawWrappedText("No meaningful engagement data is available yet for this selected range.", margin, y + 4, contentW);
      }

      pdf.addPage();
      drawTitle(stats?.gym_name || "Gym Analytics", `${rangeText} • Audience and Market`);

      y = 45;
      y = drawSectionTitle("Member Demographics", y);

      if (hasMeaningfulDemographics) {
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(...colors.line);
        pdf.roundedRect(margin, y, contentW / 2 - 4, 58, 4, 4, "FD");
        pdf.roundedRect(margin + contentW / 2 + 4, y, contentW / 2 - 4, 58, 4, 4, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        setText(colors.text);
        pdf.text("Age Distribution", margin + 4, y + 8);
        pdf.text("Gender Split", margin + contentW / 2 + 8, y + 8);

        let ageY = y + 16;
        ageGroups.slice(0, 6).forEach((group) => {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          setText(colors.text);
          pdf.text(`${group?.range || "-"}`, margin + 4, ageY);
          pdf.text(`${safeNum(group?.percentage)}%`, margin + contentW / 2 - 12, ageY, { align: "right" });
          ageY += 8;
        });

        let genderY = y + 16;
        const genders = [
          ["Male", stats?.demographics?.gender?.male ?? 0],
          ["Female", stats?.demographics?.gender?.female ?? 0],
          ["Other", stats?.demographics?.gender?.other ?? 0],
        ];

        genders.forEach(([label, value]) => {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          setText(colors.text);
          pdf.text(label, margin + contentW / 2 + 8, genderY);
          pdf.text(String(value), pageW - margin - 6, genderY, { align: "right" });
          genderY += 10;
        });

        y += 68;
      } else {
        y = drawWrappedText("No meaningful demographic data is available yet for this selected range.", margin, y + 4, contentW);
        y += 10;
      }

      y = drawSectionTitle("Market Position", y);

      if (!stats?.competitor_comparison) {
        y = drawWrappedText(
          "Market position comparison is not available yet. Once competitor analytics are available, this section will include your gym, area average, and top competitor comparison.",
          margin,
          y + 4,
          contentW
        );
        y += 14;
      } else {
        const cmp = stats.competitor_comparison;
        const cardW = (contentW - 8) / 3;

        drawCard(
          margin,
          y,
          cardW,
          36,
          "Your Gym",
          `${Number(cmp?.your_gym?.rating || 0).toFixed(1)} ★`,
          `Members: ${cmp?.your_gym?.members ?? 0}`
        );
        drawCard(
          margin + cardW + 4,
          y,
          cardW,
          36,
          "Area Average",
          `${Number(cmp?.area_average?.rating || 0).toFixed(1)} ★`,
          `Members: ${cmp?.area_average?.members ?? 0}`
        );
        drawCard(
          margin + (cardW + 4) * 2,
          y,
          cardW,
          36,
          "Top Competitor",
          `${Number(cmp?.top_competitor?.rating || 0).toFixed(1)} ★`,
          `Members: ${cmp?.top_competitor?.members ?? 0}`
        );

        y += 46;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        setText(colors.muted);
        pdf.text(`Your Monthly Price: ₱${cmp?.your_gym?.price ?? 0}`, margin, y);
        pdf.text(`Area Average Price: ₱${cmp?.area_average?.price ?? 0}`, margin, y + 7);
        pdf.text(`Top Competitor Price: ₱${cmp?.top_competitor?.price ?? 0}`, margin, y + 14);
        y += 24;
      }

      y = drawSectionTitle("Presentation Note", y);
      drawWrappedText(
        "This PDF includes only the most important analytics sections for presentation and reporting use.",
        margin,
        y + 4,
        contentW
      );

      pdf.save(`${safeGymName}-presentation-${timeRange}.pdf`);
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("Failed to export PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="ultimate-stats">
        <div className="ultimate-loading">
          <div className="ultimate-spinner"></div>
          <p className="loading-text">Crunching the numbers...</p>
          <span className="loading-subtext">Analyzing your gym&apos;s performance</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="ultimate-stats">
        <div className="ultimate-error">
          <AlertCircle size={48} />
          <p>Unable to load analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ultimate-stats">
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
            <button className="action-btn secondary" onClick={handleDownloadPresentationPdf} disabled={downloadingPdf}>
              <Download size={18} />
              {downloadingPdf ? "Exporting..." : "Download Presentation PDF"}
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

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  className="action-btn secondary"
                  style={{ padding: "8px 12px" }}
                  onClick={() => navigate(`/owner/edit-gym/${gymId}`)}
                  title="Edit Gym"
                >
                  <Settings size={16} />
                  Manage Gym
                </button>
                <button
                  className="action-btn secondary"
                  style={{ padding: "8px 12px" }}
                  onClick={() => navigate("/owner/inbox")}
                  title="Open Inbox"
                >
                  <Inbox size={16} />
                  Inbox
                </button>
                <button className="close-insights" onClick={() => setShowInsights(false)} title="Hide">
                  <XCircle size={18} />
                </button>
              </div>
            </div>

            <div className="insights-grid">
              {executiveSummary.map((item, i) => (
                <div key={i} className={`insight-card ${item.type}`}>
                  <div className="insight-icon">
                    {item.icon === "rating" && <Star size={20} />}
                    {item.icon === "visibility" && <Eye size={20} />}
                    {item.icon === "growth" && <Users size={20} />}
                    {item.icon === "engagement" && <MessageSquare size={20} />}
                    {item.icon === "location" && <MapPin size={20} />}
                    {!item.icon && <BarChart3 size={20} />}
                  </div>
                  <div className="insight-content">
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                    <button className="insight-action" onClick={() => handleInsightAction(item)}>
                      {item.action} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {!executiveSummary.length && (
                <div className="insight-card info">
                  <div className="insight-icon">
                    <Sparkles size={20} />
                  </div>
                  <div className="insight-content">
                    <strong>All quiet (for now)</strong>
                    <p>No new insights yet. Once you get more views, saves, and inquiries, this area will highlight wins + quick fixes.</p>
                    <button
                      className="insight-action"
                      onClick={() => timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    >
                      View timeline <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="performance-score-section">
          <div className="score-card main-score">
            <div className="score-header">
              <h3>Overall Performance</h3>

              <button
                type="button"
                className="score-info-btn"
                onClick={() => setShowPerfInfo(true)}
                aria-label="How is the performance score computed?"
                title="How is this computed?"
              >
                <Info size={16} />
              </button>
            </div>

            <div className="score-display">
              <div className="score-circle">
                <svg viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#f5f5f5"
                    strokeWidth="8"
                  ></circle>

                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#perfGradient)"
                    strokeWidth="8"
                    strokeDasharray={`${(stats.performance_score?.overall ?? 0) * 3.39} 339`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  ></circle>

                  <defs>
                    <linearGradient id="perfGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="35%" stopColor="#f59e0b" />
                      <stop offset="70%" stopColor="#ff6b35" />
                      <stop offset="100%" stopColor="#d23f0b" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="score-value">{stats.performance_score?.overall ?? 0}</div>
              </div>

              <div className="score-label">
                <span>Performance Score</span>
                <p className="muted" style={{ opacity: 0.8 }}>
                  Based on visibility, engagement, satisfaction, and growth for the selected range.
                </p>
              </div>
            </div>
          </div>

          <div className="score-breakdown">
            {Object.entries(stats.performance_score || {})
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
          {Object.entries(stats.hero_metrics || {}).map(([key, data]) => (
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
                  {Math.abs(Number(data.change || 0))}%
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
            <button className="view-all-btn" onClick={() => navigate(`/owner/view-gym/${gymId}`)}>
              Manage gym <ChevronRight size={16} />
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
          <div className="analytics-card timeline-card" ref={timelineRef}>
            <div className="card-header">
              <div>
                <h3>Performance Timeline</h3>
                <p>
                  Bars auto-bucket by range (7D daily, 30D weekly, 90D biweekly, 1Y monthly).{" "}
                  <span className={`trend-chip ${trendBadge.cls}`} style={{ marginLeft: 8 }}>
                    {trendBadge.icon} {trendBadge.label}
                  </span>
                </p>
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
                const value = safeNum(day?.[selectedMetric]);

                const height = metricMax > 0 ? Math.max((value / metricMax) * 100, value > 0 ? 6 : 2) : 2;

                return (
                  <div key={i} className="timeline-bar-wrapper">
                    <div className="timeline-bar-area">
                      <div className="timeline-bar" style={{ height: `${height}%` }} data-value={value}>
                        <span className="bar-tooltip">{value}</span>
                      </div>
                    </div>
                    <span className="timeline-label">{fmtTimelineLabel(day?.date)}</span>
                  </div>
                );
              })}
              {!timeline.length && <div style={{ padding: 16, opacity: 0.7 }}>No timeline data yet for this range.</div>}
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
              {!engagementByAction.length && <div style={{ padding: 16, opacity: 0.7 }}>No engagement data yet.</div>}
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
              <button className="action-btn secondary" style={{ padding: "8px 12px" }} onClick={() => navigate("/owner/inbox")}>
                <Inbox size={16} />
                Open Inbox
              </button>
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
              {!inquiryKeywords.length && (
                <div className="table-row" style={{ opacity: 0.7 }}>
                  <div className="source-cell">
                    <div className="source-rank">—</div>
                    <span>No inquiry keywords yet</span>
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

          <div className="analytics-card demographics-card">
            <div className="card-header">
              <div>
                <h3>Member Demographics</h3>
                <p>Age & gender breakdown</p>
              </div>
            </div>
            <div className="demographics-layout">
              <div className="demo-chart age-chart">
                <h4>Age Distribution</h4>
                <div className="age-bars">
                  {ageGroups.map((group, i) => {
                    const pct = safeNum(group.percentage);
                    const h = Math.max(pct * 2.5, pct > 0 ? 10 : 4);

                    return (
                      <div key={i} className="age-bar">
                        <div className="age-bar-area">
                          <div className="age-fill" style={{ height: `${h}%` }}>
                            <span className="age-value">{pct}%</span>
                          </div>
                        </div>
                        <span className="age-label">{group.range}</span>
                      </div>
                    );
                  })}
                  {!ageGroups.length && <div style={{ padding: 12, opacity: 0.7 }}>No demographics data yet.</div>}
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

        <div className="competitor-section" ref={marketRef}>
          <div className="section-header">
            <h3>
              <Award size={20} /> Market Position
            </h3>
            <span className="section-subtitle">Compare with competitors</span>
          </div>

          {!stats.competitor_comparison ? (
            <div className="analytics-card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AlertCircle size={18} />
                <div>
                  <strong>Market position not available yet</strong>
                  <div style={{ opacity: 0.8, marginTop: 4 }}>
                    Once the API returns market comparisons (area average + top competitor), this section will auto-populate.
                    For now, you can still manage gym pricing and details.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button className="action-btn primary" onClick={() => navigate(`/owner/edit-gym/${gymId}`)}>
                  <Settings size={16} />
                  Edit Gym
                </button>
                <button
                  className="action-btn secondary"
                  onClick={() => timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  <BarChart3 size={16} />
                  Back to Timeline
                </button>
              </div>
            </div>
          ) : (
            <div className="competitor-grid">
              <div className="competitor-card you">
                <div className="competitor-label">Your Gym</div>
                <div className="competitor-stats">
                  <div className="comp-stat">
                    <Star size={16} />
                    <strong>{Number(stats.competitor_comparison?.your_gym?.rating || 0).toFixed(1)}</strong>
                    <span>Rating</span>
                  </div>
                  <div className="comp-stat">
                    <Users size={16} />
                    <strong>{stats.competitor_comparison?.your_gym?.members ?? 0}</strong>
                    <span>Members</span>
                  </div>
                  <div className="comp-stat">
                    <DollarSign size={16} />
                    <strong>₱{stats.competitor_comparison?.your_gym?.price ?? 0}</strong>
                    <span>Monthly</span>
                  </div>
                </div>
              </div>

              <div className="competitor-card average">
                <div className="competitor-label">Area Average</div>
                <div className="competitor-stats">
                  <div className="comp-stat">
                    <Star size={16} />
                    <strong>{Number(stats.competitor_comparison?.area_average?.rating || 0).toFixed(1)}</strong>
                    <span>Rating</span>
                  </div>
                  <div className="comp-stat">
                    <Users size={16} />
                    <strong>{stats.competitor_comparison?.area_average?.members ?? 0}</strong>
                    <span>Members</span>
                  </div>
                  <div className="comp-stat">
                    <DollarSign size={16} />
                    <strong>₱{stats.competitor_comparison?.area_average?.price ?? 0}</strong>
                    <span>Monthly</span>
                  </div>
                </div>
              </div>

              <div className="competitor-card top">
                <div className="competitor-label">Top Competitor</div>
                <div className="competitor-stats">
                  <div className="comp-stat">
                    <Star size={16} />
                    <strong>{Number(stats.competitor_comparison?.top_competitor?.rating || 0).toFixed(1)}</strong>
                    <span>Rating</span>
                  </div>
                  <div className="comp-stat">
                    <Users size={16} />
                    <strong>{stats.competitor_comparison?.top_competitor?.members ?? 0}</strong>
                    <span>Members</span>
                  </div>
                  <div className="comp-stat">
                    <DollarSign size={16} />
                    <strong>₱{stats.competitor_comparison?.top_competitor?.price || 0}</strong>
                    <span>Monthly</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {showPerfInfo && (
          <div
            className="perf-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Performance score computation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowPerfInfo(false);
            }}
          >
            <div className="perf-modal">
              <div className="perf-modal-header">
                <div>
                  <h3>How the Performance Score works</h3>
                  <p>
                    Your <strong>Overall</strong> score is a weighted mix of 4 sub-scores, each from 0–100.
                    It changes based on the selected time range ({String(timeRange || "").toUpperCase()}).
                  </p>
                </div>

                <button
                  type="button"
                  className="perf-modal-close"
                  onClick={() => setShowPerfInfo(false)}
                  aria-label="Close"
                  title="Close"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <div className="perf-modal-body">
                <div className="perf-formula">
                  <strong>Overall</strong> =
                  <span> 0.30 × Visibility</span> +
                  <span> 0.30 × Engagement</span> +
                  <span> 0.25 × Satisfaction</span> +
                  <span> 0.15 × Growth</span>
                </div>

                <div className="perf-grid">
                  <div className="perf-item">
                    <div className="perf-item-top">
                      <strong>Visibility (30%)</strong>
                      <span className="perf-pill">{stats.performance_score?.visibility ?? 0}/100</span>
                    </div>
                    <p>
                      Measures <strong>views per day</strong> vs a target baseline:
                      <br />
                      <span className="mono">targetViewsPerDay = 7D: 8, 30D: 6, 90D: 4, 1Y: 3</span>
                      <br />
                      <span className="mono">viewsPerDay = views / days</span>
                      <br />
                      <span className="mono">
                        smoothScore(x) = round( clamp((1 - exp(-k·x)) · 100, 0, 100) ), k=4
                      </span>
                    </p>
                  </div>

                  <div className="perf-item">
                    <div className="perf-item-top">
                      <strong>Engagement (30%)</strong>
                      <span className="perf-pill">{stats.performance_score?.engagement ?? 0}/100</span>
                    </div>
                    <p>
                      Measures meaningful actions:
                      <br />
                      <span className="mono">engagementActions = saves + inquiries + free_visits_claimed</span>
                      <br />
                      <span className="mono">engRate = engagementActions / views</span>
                      <br />
                      <span className="mono">targetEngRate = 0.06</span>
                      <br />
                      <span className="mono">Score = smoothScore(engRate / targetEngRate)</span>
                    </p>
                  </div>

                  <div className="perf-item">
                    <div className="perf-item-top">
                      <strong>Satisfaction (25%)</strong>
                      <span className="perf-pill">{stats.performance_score?.satisfaction ?? 0}/100</span>
                    </div>
                    <p>
                      Uses verified average rating scaled by review confidence:
                      <br />
                      <span className="mono">satisfactionRaw = (rating / 5) · 100</span>
                      <br />
                      <span className="mono">
                        confidence = clamp(0.2 + (1 - exp(-verifiedCount/10)) · 0.8, 0.2, 1)
                      </span>
                      <br />
                      <span className="mono">Satisfaction = round( clamp(satisfactionRaw · confidence, 0, 100) )</span>
                    </p>
                  </div>

                  <div className="perf-item">
                    <div className="perf-item-top">
                      <strong>Growth (15%)</strong>
                      <span className="perf-pill">{stats.performance_score?.growth ?? 0}/100</span>
                    </div>
                    <p>
                      Based on active member change %:
                      <br />
                      <span className="mono">memberChange = active_members.change (or hero.members.change)</span>
                      <br />
                      <span className="mono">memberChangeClamped = clamp(memberChange, -30, 30)</span>
                      <br />
                      <span className="mono">
                        Growth = round( clamp(50 + (memberChangeClamped/30) · 40, 0, 100) )
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}