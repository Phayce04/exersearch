import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import HeaderUser from "./Header-user";
import Footer from "./Footer";
import "./ViewGym.css";
import {
  MapPin, Clock, DollarSign, Dumbbell,
  ChevronLeft, ChevronRight, Edit, BarChart3,
  Phone, Mail, CheckCircle, X, Star,
  User, Users, Eye, Calendar, TrendingUp,
  TrendingDown, Bell, Settings, Trash2, Plus, Download,
  AlertTriangle, Image as ImageIcon, ToggleLeft, ToggleRight,
  BadgeCheck, MoreVertical, ExternalLink, Copy, Share2
} from "lucide-react";

const API_BASE = "https://exersearch.test";

// Mock data for gym owner
const MOCK_GYM_OWNER = {
  id: 1,
  name: "IronForge Fitness",
  owner_id: 1,
  status: "active",
  verified: true,
  description: "Premier strength training facility in the heart of Pasig City. We offer state-of-the-art equipment, experienced trainers, and a motivating atmosphere for all fitness levels.",
  address: "123 Kapitolyo Street, Barangay Kapitolyo",
  city: "Pasig City",
  landmark: "Near SM Pasig, 2nd Floor",
  lat: 14.5764,
  lng: 121.0851,
  contact_number: "09171234567",
  email: "info@ironforge.ph",
  website: "www.ironforge.ph",
  photos: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80",
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=80",
  ],
  hours: {
    Monday: { open: "6:00 AM", close: "10:00 PM" },
    Tuesday: { open: "6:00 AM", close: "10:00 PM" },
    Wednesday: { open: "6:00 AM", close: "10:00 PM" },
    Thursday: { open: "6:00 AM", close: "10:00 PM" },
    Friday: { open: "6:00 AM", close: "10:00 PM" },
    Saturday: { open: "8:00 AM", close: "8:00 PM" },
    Sunday: { open: "8:00 AM", close: "6:00 PM" },
  },
  pricing: {
    day_pass: 150,
    monthly: 2500,
    quarterly: 6500,
  },
  amenities: ["Shower Rooms", "Locker Rooms", "Parking", "Air Conditioning", "WiFi", "Personal Training", "Cardio Area", "Free Weights"],
  equipments: [
    { id: 1, name: "Treadmill", image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&q=80", quantity: 8 },
    { id: 2, name: "Dumbbells", image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80", quantity: 20 },
    { id: 3, name: "Bench Press", image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&q=80", quantity: 4 },
    { id: 4, name: "Squat Rack", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80", quantity: 3 },
  ],
  analytics: {
    total_views: 1247,
    views_this_week: 89,
    views_change: 12.5,
    total_members: 156,
    new_members_this_month: 12,
    members_change: 8.3,
    revenue_this_month: 389000,
    revenue_change: -3.2,
    avg_rating: 4.8,
    total_reviews: 127,
    reviews_change: 15.2,
  },
  recent_members: [
    { name: "Maria Santos", joined: "2 days ago", plan: "Monthly", avatar: "MS" },
    { name: "Juan Cruz", joined: "5 days ago", plan: "Quarterly", avatar: "JC" },
    { name: "Carlo Reyes", joined: "1 week ago", plan: "Monthly", avatar: "CR" },
    { name: "Anna Lopez", joined: "2 weeks ago", plan: "Day Pass", avatar: "AL" },
  ],
  pending_reviews: 3,
  visibility: true,
  featured: false,
};

export default function ViewGym() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [visibility, setVisibility] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setGym(MOCK_GYM_OWNER);
      setVisibility(MOCK_GYM_OWNER.visibility);
      setLoading(false);
    }, 500);
  }, [id]);

  // Auto-advance photos
  useEffect(() => {
    if (!gym) return;
    const interval = setInterval(() => {
      setCurrentPhoto((p) => (p + 1) % gym.photos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [gym]);

  const nextPhoto = () => {
    if (gym) setCurrentPhoto((p) => (p + 1) % gym.photos.length);
  };

  const prevPhoto = () => {
    if (gym) setCurrentPhoto((p) => (p - 1 + gym.photos.length) % gym.photos.length);
  };

  const toggleVisibility = () => {
    setVisibility(!visibility);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="vg-app">
        <HeaderUser />
        <div className="vg-loading">
          <div className="vg-spinner"></div>
          Loading gym management...
        </div>
        <Footer />
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="vg-app">
        <HeaderUser />
        <div className="vg-error">Gym not found</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="vg-app">
      <HeaderUser />

      <div className="vg-container">

        {/* Floating Action Button */}
        <div className="vg-fab-container">
          <Link to={`/owner/gym/${gym.id}/edit`} className="vg-fab">
            <Edit size={20} />
            <span>Edit Gym</span>
          </Link>
        </div>

        {/* Owner Header */}
        <div className="vg-owner-header">
          <button className="vg-back" onClick={() => navigate(-1)}>
            <ChevronLeft size={16} /> Back
          </button>

          <div className="vg-header-main">
            <div className="vg-header-left">
              <h1 className="vg-owner-title">{gym.name}</h1>
              <div className="vg-owner-meta">
                <span className={`vg-status-badge ${gym.status}`}>
                  {gym.status === 'active' && <CheckCircle size={14} />}
                  {gym.status}
                </span>
                {gym.verified && (
                  <span className="vg-verified-badge">
                    <BadgeCheck size={14} /> Verified
                  </span>
                )}
                <button 
                  className={`vg-visibility-toggle ${visibility ? 'visible' : 'hidden'}`}
                  onClick={toggleVisibility}
                >
                  {visibility ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {visibility ? 'Live' : 'Hidden'}
                </button>
              </div>
            </div>

            <div className="vg-header-actions">
              <button className="vg-action-btn-ghost" onClick={copyLink}>
                <Copy size={18} />
                Copy Link
              </button>
              <button className="vg-action-btn-ghost">
                <ExternalLink size={18} />
                Preview
              </button>
              <Link to={`/owner/gym/${gym.id}/stats`} className="vg-action-btn-primary">
                <BarChart3 size={18} />
                Full Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="vg-analytics-section">
          <div className="vg-analytics-grid">
            <div className="vg-analytics-card">
              <div className="vg-analytics-icon views">
                <Eye size={24} />
              </div>
              <div className="vg-analytics-content">
                <span className="vg-analytics-label">Profile Views</span>
                <h3 className="vg-analytics-value">{gym.analytics.total_views.toLocaleString()}</h3>
                <span className={`vg-change ${gym.analytics.views_change > 0 ? 'positive' : 'negative'}`}>
                  {gym.analytics.views_change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(gym.analytics.views_change)}% this week
                </span>
              </div>
            </div>

            <div className="vg-analytics-card">
              <div className="vg-analytics-icon members">
                <Users size={24} />
              </div>
              <div className="vg-analytics-content">
                <span className="vg-analytics-label">Active Members</span>
                <h3 className="vg-analytics-value">{gym.analytics.total_members}</h3>
                <span className={`vg-change positive`}>
                  <TrendingUp size={14} />
                  +{gym.analytics.new_members_this_month} this month
                </span>
              </div>
            </div>

            <div className="vg-analytics-card">
              <div className="vg-analytics-icon revenue">
                <DollarSign size={24} />
              </div>
              <div className="vg-analytics-content">
                <span className="vg-analytics-label">Monthly Revenue</span>
                <h3 className="vg-analytics-value">₱{(gym.analytics.revenue_this_month / 1000).toFixed(0)}K</h3>
                <span className={`vg-change ${gym.analytics.revenue_change > 0 ? 'positive' : 'negative'}`}>
                  {gym.analytics.revenue_change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(gym.analytics.revenue_change)}% vs last month
                </span>
              </div>
            </div>

            <div className="vg-analytics-card">
              <div className="vg-analytics-icon rating">
                <Star size={24} />
              </div>
              <div className="vg-analytics-content">
                <span className="vg-analytics-label">Average Rating</span>
                <h3 className="vg-analytics-value">{gym.analytics.avg_rating}/5.0</h3>
                <span className="vg-change positive">
                  {gym.analytics.total_reviews} reviews
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="vg-gallery-section">
          <div className="vg-gallery-main">
            <div className="vg-photo-slider">
              {gym.photos.map((photo, i) => (
                <img 
                  key={i}
                  src={photo} 
                  alt={`${gym.name} - ${i + 1}`}
                  className={`vg-slide ${i === currentPhoto ? 'active' : ''}`}
                />
              ))}
            </div>
            <button className="vg-photo-nav vg-photo-prev" onClick={prevPhoto}>
              <ChevronLeft size={24} />
            </button>
            <button className="vg-photo-nav vg-photo-next" onClick={nextPhoto}>
              <ChevronRight size={24} />
            </button>
            <div className="vg-photo-counter">
              {currentPhoto + 1} / {gym.photos.length}
            </div>
          </div>
          <div className="vg-gallery-thumbs">
            {gym.photos.map((photo, i) => (
              <div
                key={i}
                className={`vg-thumb ${i === currentPhoto ? "active" : ""}`}
                onClick={() => setCurrentPhoto(i)}
              >
                <img src={photo} alt="" />
              </div>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="vg-content-grid">
          
          {/* Main Content */}
          <div className="vg-main-column">
            
            {/* Basic Info */}
            <div className="vg-section-card">
              <h2 className="vg-section-heading">Gym Information</h2>
              <div className="vg-info-block">
                <div className="vg-info-row">
                  <MapPin size={18} className="vg-info-icon" />
                  <div className="vg-info-text">
                    <strong>{gym.address}</strong>
                    <span>{gym.city} • {gym.landmark}</span>
                  </div>
                </div>
                <div className="vg-info-row">
                  <Phone size={18} className="vg-info-icon" />
                  <div className="vg-info-text">
                    <strong>{gym.contact_number}</strong>
                    <span>Contact Number</span>
                  </div>
                </div>
                <div className="vg-info-row">
                  <Mail size={18} className="vg-info-icon" />
                  <div className="vg-info-text">
                    <strong>{gym.email}</strong>
                    <span>Email Address</span>
                  </div>
                </div>
              </div>
              <div className="vg-description-block">
                <label>Description</label>
                <p>{gym.description}</p>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="vg-section-card">
              <h2 className="vg-section-heading">
                <Clock size={20} />
                Operating Hours
              </h2>
              <div className="vg-hours-list">
                {Object.entries(gym.hours).map(([day, hours]) => (
                  <div key={day} className="vg-hour-row">
                    <span className="vg-day">{day}</span>
                    <span className="vg-hours">{hours.open} - {hours.close}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="vg-section-card">
              <h2 className="vg-section-heading">
                <Dumbbell size={20} />
                Equipment ({gym.equipments.length})
              </h2>
              <div className="vg-equipment-showcase">
                {gym.equipments.map((e) => (
                  <div key={e.id} className="vg-equipment-item">
                    <img src={e.image} alt={e.name} />
                    <div className="vg-equipment-info">
                      <strong>{e.name}</strong>
                      <span>{e.quantity} available</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="vg-sidebar-column">

            {/* Recent Members */}
            <div className="vg-section-card">
              <div className="vg-section-header-row">
                <h2 className="vg-section-heading">
                  <Users size={20} />
                  Recent Members
                </h2>
                <Link to="/members" className="vg-view-all">View all</Link>
              </div>
              <div className="vg-members-compact">
                {gym.recent_members.map((member, i) => (
                  <div key={i} className="vg-member-compact">
                    <div className="vg-member-avatar-small">{member.avatar}</div>
                    <div className="vg-member-details">
                      <strong>{member.name}</strong>
                      <span>{member.joined}</span>
                    </div>
                    <span className="vg-member-badge">{member.plan}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="vg-section-card vg-pricing-card">
              <h2 className="vg-section-heading">
                <DollarSign size={20} />
                Membership Plans
              </h2>
              <div className="vg-pricing-options">
                {gym.pricing.day_pass && (
                  <div className="vg-price-option">
                    <span>Day Pass</span>
                    <strong>₱{gym.pricing.day_pass}</strong>
                  </div>
                )}
                {gym.pricing.monthly && (
                  <div className="vg-price-option featured">
                    <span>Monthly</span>
                    <strong>₱{gym.pricing.monthly}</strong>
                  </div>
                )}
                {gym.pricing.quarterly && (
                  <div className="vg-price-option">
                    <span>Quarterly</span>
                    <strong>₱{gym.pricing.quarterly}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            <div className="vg-section-card">
              <h2 className="vg-section-heading">
                <CheckCircle size={20} />
                Amenities
              </h2>
              <div className="vg-amenities-compact">
                {gym.amenities.map((a, i) => (
                  <span key={i} className="vg-amenity-badge">{a}</span>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="vg-section-card">
              <h2 className="vg-section-heading">Quick Actions</h2>
              <div className="vg-quick-actions-list">
                <button className="vg-quick-action">
                  <Download size={18} />
                  <span>Export Data</span>
                </button>
                <button className="vg-quick-action">
                  <Calendar size={18} />
                  <span>Bookings</span>
                </button>
                <button className="vg-quick-action">
                  <Share2 size={18} />
                  <span>Share Gym</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}