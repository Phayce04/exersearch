import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Homestyles.css';
// naka test lang route  neto sa appjsx 

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function FindGyms() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState({});
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pinLocation, setPinLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([14.5764, 121.0851]);
  const [mapKey, setMapKey] = useState(0); // Force map re-render

  const sections = [
    "Location",
    "Budget",
    "Amenities",
    "Gym Types",
    "Upper Body Machines",
    "Free Weights – Upper Body",
    "Lower Body Machines",
    "Free Weights – Lower Body"
  ];

  const sectionData = {
    "Budget": [
      "₱50 and below",
      "₱100 and below",
      "₱200",
      "₱300",
      "₱500 and above"
    ],
    "Amenities": [
      "Air-conditioned",
      "Shower Rooms",
      "Locker Room",
      "Lounge Area",
      "Comfort Room",
      "Drinking Water"
    ],
    "Gym Types": [
      "Commercial Gym - Large gym with full equipment",
      "Local Gym - Small neighborhood gym",
      "24-Hour Gym - Open anytime",
      "Budget Gym - Affordable rates",
      "Franchise Gym - Branded gym"
    ],
    "Upper Body Machines": [
      { text: "Chest Press Machine", img: "111.png" },
      { text: "Pec Deck (Chest Fly)", img: "222.png" },
      { text: "Incline Chest Press", img: "333.png" },
      { text: "Decline Chest Press", img: "444.png" },
      { text: "Cable Crossover", img: null },
      { text: "Assisted Dip Machine", img: null },
      { text: "Shoulder Press Machine", img: null },
      { text: "Lateral Raise Machine", img: null },
      { text: "Rear Delt Fly Machine", img: null },
      { text: "Upright Row Machine", img: null }
    ],
    "Free Weights – Upper Body": [
      { text: "Dumbbells", img: null },
      { text: "Barbells", img: null },
      { text: "EZ Curl Bar", img: null },
      { text: "Adjustable Bench", img: null },
      { text: "Flat Bench", img: null },
      { text: "Incline Bench", img: null },
      { text: "Decline Bench", img: null },
      { text: "Kettlebells", img: null },
      { text: "Medicine Ball", img: null }
    ],
    "Lower Body Machines": [
      { text: "Leg Press Machine", img: null },
      { text: "Hack Squat Machine", img: null },
      { text: "Pendulum Squat Machine", img: null },
      { text: "Leg Extension Machine", img: null },
      { text: "Seated Leg Curl Machine", img: null },
      { text: "Lying Leg Curl Machine", img: null },
      { text: "Standing Leg Curl Machine", img: null },
      { text: "Hip Abductor Machine", img: null },
      { text: "Hip Adductor Machine", img: null },
      { text: "Glute Kickback Machine", img: null },
      { text: "Standing Calf Raise Machine", img: null },
      { text: "Seated Calf Raise Machine", img: null }
    ],
    "Free Weights – Lower Body": [
      { text: "Barbells", img: null },
      { text: "Dumbbells", img: null },
      { text: "Weight Plates", img: null },
      { text: "Hex Bar (Trap Bar)", img: null },
      { text: "Safety Squat Bar", img: null },
      { text: "Resistance Bands", img: null }
    ]
  };

  const openModal = () => {
    setIsModalOpen(true);
    setCurrentStep(0);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextStep = () => {
    if (currentStep < sections.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

 const addSelected = (value) => {
  // If it's a location, remove any previous location entries first
  if (value.startsWith('Location:')) {
    const newSelected = {};
    // Keep all non-location items
    Object.keys(selectedItems).forEach(key => {
      if (!key.startsWith('Location:')) {
        newSelected[key] = true;
      }
    });
    // Add the new location
    newSelected[value] = true;
    setSelectedItems(newSelected);
  } else {
    // For other items, add normally (allow multiple)
    if (!selectedItems[value]) {
      setSelectedItems({ ...selectedItems, [value]: true });
    }
  }
};

  const removeSelected = (value) => {
    const newSelected = { ...selectedItems };
    delete newSelected[value];
    setSelectedItems(newSelected);
  };

  const handleApply = () => {
    console.log('Applied preferences:', selectedItems);
    console.log('Location:', locationInput);
    console.log('Pin Location:', pinLocation);
    // Add your apply logic here
    closeModal();
  };

  const handleLocationInput = async (value) => {
  setLocationInput(value);
  
  if (value.length > 2) {
    try {
      
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(value + ' Pasig')}&limit=15&lang=en&lon=121.0851&lat=14.5764`
      );
      const data = await response.json();
      
      console.log('Suggestions:', data.features); //consol
      
      // Filter for Pasig results and format them
      const pasigResults = data.features
        .filter(f => {
          const props = f.properties;
          return props.city === 'Pasig' || 
                 props.city === 'Pasig City' ||
                 props.district === 'Pasig' ||
                 (props.state && props.state.includes('Metro Manila'));
        })
        .map(f => ({
          display_name: `${f.properties.name || f.properties.street || ''}, ${f.properties.city || 'Pasig'}, Philippines`,
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0]
        }));
      
      setLocationSuggestions(pasigResults);
      setShowSuggestions(pasigResults.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  } else {
    setLocationSuggestions([]);
    setShowSuggestions(false);
  }
};

  const selectSuggestion = (suggestion) => {
  setLocationInput(suggestion.display_name);
  setShowSuggestions(false);
  addSelected(`Location: ${suggestion.display_name}`);
  
  // Update map center and pin
  if (suggestion.lat && suggestion.lon) {
    const newLocation = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
    setPinLocation(newLocation);
    setMapCenter(newLocation);
    setMapKey(prev => prev + 1); // Force map to update
  }
};

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setPinLocation([lat, lng]);
          setMapCenter([lat, lng]);
          setMapKey(prev => prev + 1);
          
          // Reverse geocode to get address
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(res => res.json())
            .then(data => {
              setLocationInput(data.display_name || `${lat}, ${lng}`);
              addSelected(`Location: ${data.display_name || `${lat}, ${lng}`}`);
            })
            .catch(() => {
              setLocationInput(`${lat}, ${lng}`);
              addSelected(`Location: ${lat}, ${lng}`);
            });
        },
        (error) => {
          alert('Unable to get your location. Please enter manually.');
          console.error(error);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const searchLocation = () => {
    if (locationInput.trim()) {
      addSelected(`Location: ${locationInput}`);
    }
  };

  // Location Marker Component for map clicks
  function LocationMarker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPinLocation([lat, lng]);
        
        // Reverse geocode to get address
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(res => res.json())
          .then(data => {
            setLocationInput(data.display_name || `${lat}, ${lng}`);
            addSelected(`Location: ${data.display_name || `${lat}, ${lng}`}`);
          })
          .catch(() => {
            setLocationInput(`${lat}, ${lng}`);
            addSelected(`Location: ${lat}, ${lng}`);
          });
      },
    });

    return pinLocation ? <Marker position={pinLocation} /> : null;
  }

  const renderLeftPanel = () => {
    const currentSection = sections[currentStep];

    if (currentSection === "Location") {
      return (
        <div className="location-section">
          <p className="section-title">Set your location:</p>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-box"
                placeholder="Enter your address in Pasig City"
                value={locationInput}
                onChange={(e) => handleLocationInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    searchLocation();
                    setShowSuggestions(false);
                  }
                }}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <button 
                className="location-btn"
                onClick={() => {
                  searchLocation();
                  setShowSuggestions(false);
                }}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: '#ff8c00', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold' 
                }}
              >
                Search
              </button>
            </div>
            
            {/* Suggestions Dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: '140px',
                background: 'white',
                border: '2px solid #ff8c00',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                {locationSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectSuggestion(suggestion)}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      fontSize: '0.9rem'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#fff5e6'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    {suggestion.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className="location-btn"
            onClick={getCurrentLocation}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              background: '#ff8c00', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              marginBottom: '1rem', 
              fontWeight: 'bold' 
            }}
          >
            📍 Use My Current Location
          </button>
          
          <div style={{ height: '400px', marginTop: '1rem', border: '2px solid #ff8c00', borderRadius: '4px', overflow: 'hidden' }}>
            <MapContainer
                key={mapKey} // Forces re-render when location changes
                center={mapCenter}
                zoom={16} // Closer zoom when location is selected
                style={{ height: '100%', width: '100%' }}
                >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <LocationMarker />
                </MapContainer>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', fontStyle: 'normal' }}>
               Click anywhere on the map to pin your location
          </p>
        </div>
      );
    }

    const options = sectionData[currentSection] || [];

    return (
      <div className="options-grid">
        {options.map((option, index) => {
          const optionText = typeof option === 'string' ? option : option.text;
          const optionImg = typeof option === 'object' ? option.img : null;

          return (
            <div
              key={index}
              className="option"
              onClick={() => addSelected(optionText)}
            >
              <strong>{optionText}</strong>
              {optionImg && <img src={optionImg} alt={optionText} />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="find-gyms-page">
      <section className="section-hero">
        <div className="hero-overlay">
          <h1>FIND THE GYM THAT FITS YOUR LIFESTYLE</h1>
          <button onClick={openModal} className="hero-btn">
            Set Preference
          </button>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-bg" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{sections[currentStep]}</h2>
              <button className="modal-close" onClick={closeModal}>
                ✖
              </button>
            </div>

            <div className="modal-content">
              <div className="left-panel">{renderLeftPanel()}</div>

              <div className="right-panel">
                <h3>Selected Preferences</h3>
                <div className="selected-list">
                  {Object.keys(selectedItems).length === 0 ? (
                    <p className="empty-message">No items selected yet</p>
                  ) : (
                    Object.keys(selectedItems).map((item, index) => (
                      <div key={index} className="selected-item">
                        <span>{item}</span>
                        <button
                          className="remove-btn"
                          onClick={() => removeSelected(item)}
                        >
                          ✖
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <button className="apply-btn" onClick={handleApply}>
                  APPLY PREFERENCES
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="nav-btn"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <span className="arrow left"></span>
              </button>
              <div className="step-indicator">
                Step {currentStep + 1} of {sections.length}
              </div>
              <button
                className="nav-btn"
                onClick={nextStep}
                disabled={currentStep === sections.length - 1}
              >
                <span className="arrow right"></span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}