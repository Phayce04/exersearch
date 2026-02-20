import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "../user/Header-user";
import Footer from "../user/Footer";
import "./ViewStats.css";
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Eye, Users, 
  DollarSign, Star, Calendar, ArrowUpRight, ArrowDownRight,
  Activity, Award, Target, UserPlus, BarChart2,
  Download, Share2, Settings, MessageSquare, Hash,
  Zap, Clock, MapPin, Sparkles, TrendingDown as TrendDown,
  AlertCircle, CheckCircle, XCircle, MinusCircle,
  Filter, Search, MoreVertical, ChevronDown, ChevronUp,
  RefreshCw, Bell, Heart, ThumbsUp, UserMinus, DollarSign as Revenue,
  Percent, Calendar as CalendarIcon, ArrowRight, Info
} from "lucide-react";

const API_BASE = "https://exersearch.test";

// MASSIVE MOCK DATA
const MOCK_STATS = {
  gym_name: "IronForge Fitness",
  gym_id: 1,
  last_updated: "2 minutes ago",
  
  // Hero metrics with predictions
  hero_metrics: {
    views: { 
      current: 1247, 
      previous: 1108, 
      change: 12.5,
      trend: "up",
      prediction: 1380,
      status: "excellent"
    },
    members: { 
      current: 156, 
      previous: 144, 
      change: 8.3,
      trend: "up",
      prediction: 168,
      status: "good"
    },
    revenue: { 
      current: 389000, 
      previous: 401500, 
      change: -3.1,
      trend: "down",
      prediction: 395000,
      status: "warning"
    },
    rating: { 
      current: 4.8, 
      previous: 4.7, 
      change: 2.1,
      trend: "up",
      prediction: 4.9,
      status: "excellent"
    },
  },

  // Performance score
  performance_score: {
    overall: 87,
    visibility: 92,
    engagement: 78,
    satisfaction: 94,
    growth: 85,
  },

  // Detailed timeline (30 days)
  timeline_data: [
    { date: "Feb 1", views: 42, members: 8, revenue: 12500, rating: 4.7 },
    { date: "Feb 2", views: 38, members: 6, revenue: 11200, rating: 4.7 },
    { date: "Feb 3", views: 51, members: 10, revenue: 15800, rating: 4.8 },
    { date: "Feb 4", views: 45, members: 7, revenue: 13400, rating: 4.7 },
    { date: "Feb 5", views: 48, members: 9, revenue: 14100, rating: 4.8 },
    { date: "Feb 6", views: 55, members: 11, revenue: 16200, rating: 4.8 },
    { date: "Feb 7", views: 39, members: 6, revenue: 11800, rating: 4.7 },
    { date: "Feb 8", views: 44, members: 8, revenue: 13000, rating: 4.8 },
    { date: "Feb 9", views: 52, members: 10, revenue: 15500, rating: 4.8 },
    { date: "Feb 10", views: 47, members: 9, revenue: 14300, rating: 4.8 },
  ],

  // Conversion funnel
  conversion_funnel: [
    { stage: "Profile Views", count: 1247, percentage: 100, drop: 0 },
    { stage: "Photo Gallery", count: 892, percentage: 71.5, drop: 28.5 },
    { stage: "Pricing Checked", count: 534, percentage: 42.8, drop: 28.7 },
    { stage: "Contact Info", count: 312, percentage: 25.0, drop: 17.8 },
    { stage: "Sign-ups", count: 156, percentage: 12.5, drop: 12.5 },
  ],

  // Revenue deep dive
  revenue_details: {
    by_plan: [
      { name: "Day Pass", revenue: 45000, members: 300, avg: 150, growth: 5.2 },
      { name: "Monthly", revenue: 242500, members: 97, avg: 2500, growth: 12.3 },
      { name: "Quarterly", revenue: 101500, members: 15, avg: 6767, growth: -2.1 },
    ],
    by_month: [
      { month: "Aug", revenue: 342000 },
      { month: "Sep", revenue: 368000 },
      { month: "Oct", revenue: 355000 },
      { month: "Nov", revenue: 378000 },
      { month: "Dec", revenue: 401000 },
      { month: "Jan", revenue: 389000 },
    ],
  },

  // Member insights
  member_insights: {
    total: 156,
    new_this_month: 12,
    cancelled: 2,
    net_growth: 10,
    churn_rate: 1.3,
    ltv: 18750,
    avg_tenure: 8.4,
    retention_by_cohort: [
      { cohort: "Aug 2025", retention: 94 },
      { cohort: "Sep 2025", retention: 91 },
      { cohort: "Oct 2025", retention: 89 },
      { cohort: "Nov 2025", retention: 95 },
      { cohort: "Dec 2025", retention: 92 },
      { cohort: "Jan 2026", retention: 100 },
    ],
  },

  // Traffic analysis
  traffic_analysis: {
    sources: [
      { name: "Google Search", visits: 487, conversions: 62, ctr: 12.7, cost: 0 },
      { name: "Direct", visits: 312, conversions: 45, ctr: 14.4, cost: 0 },
      { name: "Social Media", visits: 224, conversions: 28, ctr: 12.5, cost: 3200 },
      { name: "ExerSearch Browse", visits: 156, conversions: 18, ctr: 11.5, cost: 0 },
      { name: "Referrals", visits: 68, conversions: 3, ctr: 4.4, cost: 0 },
    ],
    devices: [
      { type: "Mobile", percentage: 64, conversions: 89 },
      { type: "Desktop", percentage: 32, conversions: 58 },
      { type: "Tablet", percentage: 4, conversions: 9 },
    ],
  },

  // Demographics detailed
  demographics: {
    age: [
      { range: "18-24", count: 34, percentage: 22 },
      { range: "25-34", count: 59, percentage: 38 },
      { range: "35-44", count: 37, percentage: 24 },
      { range: "45-54", count: 19, percentage: 12 },
      { range: "55+", count: 7, percentage: 4 },
    ],
    gender: { male: 91, female: 62, other: 3 },
    distance: [
      { range: "< 1km", count: 78, percentage: 50 },
      { range: "1-3km", count: 47, percentage: 30 },
      { range: "3-5km", count: 23, percentage: 15 },
      { range: "> 5km", count: 8, percentage: 5 },
    ],
  },

  // Peak analysis
  peak_analysis: {
    by_hour: [
      { hour: 6, intensity: 45, avg_duration: 68 },
      { hour: 7, intensity: 68, avg_duration: 72 },
      { hour: 8, intensity: 55, avg_duration: 65 },
      { hour: 12, intensity: 52, avg_duration: 45 },
      { hour: 13, intensity: 48, avg_duration: 42 },
      { hour: 17, intensity: 78, avg_duration: 85 },
      { hour: 18, intensity: 95, avg_duration: 90 },
      { hour: 19, intensity: 82, avg_duration: 78 },
      { hour: 20, intensity: 65, avg_duration: 70 },
      { hour: 21, intensity: 45, avg_duration: 55 },
    ],
    by_day: [
      { day: "Mon", intensity: 72 },
      { day: "Tue", intensity: 68 },
      { day: "Wed", intensity: 75 },
      { day: "Thu", intensity: 70 },
      { day: "Fri", intensity: 65 },
      { day: "Sat", intensity: 45 },
      { day: "Sun", intensity: 38 },
    ],
  },

  // Reviews analytics
  reviews_analytics: {
    total: 127,
    average: 4.8,
    distribution: { 5: 89, 4: 28, 3: 7, 2: 2, 1: 1 },
    sentiment: { positive: 92, neutral: 6, negative: 2 },
    recent_trend: 15.2,
    response_rate: 87,
    avg_response_time: "4.2 hours",
    top_keywords: [
      { word: "clean", count: 45 },
      { word: "equipment", count: 38 },
      { word: "staff", count: 32 },
      { word: "price", count: 28 },
      { word: "location", count: 24 },
    ],
  },

  // Competitor comparison
  competitor_comparison: {
    your_gym: { rating: 4.8, members: 156, price: 2500 },
    area_average: { rating: 4.3, members: 98, price: 2800 },
    top_competitor: { rating: 4.6, members: 203, price: 2400 },
  },

  // AI insights
  ai_insights: [
    {
      type: "success",
      icon: "sparkles",
      title: "Peak Performance",
      message: "Your rating increased by 2.1% - members love your clean facilities!",
      action: "View reviews"
    },
    {
      type: "warning",
      icon: "alert",
      title: "Revenue Dip",
      message: "Revenue down 3.1%. Consider promoting quarterly plans with 10% discount.",
      action: "Create campaign"
    },
    {
      type: "info",
      icon: "lightbulb",
      title: "Traffic Opportunity",
      message: "Social media conversions are strong. Increase budget by ₱2,000 for 15+ signups.",
      action: "Boost budget"
    },
    {
      type: "success",
      icon: "trophy",
      title: "Retention Win",
      message: "92% retention rate - 8% above area average. Keep it up!",
      action: "See details"
    },
  ],

  // Goals tracking
  goals: [
    { name: "Monthly Sign-ups", current: 12, target: 15, percentage: 80 },
    { name: "Rating Target", current: 4.8, target: 4.9, percentage: 98 },
    { name: "Revenue Goal", current: 389000, target: 400000, percentage: 97 },
    { name: "Retention Rate", current: 92, target: 90, percentage: 102 },
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
    setTimeout(() => {
      setStats(MOCK_STATS);
      setLoading(false);
    }, 800);
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

  const getStatusColor = (status) => {
    const colors = {
      excellent: "#10b981",
      good: "#3b82f6",
      warning: "#f59e0b",
      danger: "#ef4444"
    };
    return colors[status] || "#666";
  };

  return (
    <div className="ultimate-stats">
      <Header />

      <div className="ultimate-container">

        {/* Premium Header */}
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

        {/* AI Insights Banner */}
        {showInsights && (
          <div className="insights-banner">
            <div className="insights-header">
              <div className="insights-title">
                <Sparkles size={20} />
                <h3>AI-Powered Insights</h3>
                <span className="insights-badge">4 New</span>
              </div>
              <button className="close-insights" onClick={() => setShowInsights(false)}>
                <XCircle size={18} />
              </button>
            </div>
            <div className="insights-grid">
              {stats.ai_insights.map((insight, i) => (
                <div key={i} className={`insight-card ${insight.type}`}>
                  <div className="insight-icon">
                    {insight.icon === "sparkles" && <Sparkles size={20} />}
                    {insight.icon === "alert" && <AlertCircle size={20} />}
                    {insight.icon === "lightbulb" && <Zap size={20} />}
                    {insight.icon === "trophy" && <Award size={20} />}
                  </div>
                  <div className="insight-content">
                    <strong>{insight.title}</strong>
                    <p>{insight.message}</p>
                    <button className="insight-action">
                      {insight.action} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Score */}
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
            {Object.entries(stats.performance_score).filter(([key]) => key !== 'overall').map(([key, value]) => (
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

        {/* Hero Metrics with Predictions */}
        <div className="ultimate-hero-grid">
          {Object.entries(stats.hero_metrics).map(([key, data]) => (
            <div key={key} className={`ultimate-hero-card ${data.status}`}>
              <div className="hero-card-header">
                <div className="hero-icon" style={{ background: getStatusColor(data.status) }}>
                  {key === 'views' && <Eye size={24} />}
                  {key === 'members' && <Users size={24} />}
                  {key === 'revenue' && <DollarSign size={24} />}
                  {key === 'rating' && <Star size={24} />}
                </div>
                <div className={`hero-change ${data.trend}`}>
                  {data.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(data.change)}%
                </div>
              </div>
              <div className="hero-content">
                <span className="hero-label">
                  {key === 'views' && 'Profile Views'}
                  {key === 'members' && 'Active Members'}
                  {key === 'revenue' && 'Monthly Revenue'}
                  {key === 'rating' && 'Avg Rating'}
                </span>
                <h2 className="hero-value">
                  {key === 'revenue' ? `₱${(data.current / 1000).toFixed(0)}K` : data.current.toLocaleString()}
                  {key === 'rating' && '/5.0'}
                </h2>
                <div className="hero-prediction">
                  <span className="prediction-label">Predicted next month:</span>
                  <strong>
                    {key === 'revenue' ? `₱${(data.prediction / 1000).toFixed(0)}K` : data.prediction}
                    {key === 'rating' && '/5.0'}
                  </strong>
                </div>
              </div>
              <div className="hero-sparkline">
                {/* Mini chart would go here */}
                <div className="sparkline-placeholder"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Goals Progress */}
        <div className="goals-section">
          <div className="section-header">
            <h3><Target size={20} /> Monthly Goals</h3>
            <button className="view-all-btn">View all <ChevronRight size={16} /></button>
          </div>
          <div className="goals-grid">
            {stats.goals.map((goal, i) => (
              <div key={i} className="goal-card">
                <div className="goal-header">
                  <span className="goal-name">{goal.name}</span>
                  <span className={`goal-status ${goal.percentage >= 100 ? 'complete' : goal.percentage >= 75 ? 'ontrack' : 'behind'}`}>
                    {goal.percentage >= 100 ? <CheckCircle size={16} /> : <Activity size={16} />}
                    {goal.percentage}%
                  </span>
                </div>
                <div className="goal-progress">
                  <div className="goal-values">
                    <strong>{typeof goal.current === 'number' && goal.current > 1000 ? `₱${(goal.current/1000).toFixed(0)}K` : goal.current}</strong>
                    <span>/ {typeof goal.target === 'number' && goal.target > 1000 ? `₱${(goal.target/1000).toFixed(0)}K` : goal.target}</span>
                  </div>
                  <div className="goal-bar">
                    <div 
                      className="goal-fill" 
                      style={{ 
                        width: `${Math.min(goal.percentage, 100)}%`,
                        background: goal.percentage >= 100 ? '#10b981' : goal.percentage >= 75 ? '#3b82f6' : '#f59e0b'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Analytics Grid */}
        <div className="analytics-main-grid">

          {/* Timeline Chart - LARGE */}
          <div className="analytics-card timeline-card">
            <div className="card-header">
              <div>
                <h3>Performance Timeline</h3>
                <p>Track your key metrics over time</p>
              </div>
              <div className="metric-selector">
                <button 
                  className={selectedMetric === 'views' ? 'active' : ''}
                  onClick={() => setSelectedMetric('views')}
                >
                  Views
                </button>
                <button 
                  className={selectedMetric === 'members' ? 'active' : ''}
                  onClick={() => setSelectedMetric('members')}
                >
                  Members
                </button>
                <button 
                  className={selectedMetric === 'revenue' ? 'active' : ''}
                  onClick={() => setSelectedMetric('revenue')}
                >
                  Revenue
                </button>
              </div>
            </div>
            <div className="timeline-chart">
              {stats.timeline_data.map((day, i) => {
                const value = day[selectedMetric];
                const maxValue = Math.max(...stats.timeline_data.map(d => d[selectedMetric]));
                const height = (value / maxValue) * 100;
                return (
                  <div key={i} className="timeline-bar-wrapper">
                    <div 
                      className="timeline-bar"
                      style={{ height: `${height}%` }}
                      data-value={selectedMetric === 'revenue' ? `₱${(value/1000).toFixed(1)}K` : value}
                    >
                      <span className="bar-tooltip">
                        {selectedMetric === 'revenue' ? `₱${(value/1000).toFixed(1)}K` : value}
                      </span>
                    </div>
                    <span className="timeline-label">{day.date.split(' ')[1]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="analytics-card funnel-card">
            <div className="card-header">
              <div>
                <h3>Conversion Funnel</h3>
                <p>User journey from view to sign-up</p>
              </div>
            </div>
            <div className="conversion-funnel">
              {stats.conversion_funnel.map((stage, i) => (
                <div key={i} className="funnel-stage">
                  <div className="funnel-stage-header">
                    <span className="stage-name">{stage.stage}</span>
                    <div className="stage-stats">
                      <strong>{stage.count}</strong>
                      <span className="stage-percentage">{stage.percentage}%</span>
                    </div>
                  </div>
                  <div className="funnel-bar">
                    <div 
                      className="funnel-fill"
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                  {i < stats.conversion_funnel.length - 1 && (
                    <div className="funnel-drop">
                      <TrendDown size={14} />
                      {stage.drop}% drop
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Deep Dive */}
          <div className="analytics-card revenue-card">
            <div className="card-header">
              <div>
                <h3>Revenue Analysis</h3>
                <p>Breakdown by membership plan</p>
              </div>
            </div>
            <div className="revenue-breakdown-list">
              {stats.revenue_details.by_plan.map((plan, i) => (
                <div key={i} className="revenue-plan">
                  <div className="plan-header">
                    <div className="plan-info">
                      <strong>{plan.name}</strong>
                      <span>{plan.members} members</span>
                    </div>
                    <div className="plan-revenue">
                      <strong>₱{plan.revenue.toLocaleString()}</strong>
                      <span className={`plan-growth ${plan.growth > 0 ? 'up' : 'down'}`}>
                        {plan.growth > 0 ? '+' : ''}{plan.growth}%
                      </span>
                    </div>
                  </div>
                  <div className="plan-meta">
                    <span>Avg: ₱{plan.avg.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources Table */}
          <div className="analytics-card traffic-card">
            <div className="card-header">
              <div>
                <h3>Traffic Sources</h3>
                <p>Where your visitors come from</p>
              </div>
            </div>
            <div className="traffic-table">
              <div className="table-header">
                <span>Source</span>
                <span>Visits</span>
                <span>Conv.</span>
                <span>CTR</span>
              </div>
              {stats.traffic_analysis.sources.map((source, i) => (
                <div key={i} className="table-row">
                  <div className="source-cell">
                    <div className="source-rank">{i + 1}</div>
                    <span>{source.name}</span>
                  </div>
                  <span className="visits-cell">{source.visits}</span>
                  <span className="conv-cell">{source.conversions}</span>
                  <span className="ctr-cell">
                    <span className={`ctr-badge ${source.ctr > 12 ? 'good' : 'normal'}`}>
                      {source.ctr}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Times Heatmap */}
          <div className="analytics-card heatmap-card">
            <div className="card-header">
              <div>
                <h3>Peak Times Heatmap</h3>
                <p>Busiest hours of the day</p>
              </div>
            </div>
            <div className="peak-heatmap">
              {stats.peak_analysis.by_hour.map((hour, i) => (
                <div 
                  key={i} 
                  className="heatmap-cell"
                  style={{ 
                    background: `rgba(210, 63, 11, ${hour.intensity / 100})`,
                    color: hour.intensity > 50 ? 'white' : '#666'
                  }}
                >
                  <span className="cell-hour">{hour.hour}:00</span>
                  <strong className="cell-intensity">{hour.intensity}%</strong>
                  <span className="cell-duration">{hour.avg_duration}m</span>
                </div>
              ))}
            </div>
          </div>

          {/* Demographics Grid */}
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
                  {stats.demographics.age.map((group, i) => (
                    <div key={i} className="age-bar">
                      <div 
                        className="age-fill"
                        style={{ height: `${group.percentage * 2.5}%` }}
                      >
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
                      <strong>{stats.demographics.gender.male}</strong>
                      <span>Male</span>
                    </div>
                    <div className="gender-item female">
                      <strong>{stats.demographics.gender.female}</strong>
                      <span>Female</span>
                    </div>
                    <div className="gender-item other">
                      <strong>{stats.demographics.gender.other}</strong>
                      <span>Other</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Competitor Comparison */}
        <div className="competitor-section">
          <div className="section-header">
            <h3><Award size={20} /> Market Position</h3>
            <span className="section-subtitle">Compare with competitors</span>
          </div>
          <div className="competitor-grid">
            <div className="competitor-card you">
              <div className="competitor-label">Your Gym</div>
              <div className="competitor-stats">
                <div className="comp-stat">
                  <Star size={16} />
                  <strong>{stats.competitor_comparison.your_gym.rating}</strong>
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