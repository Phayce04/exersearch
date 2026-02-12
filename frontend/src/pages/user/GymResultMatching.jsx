import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GymRes-Matching.css';

export default function GymResultsMatching() {
  const [likedGyms, setLikedGyms] = useState(new Set());
  
  // Mock user preferences - replace with actual data from FindGyms
  const userPreferences = {
    budget: 150,
    location: { lat: 14.5764, lng: 121.0851 }, // User's location
    amenities: ['AC', 'Shower', 'Locker'],
    equipment: ['Cardio', 'Free Weights', 'Machines']
  };

  // Mock gym data with matching scores - replace with API data
  const [gyms, setGyms] = useState([
    {
      id: 1,
      name: "Elite Fitness Center",
      location: "Ortigas, Pasig",
      coordinates: { lat: 14.5865, lng: 121.0569 },
      price: 200,
      rating: 4.9,
      reviews: 312,
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop",
      amenities: ['AC', 'Shower', 'Locker', 'Pool', 'Sauna'],
      equipment: ['Cardio', 'Free Weights', 'Machines', 'Functional'],
      hours: "24/7",
      description: "Premium gym with state-of-the-art equipment and professional trainers."
    },
    {
      id: 2,
      name: "FitZone Ortigas",
      location: "Ortigas Avenue, Pasig",
      coordinates: { lat: 14.5823, lng: 121.0631 },
      price: 100,
      rating: 4.5,
      reviews: 234,
      image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=400&fit=crop",
      amenities: ['AC', 'Shower', 'WiFi'],
      equipment: ['Cardio', 'Free Weights', 'Machines'],
      hours: "5AM - 11PM",
      description: "Well-equipped commercial gym with modern machines and friendly staff."
    },
    {
      id: 3,
      name: "Local Strength Hub",
      location: "Kapitolyo, Pasig",
      coordinates: { lat: 14.5667, lng: 121.0631 },
      price: 80,
      rating: 4.3,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=400&fit=crop",
      amenities: ['AC', 'Locker'],
      equipment: ['Free Weights', 'Machines'],
      hours: "6AM - 10PM",
      description: "Affordable neighborhood gym perfect for daily workouts."
    },
    {
      id: 4,
      name: "PowerHouse Gym",
      location: "Capitol Commons, Pasig",
      coordinates: { lat: 14.5750, lng: 121.0518 },
      price: 150,
      rating: 4.8,
      reviews: 189,
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop",
      amenities: ['24/7', 'AC', 'Shower', 'Locker'],
      equipment: ['Cardio', 'Free Weights', 'Machines'],
      hours: "24/7",
      description: "Train anytime with round-the-clock access and premium facilities."
    }
  ]);

  // Calculate match percentage
  const calculateMatch = (gym) => {
    let totalScore = 0;
    let maxScore = 0;

    // Amenities match (40%)
    const amenitiesMatch = userPreferences.amenities.filter(a => 
      gym.amenities.includes(a)
    ).length;
    const amenitiesScore = (amenitiesMatch / userPreferences.amenities.length) * 40;
    totalScore += amenitiesScore;
    maxScore += 40;

    // Equipment match (40%)
    const equipmentMatch = userPreferences.equipment.filter(e => 
      gym.equipment.includes(e)
    ).length;
    const equipmentScore = (equipmentMatch / userPreferences.equipment.length) * 40;
    totalScore += equipmentScore;
    maxScore += 40;

    // Budget match (20%)
    const budgetDiff = Math.abs(gym.price - userPreferences.budget);
    const budgetScore = budgetDiff <= 50 ? 20 : budgetDiff <= 100 ? 10 : 0;
    totalScore += budgetScore;
    maxScore += 20;

    return Math.round((totalScore / maxScore) * 100);
  };

  // Calculate distance (simplified - use actual distance calculation)
  const calculateDistance = (gymCoords) => {
    const R = 6371; // Earth's radius in km
    const dLat = (gymCoords.lat - userPreferences.location.lat) * Math.PI / 180;
    const dLng = (gymCoords.lng - userPreferences.location.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userPreferences.location.lat * Math.PI / 180) * 
      Math.cos(gymCoords.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  // Sort gyms by match percentage
  const sortedGyms = [...gyms].sort((a, b) => 
    calculateMatch(b) - calculateMatch(a)
  );

  // Handle like/unlike functionality
  const toggleLike = async (gymId) => {
    const newLikedGyms = new Set(likedGyms);
    
    if (newLikedGyms.has(gymId)) {
      newLikedGyms.delete(gymId);
      console.log(`Unliked gym ${gymId}`);
    } else {
      newLikedGyms.add(gymId);
      console.log(`Liked gym ${gymId}`);
    }
    
    setLikedGyms(newLikedGyms);
    localStorage.setItem('likedGyms', JSON.stringify([...newLikedGyms]));
  };

  // Load liked gyms from localStorage on mount
  useEffect(() => {
    const savedLikes = localStorage.getItem('likedGyms');
    if (savedLikes) {
      setLikedGyms(new Set(JSON.parse(savedLikes)));
    }
  }, []);

  return (
    <div className="matching-results-page">
      {/* Header */}
      <section className="matching-header">
        <div className="container">
          <h1>Your Best Matches</h1>
          <p>Gyms ranked by how well they match your preferences</p>
        </div>
      </section>

      {/* Results List */}
      <section className="matching-results">
        <div className="container">
          <div className="results-list">
            {sortedGyms.map((gym) => {
              const matchPercentage = calculateMatch(gym);
              const distance = calculateDistance(gym.coordinates);
              const isOverBudget = gym.price > userPreferences.budget;

              return (
                <div key={gym.id} className="match-card">
                  <div className="match-card-inner">
                    {/* Left: Image */}
                    <div className="match-image">
                      <img src={gym.image} alt={gym.name} />
                      <div className="rank-badge">#{sortedGyms.indexOf(gym) + 1}</div>
                      <div className="match-badge">
                        <div className="match-percentage">{matchPercentage}%</div>
                        <div className="match-label">Match</div>
                      </div>
                    </div>

                    {/* Right: Details */}
                    <div className="match-details">
                      <div className="match-header">
                        <div>
                          <h2>{gym.name}</h2>
                          <p className="gym-location">📍 {gym.location}</p>
                        </div>
                        <div className="gym-rating">
                          <span className="rating-stars">⭐ {gym.rating}</span>
                          <span className="rating-count">({gym.reviews})</span>
                        </div>
                      </div>

                      {/* Quick Info Pills */}
                      <div className="quick-info">
                        <div className="info-pill distance">
                          <span className="info-pill-icon">📍</span>
                          <span>{distance} km away</span>
                        </div>
                        <div className={`info-pill price ${isOverBudget ? 'over-budget' : 'in-budget'}`}>
                          <span className="info-pill-icon">💰</span>
                          <span>₱{gym.price}/day {isOverBudget ? '(Over)' : '(Good)'}</span>
                        </div>
                        <div className="info-pill hours">
                          <span className="info-pill-icon">🕐</span>
                          <span>{gym.hours}</span>
                        </div>
                      </div>

                      {/* Match Breakdown with Bars */}
                      <div className="match-breakdown">
                        <div className="breakdown-title">Match Breakdown</div>
                        <div className="breakdown-bars">
                          <div className="breakdown-bar-item">
                            <span className="breakdown-bar-label">Amenities</span>
                            <div className="breakdown-bar-container">
                              <div 
                                className="breakdown-bar-fill" 
                                style={{ 
                                  width: `${(userPreferences.amenities.filter(a => gym.amenities.includes(a)).length / userPreferences.amenities.length) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="breakdown-bar-value">
                              {userPreferences.amenities.filter(a => gym.amenities.includes(a)).length}/{userPreferences.amenities.length}
                            </span>
                          </div>
                          <div className="breakdown-bar-item">
                            <span className="breakdown-bar-label">Equipment</span>
                            <div className="breakdown-bar-container">
                              <div 
                                className="breakdown-bar-fill" 
                                style={{ 
                                  width: `${(userPreferences.equipment.filter(e => gym.equipment.includes(e)).length / userPreferences.equipment.length) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="breakdown-bar-value">
                              {userPreferences.equipment.filter(e => gym.equipment.includes(e)).length}/{userPreferences.equipment.length}
                            </span>
                          </div>
                          <div className="breakdown-bar-item">
                            <span className="breakdown-bar-label">Budget</span>
                            <div className="breakdown-bar-container">
                              <div 
                                className="breakdown-bar-fill" 
                                style={{ 
                                  width: `${isOverBudget ? 50 : 100}%` 
                                }}
                              />
                            </div>
                            <span className="breakdown-bar-value">
                              {isOverBudget ? '50%' : '100%'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="features-section">
                        <div className="features-group">
                          <h4>Amenities ({gym.amenities.length})</h4>
                          <div className="features-tags">
                            {gym.amenities.map((amenity, idx) => (
                              <span 
                                key={idx} 
                                className={`feature-tag ${userPreferences.amenities.includes(amenity) ? 'matched' : ''}`}
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="features-group">
                          <h4>Equipment ({gym.equipment.length})</h4>
                          <div className="features-tags">
                            {gym.equipment.map((equip, idx) => (
                              <span 
                                key={idx} 
                                className={`feature-tag ${userPreferences.equipment.includes(equip) ? 'matched' : ''}`}
                              >
                                {equip}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="match-actions">
                        <Link to={`/home/gym/${gym.id}`} className="view-details-btn">
                          View Full Details
                        </Link>
                        <button 
                          className={`favorite-btn-small ${likedGyms.has(gym.id) ? 'liked' : ''}`}
                          onClick={() => toggleLike(gym.id)}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill={likedGyms.has(gym.id) ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                          {likedGyms.has(gym.id) ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}