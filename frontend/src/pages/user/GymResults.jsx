import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Homestyles.css';

export default function GymResults() {
  const [filters, setFilters] = useState({
    priceRange: 'all',
    rating: 'all',
    amenities: [],
    sortBy: 'recommended'
  });
  
 
  const [likedGyms, setLikedGyms] = useState(new Set());

  
  const gyms = [
    {
      id: 1,
      name: "Iron Core Gym",
      description: "Fully equipped commercial gym with modern machines.",
      price: "₱150/day",
      rating: 4.8,
      reviews: 234,
      location: "Ortigas, Pasig",
      image: "https://via.placeholder.com/400x300",
      amenities: ["AC", "Shower", "Locker", "WiFi"],
      equipment: ["Cardio", "Free Weights", "Machines"]
    },
    {
      id: 2,
      name: "Local Strength Hub",
      description: "Affordable neighborhood gym for daily workouts.",
      price: "₱80/day",
      rating: 4.3,
      reviews: 156,
      location: "Kapitolyo, Pasig",
      image: "https://via.placeholder.com/400x300",
      amenities: ["AC", "Locker"],
      equipment: ["Free Weights", "Machines"]
    },
    {
      id: 3,
      name: "24/7 Power Gym",
      description: "Train anytime with round-the-clock access.",
      price: "₱120/day",
      rating: 4.6,
      reviews: 189,
      location: "Capitol Commons, Pasig",
      image: "https://via.placeholder.com/400x300",
      amenities: ["24/7", "AC", "Shower"],
      equipment: ["Cardio", "Free Weights"]
    },
    {
      id: 4,
      name: "Elite Fitness",
      description: "Premium gym with trainers and classes.",
      price: "₱200/day",
      rating: 4.9,
      reviews: 312,
      location: "Ortigas, Pasig",
      image: "https://via.placeholder.com/400x300",
      amenities: ["AC", "Shower", "Locker", "Pool", "Sauna"],
      equipment: ["Cardio", "Free Weights", "Machines", "Functional"]
    },
    {
      id: 5,
      name: "Budget Burn",
      description: "Low-cost gym with essential equipment.",
      price: "₱50/day",
      rating: 4.0,
      reviews: 98,
      location: "Rosario, Pasig",
      image: "https://via.placeholder.com/400x300",
      amenities: ["Locker"],
      equipment: ["Free Weights", "Machines"]
    },
    {
      id: 6,
      name: "Urban Muscle",
      description: "Stylish gym located in the city center.",
      price: "₱130/day",
      rating: 4.5,
      reviews: 203,
      location: "San Antonio, Pasig",
      image: "https://via.placeholder.com/400x300",
      amenities: ["AC", "Shower", "WiFi"],
      equipment: ["Cardio", "Machines"]
    }
  ];


  const cardRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  const handleSortChange = (e) => {
    setFilters({ ...filters, sortBy: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      priceRange: 'all',
      rating: 'all',
      amenities: [],
      sortBy: 'recommended'
    });
  };

  // Handle like/unlike functionality
  const toggleLike = async (gymId) => {
    const newLikedGyms = new Set(likedGyms);
    
    if (newLikedGyms.has(gymId)) {
     
      newLikedGyms.delete(gymId);

      console.log(`Unliked gym ${gymId}`);
    } else {
      // Like
      newLikedGyms.add(gymId);
   
      console.log(`Liked gym ${gymId}`);
    }
    
    setLikedGyms(newLikedGyms);

    localStorage.setItem('likedGyms', JSON.stringify([...newLikedGyms]));
  };

  useEffect(() => {
    const savedLikes = localStorage.getItem('likedGyms');
    if (savedLikes) {
      setLikedGyms(new Set(JSON.parse(savedLikes)));
    }
    

  }, []);

  return (
    <div className="gym-results-page">
      {/* Header Section */}
      <section className="results-header">
        <div className="container">
          <h1>Gyms Matching Your Preferences</h1>
          <p>Found {gyms.length} gyms in Pasig City</p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="filter-bar">
        <div className="container">
          <div className="filter-controls">
            <div className="filter-group">
              <label>Sort by:</label>
              <select value={filters.sortBy} onChange={handleSortChange}>
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviewed</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Price Range:</label>
              <select 
                value={filters.priceRange} 
                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
              >
                <option value="all">All Prices</option>
                <option value="budget">Under ₱100</option>
                <option value="mid">₱100 - ₱150</option>
                <option value="premium">₱150+</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Minimum Rating:</label>
              <select 
                value={filters.rating} 
                onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              >
                <option value="all">All Ratings</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
              </select>
            </div>

            <button className="clear-filters-btn" onClick={clearFilters}>Clear Filters</button>
          </div>
        </div>
      </section>

      {/* Results Grid */}
      <section className="results-section">
        <div className="container">
          <div className="results-grid">
            {gyms.map((gym, index) => (
              <div
                key={gym.id}
                className="result-card"
                ref={(el) => (cardRefs.current[index] = el)}
              >
                <div className="card-image">
                  <img src={gym.image} alt={gym.name} />
                  <div className="card-badge">{gym.price}</div>
                </div>

                <div className="card-content">
                  <h3>{gym.name}</h3>
                  <p className="gym-location">📍 {gym.location}</p>

                  <div className="gym-rating-row">
                    <span className="rating">⭐ {gym.rating}</span>
                    <span className="reviews">({gym.reviews} reviews)</span>
                  </div>

                  <p className="gym-description">{gym.description}</p>

                  <div className="gym-amenities">
                    {gym.amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="amenity-tag">{amenity}</span>
                    ))}
                    {gym.amenities.length > 3 && (
                      <span className="amenity-tag">+{gym.amenities.length - 3}</span>
                    )}
                  </div>

                  <div className="card-actions">
                    <Link to={`/home/gym/${gym.id}`} className="see-more-btn">
                      View Details
                    </Link>
                    <button 
                      className={`favorite-btn ${likedGyms.has(gym.id) ? 'liked' : ''}`}
                      onClick={() => toggleLike(gym.id)}
                      aria-label={likedGyms.has(gym.id) ? 'Unlike gym' : 'Like gym'}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill={likedGyms.has(gym.id) ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="heart-icon"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="load-more-container">
            <button className="load-more-btn">Load More Gyms</button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Not finding what you're looking for?</h2>
          <p>Refine your search preferences to get better matches</p>
          <Link to="/home/find-gyms" className="cta-btn">Update Preferences</Link>
        </div>
      </section>
    </div>
  );
}