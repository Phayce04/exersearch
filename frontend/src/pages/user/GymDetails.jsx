import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "./Homestyles.css";

export default function GymDetails() {
  const gym = {
    id: 1,
    name: "ANYTIME FITNESS",
    tagline: "Your Fitness Journey Starts Here",
    description:
      "A fully equipped commercial gym with modern machines and friendly trainers. Experience top-tier facilities with a welcoming atmosphere designed to help you reach your fitness goals.",
    hours: "Mon – Sun | 6:00 AM – 11:00 PM",
    crowd: 30,
    rating: 4.8,
    reviews: 234,
    price: "₱150/day",
    location: {
      address: "Ortigas Center, Pasig City, Metro Manila",
      lat: 14.5995,
      lng: 120.9842,
    },
    stats: {
      machines: 45,
      members: 250,
      trainers: 6,
    },
    amenities: [
      { icon: "❄️", name: "Air Conditioning" },
      { icon: "🚿", name: "Showers" },
      { icon: "🔒", name: "Lockers" },
      { icon: "📶", name: "WiFi" },
      { icon: "🅿️", name: "Parking" },
      { icon: "🏊", name: "Pool" },
      { icon: "🧖", name: "Sauna" },
      { icon: "☕", name: "Juice Bar" },
    ],
    equipment: [
      "Cardio Machines",
      "Free Weights",
      "Resistance Machines",
      "Functional Training Area",
      "Stretching Zone",
      "Olympic Lifting Platform",
    ],
    images: [
      "/sample.jpg",
      "https://via.placeholder.com/800x600",
      "https://via.placeholder.com/800x600",
      "https://via.placeholder.com/800x600",
    ],
    socialMedia: {
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      phone: "+63 123 456 7890",
      email: "info@anytimefitness.ph",
      tiktok: "https://tiktok.com",
    },
  };

  const [count, setCount] = useState({
    machines: 0,
    members: 0,
    trainers: 0,
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const statsRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Animate stats on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            animateStats();
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const animateStats = () => {
    Object.keys(gym.stats).forEach((key) => {
      let i = 0;
      const target = gym.stats[key];
      const increment = Math.ceil(target / 50);
      const interval = setInterval(() => {
        i += increment;
        if (i >= target) {
          setCount((prev) => ({ ...prev, [key]: target }));
          clearInterval(interval);
        } else {
          setCount((prev) => ({ ...prev, [key]: i }));
        }
      }, 30);
    });
  };

  const openDirection = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        window.open(
          `https://www.google.com/maps/dir/${latitude},${longitude}/${gym.location.lat},${gym.location.lng}`,
          "_blank"
        );
      },
      () => {
        // Fallback if geolocation fails
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${gym.location.lat},${gym.location.lng}`,
          "_blank"
        );
      }
    );
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Backend call to save/remove favorite
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % gym.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + gym.images.length) % gym.images.length
    );
  };

  const getCrowdStatus = (level) => {
    if (level < 30) return "Low";
    if (level < 60) return "Moderate";
    return "Busy";
  };

  return (
    <div className="gym-details-page">
      {/* Hero Section */}
      <section className="gym-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <Link to="/home/results" className="back-link">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Results
          </Link>

          <div className="hero-info">
            <div className="hero-text">
              <h1 className="gym-name">{gym.name}</h1>
              <p className="gym-tagline">{gym.tagline}</p>
              <div className="hero-meta">
                <span className="rating-badge">
                  ⭐ {gym.rating} ({gym.reviews} reviews)
                </span>
                <span className="location-badge">📍 {gym.location.address}</span>
              </div>
            </div>

            <div className="hero-actions">
              <span className="price-tag">{gym.price}</span>
              <button
                className={`favorite-btn-hero ${isLiked ? "liked" : ""}`}
                onClick={toggleLike}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="image-gallery">
          <button className="gallery-nav prev" onClick={prevImage}>
            ‹
          </button>
          <img
            src={gym.images[currentImageIndex]}
            alt={`${gym.name} - Image ${currentImageIndex + 1}`}
            className="gallery-image"
          />
          <button className="gallery-nav next" onClick={nextImage}>
            ›
          </button>
          <div className="gallery-dots">
            {gym.images.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentImageIndex ? "active" : ""}`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="gym-details-container">
        <div className="details-grid">
          {/* Left Column - Main Info */}
          <div className="main-column">
            {/* About Section */}
            <div className="detail-card about-section">
              <h2 className="section-title">About This Gym</h2>
              <p className="gym-description">{gym.description}</p>
            </div>

            {/* Operating Hours */}
            <div className="detail-card hours-section">
              <h2 className="section-title">Operating Hours</h2>
              <div className="hours-info">
                <div className="hours-icon">🕐</div>
                <div className="hours-text">
                  <p className="hours-time">{gym.hours}</p>
                  <span className="hours-status open">Open Now</span>
                </div>
              </div>
            </div>

            {/* Crowd Level */}
            <div className="detail-card crowd-section">
              <h2 className="section-title">Current Crowd Level</h2>
              <div className="crowd-info">
                <div className="crowd-percentage">{gym.crowd}%</div>
                <div className="crowd-details">
                  <div className="crowd-bar-container">
                    <div
                      className="crowd-bar-fill"
                      style={{ width: `${gym.crowd}%` }}
                    />
                  </div>
                  <span className="crowd-status">
                    {getCrowdStatus(gym.crowd)} Traffic
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="detail-card stats-section" ref={statsRef}>
              <h2 className="section-title">Gym Statistics</h2>
              <div className="stats-grid">
                <StatCard
                  icon="🏋️"
                  value={count.machines}
                  label="Machines"
                  color="orange"
                />
                <StatCard
                  icon="👥"
                  value={count.members}
                  label="Members"
                  color="blue"
                />
                <StatCard
                  icon="🎯"
                  value={count.trainers}
                  label="Trainers"
                  color="green"
                />
              </div>
            </div>

            {/* Amenities */}
            <div className="detail-card amenities-section">
              <h2 className="section-title">Amenities & Features</h2>
              <div className="amenities-grid">
                {gym.amenities.map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    <span className="amenity-icon">{amenity.icon}</span>
                    <span className="amenity-name">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="detail-card equipment-section">
              <h2 className="section-title">Available Equipment</h2>
              <div className="equipment-list">
                {gym.equipment.map((item, index) => (
                  <div key={index} className="equipment-item">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Map & Actions */}
          <div className="sidebar-column">
            {/* Map Card */}
            <div className="detail-card map-card">
              <h2 className="section-title">Location</h2>
              <div className="map-container">
                <iframe
                  title="Gym Location Map"
                  className="gym-map"
                  src={`https://maps.google.com/maps?q=${gym.location.lat},${gym.location.lng}&z=15&output=embed`}
                  loading="lazy"
                />
              </div>
              <p className="map-address">📍 {gym.location.address}</p>
              <button className="direction-btn" onClick={openDirection}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
                </svg>
                Get Directions
              </button>
            </div>

            {/* Quick Actions */}
            <div className="detail-card actions-card">
              <h2 className="section-title">Quick Actions</h2>
              <div className="action-buttons">
                <button className="action-btn primary">
                  <span className="action-icon">🎫</span>
                  Get Membership
                </button>
                <button className="action-btn secondary">
                  <span className="action-icon">🍎</span>
                  Create Meal Plan
                </button>
                <button className="action-btn secondary">
                  <span className="action-icon">💪</span>
                  Exercise Plan
                </button>
                <button className="action-btn secondary">
                  <span className="action-icon">📅</span>
                  Book a Trainer
                </button>
              </div>
            </div>

            {/* Contact & Social */}
            <div className="detail-card contact-card">
              <h2 className="section-title">Get in Touch</h2>
              <div className="social-links">
                <a
                  href={gym.socialMedia.facebook}
                  className="social-link facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fa-brands fa-facebook-f" />
                </a>
                <a
                  href={gym.socialMedia.instagram}
                  className="social-link instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fa-brands fa-instagram" />
                </a>
                <a
                  href={`tel:${gym.socialMedia.phone}`}
                  className="social-link phone"
                >
                  <i className="fa-solid fa-phone" />
                </a>
                <a
                  href={`mailto:${gym.socialMedia.email}`}
                  className="social-link email"
                >
                  <i className="fa-solid fa-envelope" />
                </a>
                <a
                  href={gym.socialMedia.tiktok}
                  className="social-link tiktok"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fa-brands fa-tiktok" />
                </a>
              </div>
              <div className="contact-info">
                <p>
                  <strong>Phone:</strong> {gym.socialMedia.phone}
                </p>
                <p>
                  <strong>Email:</strong> {gym.socialMedia.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, value, label, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-value">{value}+</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}