import React, { useState } from "react";
import { X, Save, Check, Wifi, Car, Droplet, Wind, Dumbbell, Users, Coffee, Lock, AlertCircle, Plus } from "lucide-react";
import "./Modals.css";

// Predefined amenities with icons
const AMENITY_OPTIONS = [
  { id: "shower", label: "Shower Rooms", icon: Droplet },
  { id: "locker", label: "Locker Rooms", icon: Lock },
  { id: "parking", label: "Parking", icon: Car },
  { id: "ac", label: "Air Conditioning", icon: Wind },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "personal_training", label: "Personal Training", icon: Users },
  { id: "cardio", label: "Cardio Area", icon: Dumbbell },
  { id: "free_weights", label: "Free Weights", icon: Dumbbell },
  { id: "cafe", label: "Café/Juice Bar", icon: Coffee },
  { id: "sauna", label: "Sauna", icon: Wind },
  { id: "pool", label: "Swimming Pool", icon: Droplet },
  { id: "yoga", label: "Yoga Studio", icon: Users },
  { id: "crossfit", label: "CrossFit Area", icon: Dumbbell },
  { id: "boxing", label: "Boxing Ring", icon: Dumbbell },
  { id: "stretching", label: "Stretching Area", icon: Users },
];

export default function UpdateAmenities({ gymId, existingAmenities = [], onClose, onSuccess }) {
  const [selectedAmenities, setSelectedAmenities] = useState([...existingAmenities]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const toggleAmenity = (amenityLabel) => {
    let newAmenities;
    if (selectedAmenities.includes(amenityLabel)) {
      newAmenities = selectedAmenities.filter(a => a !== amenityLabel);
    } else {
      newAmenities = [...selectedAmenities, amenityLabel];
    }
    setSelectedAmenities(newAmenities);
    setHasChanges(JSON.stringify(newAmenities.sort()) !== JSON.stringify([...existingAmenities].sort()));
  };

  const addCustomAmenity = () => {
    if (customAmenity.trim()) {
      if (selectedAmenities.includes(customAmenity.trim())) {
        setError("This amenity is already added");
        return;
      }
      const newAmenities = [...selectedAmenities, customAmenity.trim()];
      setSelectedAmenities(newAmenities);
      setCustomAmenity("");
      setError("");
      setHasChanges(JSON.stringify(newAmenities.sort()) !== JSON.stringify([...existingAmenities].sort()));
    }
  };

  const removeAmenity = (amenity) => {
    const newAmenities = selectedAmenities.filter(a => a !== amenity);
    setSelectedAmenities(newAmenities);
    setHasChanges(JSON.stringify(newAmenities.sort()) !== JSON.stringify([...existingAmenities].sort()));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedAmenities.length === 0) {
      setError("Please select at least one amenity");
      return;
    }

    if (!hasChanges) {
      setError("No changes made");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // API call here
      // const response = await axios.put(`/api/gyms/${gymId}/amenities`, {
      //   amenities: selectedAmenities
      // });
      
      // Mock success
      setTimeout(() => {
        onSuccess && onSuccess(selectedAmenities);
        setLoading(false);
      }, 1000);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to update amenities");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedAmenities([...existingAmenities]);
    setHasChanges(false);
    setError("");
  };

  // Separate custom amenities from predefined ones
  const predefinedLabels = AMENITY_OPTIONS.map(opt => opt.label);
  const customAmenities = selectedAmenities.filter(a => !predefinedLabels.includes(a));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content amenities-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div>
            <h2>Update Amenities</h2>
            <p>Manage amenities available at your gym</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {hasChanges && !error && (
          <div className="changes-banner">
            <Check size={18} />
            <span>You have unsaved changes</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          
          {/* Predefined Amenities Grid */}
          <div className="form-section">
            <label className="section-label">Select Amenities</label>
            <div className="amenities-grid">
              {AMENITY_OPTIONS.map((amenity) => {
                const Icon = amenity.icon;
                const isSelected = selectedAmenities.includes(amenity.label);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    className={`amenity-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleAmenity(amenity.label)}
                  >
                    <div className="amenity-icon">
                      <Icon size={24} />
                    </div>
                    <span className="amenity-label">{amenity.label}</span>
                    {isSelected && (
                      <div className="amenity-check">
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amenity Input */}
          <div className="form-section">
            <label className="section-label">Add Custom Amenity</label>
            <div className="custom-amenity-input">
              <input
                type="text"
                placeholder="Enter custom amenity (e.g., Rock Climbing Wall)"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                className="form-input"
              />
              <button
                type="button"
                className="add-custom-btn"
                onClick={addCustomAmenity}
                disabled={!customAmenity.trim()}
              >
                <Plus size={18} />
                Add
              </button>
            </div>
          </div>

          {/* Custom Amenities List */}
          {customAmenities.length > 0 && (
            <div className="form-section">
              <label className="section-label">
                Custom Amenities ({customAmenities.length})
              </label>
              <div className="selected-amenities-list">
                {customAmenities.map((amenity, index) => (
                  <div key={index} className="selected-amenity-tag custom">
                    <span>{amenity}</span>
                    <button
                      type="button"
                      className="remove-tag-btn"
                      onClick={() => removeAmenity(amenity)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Count Summary */}
          <div className="amenities-summary">
            <div className="summary-stat">
              <strong>{selectedAmenities.length}</strong>
              <span>Total Amenities</span>
            </div>
            <div className="summary-stat">
              <strong>{selectedAmenities.filter(a => predefinedLabels.includes(a)).length}</strong>
              <span>Predefined</span>
            </div>
            <div className="summary-stat">
              <strong>{customAmenities.length}</strong>
              <span>Custom</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleReset}
              disabled={loading || !hasChanges}
            >
              Reset Changes
            </button>
            <div className="action-group">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading || !hasChanges || selectedAmenities.length === 0}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}