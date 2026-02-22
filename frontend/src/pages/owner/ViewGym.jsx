// src/pages/owner/ViewGym.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "../user/Header-user";
import Footer from "../user/Footer";
import "./ViewGym.css";
import {
  MapPin,
  Clock,
  DollarSign,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Edit,
  BarChart3,
  Phone,
  Mail,
  CheckCircle,
  Star,
  Users,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  ToggleLeft,
  ToggleRight,
  BadgeCheck,
  ExternalLink,
  Copy,
  Share2,
  Plus,
  Download,
} from "lucide-react";

import AddEquipment from "./AddEquip";
import UpdateEquipment from "./UpdateEquip";
import UpdateAmenities from "./UpdateAmenities";
import "./Modals.css";

import {
  getGym,
  updateGymEquipment,
  deleteGymEquipment,
  // ✅ add this util below in the same file you shared
  getGymAnalytics,
} from "../../utils/ownerGymApi";

import { normalizeGymResponse } from "../../utils/gymViewUtils";

export default function ViewGym() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [visibility, setVisibility] = useState(true);

  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showUpdateEquipment, setShowUpdateEquipment] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showUpdateAmenities, setShowUpdateAmenities] = useState(false);

  const safePhotos = useMemo(() => {
    const p = gym?.photos ?? [];
    return p.length
      ? p
      : ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80"];
  }, [gym]);

  const enrichGymWithAnalytics = (normalized, analytics) => {
    // normalized.analytics might already exist (mock), we override with real API values
    const a = analytics || {};
    return {
      ...normalized,
      analytics: {
        ...(normalized.analytics || {}),
        total_views: a.total_views ?? normalized?.analytics?.total_views ?? 0,
        views_change: a.views_change ?? normalized?.analytics?.views_change ?? 0,
        total_saves: a.total_saves ?? normalized?.analytics?.total_saves ?? 0,
        saves_change: a.saves_change ?? normalized?.analytics?.saves_change ?? 0,
        // keep any other fields you might already have:
        total_members: normalized?.analytics?.total_members ?? 0,
        new_members_this_month: normalized?.analytics?.new_members_this_month ?? 0,
        avg_rating: normalized?.analytics?.avg_rating ?? 0,
        total_reviews: normalized?.analytics?.total_reviews ?? 0,
      },
    };
  };

  const refreshGym = async () => {
    const res = await getGym(id);
    const normalized = normalizeGymResponse(res);

    // ✅ pull analytics from backend
    let stats = null;
    try {
      stats = await getGymAnalytics(id);
    } catch (e) {
      // don’t break page if analytics endpoint fails
      stats = null;
    }

    const merged = enrichGymWithAnalytics(normalized, stats);

    setGym(merged);
    setVisibility(Boolean(merged.visibility));
    setCurrentPhoto(0);
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const res = await getGym(id);
        if (!alive) return;

        const normalized = normalizeGymResponse(res);

        let stats = null;
        try {
          stats = await getGymAnalytics(id);
        } catch (e) {
          stats = null;
        }

        const merged = enrichGymWithAnalytics(normalized, stats);

        setGym(merged);
        setVisibility(Boolean(merged.visibility));
        setCurrentPhoto(0);
      } catch (err) {
        if (!alive) return;
        setGym(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  // Auto-advance photos
  useEffect(() => {
    if (!safePhotos.length) return;
    const interval = setInterval(() => {
      setCurrentPhoto((p) => (p + 1) % safePhotos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [safePhotos.length]);

  const nextPhoto = () => setCurrentPhoto((p) => (p + 1) % safePhotos.length);
  const prevPhoto = () => setCurrentPhoto((p) => (p - 1 + safePhotos.length) % safePhotos.length);

  const toggleVisibility = () => setVisibility((v) => !v);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    } catch {
      alert("Failed to copy link.");
    }
  };

  // Equipment handlers
  const handleAddEquipmentSuccess = async () => {
    setShowAddEquipment(false);
    await refreshGym();
  };

  const handleUpdateEquipmentClick = (equipment) => {
    setSelectedEquipment(equipment);
    setShowUpdateEquipment(true);
  };

  const handleUpdateEquipmentSuccess = async (updatedEquipment) => {
    if (!gym) return;

    const gymId = gym.gym_id;
    const equipmentId = updatedEquipment?.equipment_id ?? updatedEquipment?.id;

    const payload = {};
    if (updatedEquipment?.pivot?.quantity != null) payload.quantity = updatedEquipment.pivot.quantity;
    if (updatedEquipment?.pivot?.status != null) payload.status = updatedEquipment.pivot.status;
    if (updatedEquipment?.pivot?.date_purchased != null) payload.date_purchased = updatedEquipment.pivot.date_purchased;
    if (updatedEquipment?.pivot?.last_maintenance != null) payload.last_maintenance = updatedEquipment.pivot.last_maintenance;
    if (updatedEquipment?.pivot?.next_maintenance != null) payload.next_maintenance = updatedEquipment.pivot.next_maintenance;

    await updateGymEquipment(gymId, equipmentId, payload);

    setShowUpdateEquipment(false);
    setSelectedEquipment(null);
    await refreshGym();
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (!gym) return;
    await deleteGymEquipment(gym.gym_id, equipmentId);
    setShowUpdateEquipment(false);
    setSelectedEquipment(null);
    await refreshGym();
  };

  // Amenities handlers
  const handleUpdateAmenitiesSuccess = async () => {
    setShowUpdateAmenities(false);
    await refreshGym();
  };

  if (loading) {
    return (
      <div className="vg-app">
        <Header />
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
        <Header />
        <div className="vg-error">Gym not found</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="vg-app">
      <Header />

      <div className="vg-container">
        {/* Floating Action Button */}
        <div className="vg-fab-container">
          <Link to={`/owner/edit-gym/${gym.gym_id}`} className="vg-fab">
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
                  {gym.status === "active" && <CheckCircle size={14} />}
                  {gym.status}
                </span>

                {gym.verified && (
                  <span className="vg-verified-badge">
                    <BadgeCheck size={14} /> Verified
                  </span>
                )}

                <button
                  className={`vg-visibility-toggle ${visibility ? "visible" : "hidden"}`}
                  onClick={toggleVisibility}
                  type="button"
                >
                  {visibility ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {visibility ? "Live" : "Hidden"}
                </button>
              </div>
            </div>

            <div className="vg-header-actions">
              <button className="vg-action-btn-ghost" onClick={copyLink} type="button">
                <Copy size={18} />
                Copy Link
              </button>
              <button className="vg-action-btn-ghost" type="button">
                <ExternalLink size={18} />
                Preview
              </button>
              <Link to={`/owner/view-stats/${gym.gym_id}`} className="vg-action-btn-primary">
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
                <h3 className="vg-analytics-value">
                  {Number(gym.analytics?.total_views || 0).toLocaleString()}
                </h3>
                <span className={`vg-change ${(gym.analytics?.views_change || 0) > 0 ? "positive" : "negative"}`}>
                  {(gym.analytics?.views_change || 0) > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(gym.analytics?.views_change || 0)}% this week
                </span>
              </div>
            </div>

            <div className="vg-analytics-card">
              <div className="vg-analytics-icon members">
                <Users size={24} />
              </div>
              <div className="vg-analytics-content">
                <span className="vg-analytics-label">Active Members</span>
                <h3 className="vg-analytics-value">{gym.analytics?.total_members || 0}</h3>
                <span className="vg-change positive">
                  <TrendingUp size={14} />+{gym.analytics?.new_members_this_month || 0} this month
                </span>
              </div>
            </div>

            {/* ✅ CHANGED: Monthly Revenue -> Gym Saved */}
            <div className="vg-analytics-card">
              <div className="vg-analytics-icon revenue">
                <Star size={24} />
              </div>
              <div className="vg-analytics-content">
                <span className="vg-analytics-label">Gym Saved</span>
                <h3 className="vg-analytics-value">
                  {Number(gym.analytics?.total_saves || 0).toLocaleString()}
                </h3>
                <span className={`vg-change ${(gym.analytics?.saves_change || 0) > 0 ? "positive" : "negative"}`}>
                  {(gym.analytics?.saves_change || 0) > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(gym.analytics?.saves_change || 0)}% vs last month
                </span>
              </div>
            </div>

            <div className="vg-analytics-card">
              <div className="vg-analytics-icon rating">
                <Star size={24} />
              </div>
              <div className="vg-analytics-content">
                <span className="vg-analytics-label">Average Rating</span>
                <h3 className="vg-analytics-value">{gym.analytics?.avg_rating || 0}/5.0</h3>
                <span className="vg-change positive">{gym.analytics?.total_reviews || 0} reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        <div className="vg-gallery-section">
          <div className="vg-gallery-main">
            <div className="vg-photo-slider">
              {safePhotos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`${gym.name} - ${i + 1}`}
                  className={`vg-slide ${i === currentPhoto ? "active" : ""}`}
                />
              ))}
            </div>

            <button className="vg-photo-nav vg-photo-prev" onClick={prevPhoto} type="button">
              <ChevronLeft size={24} />
            </button>
            <button className="vg-photo-nav vg-photo-next" onClick={nextPhoto} type="button">
              <ChevronRight size={24} />
            </button>

            <div className="vg-photo-counter">
              {currentPhoto + 1} / {safePhotos.length}
            </div>
          </div>

          <div className="vg-gallery-thumbs">
            {safePhotos.map((photo, i) => (
              <div
                key={i}
                className={`vg-thumb ${i === currentPhoto ? "active" : ""}`}
                onClick={() => setCurrentPhoto(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setCurrentPhoto(i);
                }}
              >
                <img src={photo} alt="" />
              </div>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="vg-content-grid">
          {/* Main */}
          <div className="vg-main-column">
            <div className="vg-section-card">
              <h2 className="vg-section-heading">Gym Information</h2>

              <div className="vg-info-block">
                <div className="vg-info-row">
                  <MapPin size={18} className="vg-info-icon" />
                  <div className="vg-info-text">
                    <strong>{gym.address}</strong>
                    <span>
                      {gym.city} • {gym.landmark}
                    </span>
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
                {Object.entries(gym.hours || {}).map(([day, hrs]) => (
                  <div key={day} className="vg-hour-row">
                    <span className="vg-day">{day}</span>
                    <span className="vg-hours">
                      {hrs?.open} – {hrs?.close}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="vg-section-card">
              <div className="vg-section-header-row">
                <h2 className="vg-section-heading">
                  <Dumbbell size={20} />
                  Equipment ({Array.isArray(gym.equipments) ? gym.equipments.length : 0})
                </h2>

                <button className="vg-add-btn" onClick={() => setShowAddEquipment(true)} type="button">
                  <Plus size={16} /> Add Equipment
                </button>
              </div>

              <div className="vg-equipment-showcase">
                {Array.isArray(gym.equipments) && gym.equipments.length > 0 ? (
                  gym.equipments.map((e) => (
                    <div
                      key={e.equipment_id}
                      className="vg-equipment-item clickable"
                      onClick={() => handleUpdateEquipmentClick(e)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") handleUpdateEquipmentClick(e);
                      }}
                    >
                      <img
                        src={
                          e.image_url ||
                          "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80"
                        }
                        alt={e.name}
                      />
                      <div className="vg-equipment-info">
                        <strong>{e.name}</strong>
                        <span>{e.pivot?.quantity ?? 0} available</span>
                      </div>
                      <div className="vg-equipment-edit-overlay">
                        <Edit size={16} />
                        Click to edit
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="vg-empty-state">No equipment added yet</div>
                )}
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
                <Link to="/members" className="vg-view-all">
                  View all
                </Link>
              </div>

              <div className="vg-members-compact">
                {Array.isArray(gym.recent_members) && gym.recent_members.length > 0 ? (
                  gym.recent_members.map((member, i) => (
                    <div key={i} className="vg-member-compact">
                      <div className="vg-member-avatar-small">{member.avatar}</div>
                      <div className="vg-member-details">
                        <strong>{member.name}</strong>
                        <span>{member.joined}</span>
                      </div>
                      <span className="vg-member-badge">{member.plan}</span>
                    </div>
                  ))
                ) : (
                  <div className="vg-empty-state">No members yet</div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="vg-section-card vg-pricing-card">
              <h2 className="vg-section-heading">
                <DollarSign size={20} />
                Pricing
              </h2>

              <div className="vg-pricing-options">
                {gym?.pricing?.day_pass != null && (
                  <div className="vg-price-option">
                    <span>Day Pass</span>
                    <strong>₱{gym.pricing.day_pass}</strong>
                  </div>
                )}
                {gym?.pricing?.monthly != null && (
                  <div className="vg-price-option featured">
                    <span>Monthly</span>
                    <strong>₱{gym.pricing.monthly}</strong>
                  </div>
                )}
                {gym?.pricing?.quarterly != null && (
                  <div className="vg-price-option">
                    <span>Quarterly</span>
                    <strong>₱{gym.pricing.quarterly}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            <div className="vg-section-card">
              <div className="vg-section-header-row">
                <h2 className="vg-section-heading">
                  <CheckCircle size={20} />
                  Amenities
                </h2>
                <button className="vg-edit-btn-small" onClick={() => setShowUpdateAmenities(true)} type="button">
                  <Edit size={14} /> Edit
                </button>
              </div>

              <div className="vg-amenities-compact">
                {Array.isArray(gym.amenities) && gym.amenities.length > 0 ? (
                  gym.amenities.map((a) => (
                    <span key={a.amenity_id} className="vg-amenity-badge">
                      {a.name}
                    </span>
                  ))
                ) : (
                  <div className="vg-empty-state">No amenities yet</div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="vg-section-card">
              <h2 className="vg-section-heading">Quick Actions</h2>
              <div className="vg-quick-actions-list">
                <button className="vg-quick-action" type="button">
                  <Download size={18} />
                  <span>Export Data</span>
                </button>
                <button className="vg-quick-action" type="button">
                  <Calendar size={18} />
                  <span>Bookings</span>
                </button>
                <button className="vg-quick-action" type="button">
                  <Share2 size={18} />
                  <span>Share Gym</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* MODALS */}
      {showAddEquipment && (
        <AddEquipment
          gymId={gym.gym_id}
          onClose={() => setShowAddEquipment(false)}
          onSuccess={handleAddEquipmentSuccess}
        />
      )}

      {showUpdateEquipment && selectedEquipment && (
        <UpdateEquipment
          equipment={selectedEquipment}
          onClose={() => {
            setShowUpdateEquipment(false);
            setSelectedEquipment(null);
          }}
          onSuccess={handleUpdateEquipmentSuccess}
          onDelete={handleDeleteEquipment}
        />
      )}

      {showUpdateAmenities && (
        <UpdateAmenities
          gymId={gym.gym_id}
          existingAmenities={gym.amenities} // ✅ objects
          onClose={() => setShowUpdateAmenities(false)}
          onSuccess={handleUpdateAmenitiesSuccess}
        />
      )}
    </div>
  );
}