import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Homestyles.css';
import { Dumbbell, Heart, Calendar, Flame } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data - replace with real data from your API
  const userName = "John";
  const stats = {
    gymsVisited: 5,
    favorites: 3,
    workouts: 12,
    calories: 2450
  };

  const featuredGyms = [
    { id: 1, name: "FitZone Ortigas", location: "Ortigas, Pasig", price: "₱100/day", rating: 4.5, image: "https://via.placeholder.com/300x200", amenities: ["AC", "Shower"] },
    { id: 2, name: "PowerHouse Gym", location: "Capitol Commons", price: "₱150/day", rating: 4.8, image: "https://via.placeholder.com/300x200", amenities: ["24/7", "Pool"] },
    { id: 3, name: "Local Fitness Hub", location: "Kapitolyo", price: "₱80/day", rating: 4.3, image: "https://via.placeholder.com/300x200", amenities: ["AC", "Locker"] },
    { id: 4, name: "Elite Fitness Center", location: "Rosario, Pasig", price: "₱120/day", rating: 4.6, image: "https://via.placeholder.com/300x200", amenities: ["Sauna", "AC"] }
  ];

  const recentActivity = [
  { id: 1, date: "Today", gymId: 1, gym: "FitZone Ortigas", workout: "Upper Body" },
  { id: 2, date: "Yesterday", gymId: 2, gym: "PowerHouse Gym", workout: "Cardio" },
  { id: 3, date: "2 days ago", gymId: 3, gym: "Local Fitness Hub", workout: "Leg Day" }
];


  const equipmentCategories = [
    { name: "Cardio Equipment", icon: "🏃", count: 45 },
    { name: "Free Weights", icon: "🏋️", count: 32 },
    { name: "Machines", icon: "⚙️", count: 28 },
    { name: "Functional", icon: "🤸", count: 15 }
  ];

  const topRatedGyms = [
    { name: "Champions Gym", rating: 4.9, reviews: 234 },
    { name: "FitLife Studio", rating: 4.8, reviews: 189 },
    { name: "Muscle Factory", rating: 4.7, reviews: 156 }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome back, {userName}!</h1>
          <p>Track your fitness journey and discover gyms in Pasig City</p>
          
          <div className="search-bar-container">
            <input
              type="text"
              placeholder="Search for gyms, locations, or equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-btn">Search</button>
          </div>
        </div>
      </section>

      {/* Stats Dashboard */}

            <div className="stats-grid">
              <div className="stat-card">
                <Dumbbell className="stat-icon" />
                <div className="stat-number">{stats.gymsVisited}</div>
                <div className="stat-label">Gyms Visited</div>
              </div>

              <div className="stat-card">
                <Heart className="stat-icon" />
                <div className="stat-number">{stats.favorites}</div>
                <div className="stat-label">Saved Gyms</div>
              </div>

              <div className="stat-card">
                <Calendar className="stat-icon" />
                <div className="stat-number">{stats.workouts}</div>
                <div className="stat-label">Workouts</div>
              </div>

              <div className="stat-card">
                <Flame className="stat-icon" />
                <div className="stat-number">{stats.calories}</div>
                <div className="stat-label">Calories Burned</div>
              </div>
            </div>


      {/* Recent Activity */}
      <section className="activity-section">
        <div className="container">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-date">{activity.date}</div>
                <div className="activity-details">
                        <strong>
                          <Link
                            to={`/home/gyms/${activity.gymId}`}
                            className="activity-gym-link"
                          >
                            {activity.gym}
                          </Link>
                       </strong>

                  <span>{activity.workout}</span>
                </div>
                <Link to="#" className="activity-link">View Details →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Categories */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Browse by Equipment</h2>
          <div className="categories-grid">
            {equipmentCategories.map((category, index) => (
              <Link key={index} to="/home/find-gyms" className="category-card">
                <div className="category-icon">{category.icon}</div>
                <h3>{category.name}</h3>
                <p>{category.count} gyms available</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Gyms */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Gyms in Pasig</h2>
            <Link to="/home/find-gyms" className="view-all-link">View All →</Link>
          </div>
          
          <div className="gyms-grid">
            {featuredGyms.map(gym => (
              <div key={gym.id} className="gym-card">
                <img src={gym.image} alt={gym.name} className="gym-image" />
                <div className="gym-info">
                  <h3>{gym.name}</h3>
                  <p className="gym-location">📍 {gym.location}</p>
                  <div className="gym-amenities">
                    {gym.amenities.map((amenity, idx) => (
                      <span key={idx} className="amenity-tag">{amenity}</span>
                    ))}
                  </div>
                  <div className="gym-footer">
                    <div className="gym-price-rating">
                      <span className="gym-price">{gym.price}</span>
                      <span className="gym-rating">⭐ {gym.rating}</span>
                    </div>
                    <button className="gym-view-btn">View Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Section */}
      <section className="top-rated-section">
        <div className="container">
          <h2 className="section-title">Top Rated This Month</h2>
          <div className="top-rated-list">
            {topRatedGyms.map((gym, index) => (
              <div key={index} className="top-rated-item">
                <div className="rating-rank">#{index + 1}</div>
                <div className="rating-info">
                  <h4>{gym.name}</h4>
                  <div className="rating-details">
                    <span className="rating-stars">⭐ {gym.rating}</span>
                    <span className="rating-reviews">({gym.reviews} reviews)</span>
                  </div>
                </div>
                <Link to="#" className="rating-link">View →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* Preferences Section */}
          <section className="cta-section">
            <div className="container">
              <div className="cta-content">
                <h2>Your Gym Preferences</h2>
                <p>
                  Manage your location, budget, and equipment preferences to keep
                  gym results relevant to your training needs.
                </p>
                <Link to="/home/find-gyms" className="cta-btn">
                  Edit Preferences
                </Link>
              </div>
            </div>
          </section>

    </div>
  );
}