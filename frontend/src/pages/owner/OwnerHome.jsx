import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../user/Header-user";
import Footer from "../user/Footer";
import "./OwnerHome.css";
import {
  Plus, Eye, Users, Star, MapPin, Edit, BarChart3,
  TrendingUp, TrendingDown, Crown, Settings, Bell,
  ChevronRight, CheckCircle, AlertCircle, ArrowRight,
  Calendar, MessageSquare, Award, Target, Zap, DollarSign,
  Clock, AlertTriangle, ThumbsUp, Image as ImageIcon,
  UserPlus, FileText, Phone, Mail, Download, Share2,
  Shield, Activity, Package, Briefcase
} from "lucide-react";

const MOCK_DATA = {
  owner: {
    name: "Juan Dela Cruz",
    email: "juan@ironforge.ph",
    verified: true,
    member_since: "January 2024"
  },
  gyms: [
    {
      id: 1,
      name: "IronForge Fitness",
      location: "Kapitolyo, Pasig City",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
      status: "active",
      verified: true,
      stats: {
        members: 156,
        views: 1247,
        rating: 4.8,
        reviews: 89,
        revenue: 389000
      },
      rank: 3,
      total_gyms: 24,
      trend: {
        members: 12.5,
        views: 18.3,
        rating: 2.1
      },
      alerts: [
        { type: "review", text: "3 reviews need response", count: 3, priority: "high" },
        { type: "renewal", text: "5 renewals this week", count: 5, priority: "medium" }
      ]
    },
    {
      id: 2,
      name: "PowerLift Pro Gym",
      location: "Ortigas Center, Pasig",
      image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80",
      status: "active",
      verified: true,
      stats: {
        members: 203,
        views: 1580,
        rating: 4.6,
        reviews: 112,
        revenue: 507500
      },
      rank: 2,
      total_gyms: 24,
      trend: {
        members: 8.7,
        views: -3.2,
        rating: 4.5
      },
      alerts: [
        { type: "photo", text: "Add more photos", count: 0, priority: "low" }
      ]
    }
  ],
  urgent_actions: [
    { icon: MessageSquare, text: "Respond to 3 reviews", link: "/owner/reviews", priority: "high", count: 3 },
    { icon: Calendar, text: "5 renewals due this week", link: "/owner/members", priority: "medium", count: 5 },
    { icon: ImageIcon, text: "Update gym photos", link: "/owner/gym/1", priority: "low", count: 0 }
  ],
  pending_reviews: [
    { 
      id: 1, 
      gym_name: "IronForge Fitness",
      user: "Maria Santos", 
      rating: 5, 
      text: "Great gym! Clean facilities and friendly staff. I've been a member for 3 months now...", 
      time: "2 hours ago",
      responded: false
    },
    { 
      id: 2, 
      gym_name: "IronForge Fitness",
      user: "Carlo Reyes", 
      rating: 4, 
      text: "Good equipment but parking is limited during peak hours...", 
      time: "1 day ago",
      responded: false
    },
    { 
      id: 3, 
      gym_name: "PowerLift Pro Gym",
      user: "Anna Lopez", 
      rating: 5, 
      text: "Best gym in the area! Highly recommend the personal training sessions...", 
      time: "2 days ago",
      responded: false
    }
  ],
  upcoming_renewals: [
    { id: 1, gym_name: "IronForge Fitness", member: "Juan Cruz", plan: "Monthly", renews: "in 2 days", amount: 2500 },
    { id: 2, gym_name: "PowerLift Pro Gym", member: "Sarah Lee", plan: "Quarterly", renews: "in 5 days", amount: 6500 },
    { id: 3, gym_name: "IronForge Fitness", member: "Mike Torres", plan: "Monthly", renews: "in 1 week", amount: 2500 },
    { id: 4, gym_name: "PowerLift Pro Gym", member: "Nina Garcia", plan: "Monthly", renews: "in 1 week", amount: 2800 }
  ],
  recent_signups: [
    { id: 1, gym_name: "PowerLift Pro Gym", name: "Alex Reyes", plan: "Monthly", joined: "Today", avatar: "AR" },
    { id: 2, gym_name: "IronForge Fitness", name: "Nina Garcia", plan: "Quarterly", joined: "Yesterday", avatar: "NG" },
    { id: 3, gym_name: "PowerLift Pro Gym", name: "Mark Santos", plan: "Monthly", joined: "2 days ago", avatar: "MS" }
  ],
  member_inquiries: [
    { id: 1, name: "Lisa Chen", message: "Is there a trial day available?", gym: "IronForge Fitness", time: "1 hour ago", unread: true },
    { id: 2, name: "Tom Wilson", message: "What are your operating hours?", gym: "PowerLift Pro Gym", time: "3 hours ago", unread: true },
    { id: 3, name: "Sarah Kim", message: "Do you offer student discounts?", gym: "IronForge Fitness", time: "5 hours ago", unread: false }
  ],
  recent_activity: [
    { type: "signup", text: "Alex Reyes joined PowerLift Pro Gym", time: "2 hours ago", icon: UserPlus },
    { type: "review", text: "New 5⭐ review from Maria Santos", time: "5 hours ago", icon: Star },
    { type: "renewal", text: "Juan Cruz renewed Monthly plan", time: "1 day ago", icon: Calendar },
    { type: "inquiry", text: "New inquiry from Lisa Chen", time: "1 day ago", icon: MessageSquare },
    { type: "view", text: "IronForge reached 1,000 views", time: "2 days ago", icon: Eye }
  ],
  quick_tips: [
    { 
      icon: MessageSquare,
      title: "Respond to Reviews",
      description: "Reply to 3 pending reviews to improve engagement and trust",
      action: "Respond Now",
      link: "/owner/reviews",
      color: "#3b82f6"
    },
    { 
      icon: ImageIcon,
      title: "Update Photos",
      description: "Gyms with 5+ photos get 3x more views. Add more today!",
      action: "Add Photos",
      link: "/owner/gym/1",
      color: "#10b981"
    }
  ]
};

export default function OwnerHome() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setData(MOCK_DATA);
      setSelectedGym(MOCK_DATA.gyms[0]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="od-app">
        <Header />
        <div className="od-loading">
          <div className="od-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="od-app">
      <Header />

      <div className="od-container">

        {/* Premium Hero Header */}
        <div className="od-hero-section">
          <div className="od-hero-background">
            <div className="od-hero-orb od-hero-orb-1"></div>
            <div className="od-hero-orb od-hero-orb-2"></div>
          </div>
          
          <div className="od-hero-content">
            <div className="od-hero-left">
              <div className="od-hero-greeting">
                <Activity className="od-hero-pulse-icon" size={24} />
                <span>Welcome back, {data.owner.name.split(' ')[0]}</span>
              </div>
              <h1 className="od-hero-title">Your Dashboard</h1>
              <p className="od-hero-subtitle">
                Managing {data.gyms.length} {data.gyms.length === 1 ? 'gym' : 'gyms'} • {data.gyms.reduce((sum, g) => sum + g.stats.members, 0)} total members
              </p>
            </div>

            <div className="od-hero-quick-stats">
              <div className="od-hero-stat">
                <div className="od-hero-stat-icon views">
                  <Eye size={20} />
                </div>
                <div className="od-hero-stat-content">
                  <span className="od-hero-stat-label">Total Views</span>
                  <strong className="od-hero-stat-value">
                    {data.gyms.reduce((sum, g) => sum + g.stats.views, 0).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="od-hero-stat">
                <div className="od-hero-stat-icon revenue">
                  <DollarSign size={20} />
                </div>
                <div className="od-hero-stat-content">
                  <span className="od-hero-stat-label">Monthly Revenue</span>
                  <strong className="od-hero-stat-value">
                    ₱{(data.gyms.reduce((sum, g) => sum + g.stats.revenue, 0) / 1000).toFixed(0)}K
                  </strong>
                </div>
              </div>

              <div className="od-hero-stat">
                <div className="od-hero-stat-icon rating">
                  <Star size={20} />
                </div>
                <div className="od-hero-stat-content">
                  <span className="od-hero-stat-label">Avg Rating</span>
                  <strong className="od-hero-stat-value">
                    {(data.gyms.reduce((sum, g) => sum + g.stats.rating, 0) / data.gyms.length).toFixed(1)}
                  </strong>
                </div>
              </div>

              <div className="od-hero-stat">
                <div className="od-hero-stat-icon rank">
                  <Award size={20} />
                </div>
                <div className="od-hero-stat-content">
                  <span className="od-hero-stat-label">Best Rank</span>
                  <strong className="od-hero-stat-value">
                    #{Math.min(...data.gyms.map(g => g.rank))}
                  </strong>
                </div>
              </div>
            </div>
          </div>

       
        </div>

        {/* NEW: Urgent Actions Banner */}
        <div className="od-urgent-section">
          <div className="od-urgent-header">
            <div className="od-urgent-title">
              <AlertCircle size={20} />
              <h3>Needs Your Attention</h3>
            </div>
          </div>
          <div className="od-urgent-grid">
            {data.urgent_actions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link key={i} to={action.link} className={`od-urgent-card ${action.priority}`}>
                  <div className="od-urgent-icon">
                    <Icon size={20} />
                  </div>
                  <div className="od-urgent-content">
                    <p>{action.text}</p>
                    {action.count > 0 && (
                      <span className="od-urgent-count">{action.count}</span>
                    )}
                  </div>
                  <ChevronRight size={18} className="od-urgent-arrow" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="od-main-grid">

          {/* Left Column */}
          <div className="od-left-column">

            {/* Your Gyms List */}
            <div className="od-gyms-section">
              <div className="od-section-header">
                <h2>Your Gyms ({data.gyms.length})</h2>
                <Link to="/owner/gyms/add" className="od-add-btn">
                  <Plus size={18} />
                  Add Gym
                </Link>
              </div>

              <div className="od-gyms-list">
                {data.gyms.map(gym => (
                  <div 
                    key={gym.id}
                    className={`od-gym-card ${selectedGym?.id === gym.id ? 'selected' : ''}`}
                    onClick={() => setSelectedGym(gym)}
                  >
                    <div className="od-gym-image">
                      <img src={gym.image} alt={gym.name} />
                      <div className={`od-gym-status ${gym.status}`}>
                        {gym.status === 'active' ? (
                          <CheckCircle size={14} />
                        ) : (
                          <AlertCircle size={14} />
                        )}
                        {gym.status}
                      </div>
                    </div>

                    <div className="od-gym-info">
                      <div className="od-gym-header">
                        <h3>{gym.name}</h3>
                        {gym.verified && (
                          <div className="od-verified">
                            <CheckCircle size={14} />
                          </div>
                        )}
                      </div>
                      <div className="od-gym-location">
                        <MapPin size={14} />
                        <span>{gym.location}</span>
                      </div>

                      {gym.status === 'active' && (
                        <>
                          <div className="od-gym-quick-stats">
                            <div className="od-quick-stat">
                              <Users size={14} />
                              <span>{gym.stats.members}</span>
                            </div>
                            <div className="od-quick-stat">
                              <Eye size={14} />
                              <span>{gym.stats.views}</span>
                            </div>
                            <div className="od-quick-stat">
                              <Star size={14} />
                              <span>{gym.stats.rating}</span>
                            </div>
                          </div>

                          {gym.rank && (
                            <div className="od-gym-rank">
                              <Crown size={14} />
                              <span>Rank #{gym.rank} of {gym.total_gyms} in Pasig</span>
                            </div>
                          )}
                        </>
                      )}

                      {gym.alerts.length > 0 && (
                        <div className="od-gym-alerts">
                          {gym.alerts.slice(0, 2).map((alert, i) => (
                            <div key={i} className={`od-gym-alert ${alert.priority}`}>
                              <AlertCircle size={12} />
                              <span>{alert.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link 
                      to={`/owner/gym/${gym.id}`}
                      className="od-gym-action"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ChevronRight size={20} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* NEW: Member Inquiries */}
            <div className="od-inquiries-section">
              <div className="od-section-header">
                <h2>
                  <Mail size={20} />
                  Member Inquiries
                </h2>
                <Link to="/owner/inquiries" className="od-view-link">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="od-inquiries-list">
                {data.member_inquiries.map(inquiry => (
                  <div key={inquiry.id} className={`od-inquiry-item ${inquiry.unread ? 'unread' : ''}`}>
                    <div className="od-inquiry-avatar">
                      {inquiry.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="od-inquiry-content">
                      <div className="od-inquiry-header">
                        <strong>{inquiry.name}</strong>
                        <span className="od-inquiry-time">{inquiry.time}</span>
                      </div>
                      <p>{inquiry.message}</p>
                      <span className="od-inquiry-gym">{inquiry.gym}</span>
                    </div>
                    {inquiry.unread && (
                      <div className="od-inquiry-unread-dot"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* NEW: Recent Activity Feed */}
            <div className="od-activity-section">
              <div className="od-section-header">
                <h2>
                  <Activity size={20} />
                  Recent Activity
                </h2>
              </div>
              <div className="od-activity-feed">
                {data.recent_activity.map((activity, i) => {
                  const Icon = activity.icon;
                  return (
                    <div key={i} className="od-activity-item">
                      <div className={`od-activity-icon ${activity.type}`}>
                        <Icon size={16} />
                      </div>
                      <div className="od-activity-text">
                        <p>{activity.text}</p>
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="od-tips-section">
              <h3>Quick Tips</h3>
              <div className="od-tips-grid">
                {data.quick_tips.map((tip, i) => {
                  const Icon = tip.icon;
                  return (
                    <Link key={i} to={tip.link} className="od-tip-card-compact">
                      <div className="od-tip-icon-compact" style={{ background: tip.color }}>
                        <Icon size={20} />
                      </div>
                      <div className="od-tip-content-compact">
                        <h4>{tip.title}</h4>
                        <p>{tip.description}</p>
                        <span className="od-tip-action">{tip.action} →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="od-right-column">

            {/* Selected Gym Details */}
            {selectedGym && selectedGym.status === 'active' && (
              <>
                {/* Ranking Card */}
                <div className="od-rank-card">
                  <div className="od-rank-header">
                    <Award size={20} />
                    <h3>Market Position</h3>
                  </div>
                  <div className="od-rank-display">
                    <div className="od-rank-number">#{selectedGym.rank}</div>
                    <div className="od-rank-text">
                      <span>of {selectedGym.total_gyms} gyms</span>
                      <p>in Pasig City</p>
                    </div>
                  </div>
                  <div className="od-rank-tip">
                    <Zap size={16} />
                    <span>Improve rating to climb rankings</span>
                  </div>
                </div>

                {/* Performance */}
                <div className="od-performance-card">
                  <div className="od-perf-header">
                    <h3>Performance</h3>
                    <Link to={`/owner/gym/${selectedGym.id}/stats`} className="od-view-link">
                      View All <ArrowRight size={14} />
                    </Link>
                  </div>

                  <div className="od-perf-stats">
                    <div className="od-perf-stat">
                      <div className="od-perf-label">
                        <Users size={16} />
                        <span>Members</span>
                      </div>
                      <div className="od-perf-value">
                        <h4>{selectedGym.stats.members}</h4>
                        <div className={`od-perf-trend ${selectedGym.trend.members > 0 ? 'up' : 'down'}`}>
                          {selectedGym.trend.members > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          <span>{Math.abs(selectedGym.trend.members)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="od-perf-stat">
                      <div className="od-perf-label">
                        <Eye size={16} />
                        <span>Views</span>
                      </div>
                      <div className="od-perf-value">
                        <h4>{selectedGym.stats.views}</h4>
                        <div className={`od-perf-trend ${selectedGym.trend.views > 0 ? 'up' : 'down'}`}>
                          {selectedGym.trend.views > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          <span>{Math.abs(selectedGym.trend.views)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="od-perf-stat">
                      <div className="od-perf-label">
                        <Star size={16} />
                        <span>Rating</span>
                      </div>
                      <div className="od-perf-value">
                        <h4>{selectedGym.stats.rating}/5.0</h4>
                        <div className={`od-perf-trend up`}>
                          <TrendingUp size={12} />
                          <span>{selectedGym.trend.rating}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="od-perf-stat">
                      <div className="od-perf-label">
                        <DollarSign size={16} />
                        <span>Revenue</span>
                      </div>
                      <div className="od-perf-value">
                        <h4>₱{(selectedGym.stats.revenue / 1000).toFixed(0)}K</h4>
                        <div className="od-perf-trend up">
                          <TrendingUp size={12} />
                          <span>This month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Reviews */}
                <div className="od-reviews-card">
                  <div className="od-card-header">
                    <h3>
                      <MessageSquare size={18} />
                      Pending Reviews
                    </h3>
                    <Link to="/owner/reviews" className="od-view-link">
                      View All <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="od-reviews-list">
                    {data.pending_reviews.slice(0, 2).map(review => (
                      <div key={review.id} className="od-review-item">
                        <div className="od-review-header">
                          <div className="od-review-user">
                            <strong>{review.user}</strong>
                            <div className="od-review-stars">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={12} 
                                  fill={i < review.rating ? "#f59e0b" : "none"}
                                  color="#f59e0b"
                                />
                              ))}
                            </div>
                          </div>
                          <span className="od-review-time">{review.time}</span>
                        </div>
                        <p className="od-review-text">{review.text}</p>
                        <div className="od-review-gym">{review.gym_name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Renewals */}
                <div className="od-renewals-card">
                  <div className="od-card-header">
                    <h3>
                      <Calendar size={18} />
                      Upcoming Renewals
                    </h3>
                  </div>
                  <div className="od-renewals-list">
                    {data.upcoming_renewals.slice(0, 3).map(renewal => (
                      <div key={renewal.id} className="od-renewal-item">
                        <div className="od-renewal-info">
                          <strong>{renewal.member}</strong>
                          <span className="od-renewal-plan">{renewal.plan} • ₱{renewal.amount.toLocaleString()}</span>
                          <span className="od-renewal-gym">{renewal.gym_name}</span>
                        </div>
                        <div className="od-renewal-time">
                          <Clock size={14} />
                          <span>{renewal.renews}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Sign-ups */}
                <div className="od-signups-card">
                  <div className="od-card-header">
                    <h3>
                      <UserPlus size={18} />
                      Recent Sign-ups
                    </h3>
                  </div>
                  <div className="od-signups-list">
                    {data.recent_signups.map(signup => (
                      <div key={signup.id} className="od-signup-item">
                        <div className="od-signup-avatar">{signup.avatar}</div>
                        <div className="od-signup-info">
                          <strong>{signup.name}</strong>
                          <span>{signup.plan} • {signup.gym_name}</span>
                        </div>
                        <span className="od-signup-time">{signup.joined}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}