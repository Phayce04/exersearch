import React, { useState } from "react";
import { X, Plus, Upload, Trash2, AlertCircle } from "lucide-react";
import "./Modals.css";

export default function AddEquipment({ gymId, onClose, onSuccess }) {
  const [equipment, setEquipment] = useState({
    name: "",
    quantity: 1,
    image: null,
    imagePreview: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEquipment({
          ...equipment,
          image: file,
          imagePreview: reader.result,
        });
        setError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!equipment.name.trim()) {
      setError("Equipment name is required");
      return;
    }

    if (equipment.quantity < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("gym_id", gymId);
      formData.append("name", equipment.name);
      formData.append("quantity", equipment.quantity);
      if (equipment.image) {
        formData.append("image", equipment.image);
      }

      // API call here
      // const response = await axios.post('/api/equipment', formData);
      
      // Mock success
      setTimeout(() => {
        onSuccess && onSuccess();
        setLoading(false);
      }, 1000);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to add equipment");
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setEquipment({
      ...equipment,
      image: null,
      imagePreview: null,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div>
            <h2>Add Equipment</h2>
            <p>Add new equipment to your gym</p>
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

        <form onSubmit={handleSubmit} className="modal-form">
          
          {/* Equipment Image Upload */}
          <div className="form-group">
            <label>Equipment Image</label>
            {equipment.imagePreview ? (
              <div className="image-preview-container">
                <img 
                  src={equipment.imagePreview} 
                  alt="Equipment preview" 
                  className="equipment-preview"
                />
                <button 
                  type="button" 
                  className="remove-image-btn"
                  onClick={handleRemoveImage}
                >
                  <Trash2 size={18} />
                  Remove
                </button>
              </div>
            ) : (
              <label className="upload-zone">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                />
                <div className="upload-content">
                  <Upload size={32} />
                  <span>Click to upload image</span>
                  <small>PNG, JPG up to 5MB</small>
                </div>
              </label>
            )}
          </div>

          {/* Equipment Name */}
          <div className="form-group">
            <label htmlFor="equipment-name">
              Equipment Name <span className="required">*</span>
            </label>
            <input
              id="equipment-name"
              type="text"
              placeholder="e.g., Treadmill, Dumbbells, Bench Press"
              value={equipment.name}
              onChange={(e) => setEquipment({ ...equipment, name: e.target.value })}
              className="form-input"
              required
            />
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label htmlFor="equipment-quantity">
              Quantity <span className="required">*</span>
            </label>
            <div className="quantity-controls">
              <button
                type="button"
                className="quantity-btn"
                onClick={() => setEquipment({ 
                  ...equipment, 
                  quantity: Math.max(1, equipment.quantity - 1) 
                })}
                disabled={equipment.quantity <= 1}
              >
                −
              </button>
              <input
                id="equipment-quantity"
                type="number"
                min="1"
                value={equipment.quantity}
                onChange={(e) => setEquipment({ 
                  ...equipment, 
                  quantity: parseInt(e.target.value) || 1 
                })}
                className="quantity-input"
                required
              />
              <button
                type="button"
                className="quantity-btn"
                onClick={() => setEquipment({ 
                  ...equipment, 
                  quantity: equipment.quantity + 1 
                })}
              >
                +
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Add Equipment
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}