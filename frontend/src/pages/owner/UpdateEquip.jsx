import React, { useState, useEffect } from "react";
import { X, Save, Upload, Trash2, AlertCircle } from "lucide-react";
import "./Modals.css";

export default function UpdateEquipment({ equipment, onClose, onSuccess, onDelete }) {
  const [formData, setFormData] = useState({
    name: equipment.name || "",
    quantity: equipment.quantity || 1,
    image: null,
    imagePreview: equipment.image || null,
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
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
    
    if (!formData.name.trim()) {
      setError("Equipment name is required");
      return;
    }

    if (formData.quantity < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updateData = new FormData();
      updateData.append("name", formData.name);
      updateData.append("quantity", formData.quantity);
      if (formData.image) {
        updateData.append("image", formData.image);
      }

      // API call here
      // const response = await axios.put(`/api/equipment/${equipment.id}`, updateData);
      
      // Mock success
      setTimeout(() => {
        onSuccess && onSuccess({
          ...equipment,
          name: formData.name,
          quantity: formData.quantity,
          image: formData.imagePreview,
        });
        setLoading(false);
      }, 1000);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to update equipment");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      // API call here
      // await axios.delete(`/api/equipment/${equipment.id}`);
      
      // Mock success
      setTimeout(() => {
        onDelete && onDelete(equipment.id);
        setDeleting(false);
      }, 1000);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete equipment");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      image: null,
      imagePreview: null,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div>
            <h2>Update Equipment</h2>
            <p>Edit equipment details</p>
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
            {formData.imagePreview ? (
              <div className="image-preview-container">
                <img 
                  src={formData.imagePreview} 
                  alt="Equipment preview" 
                  className="equipment-preview"
                />
                <div className="image-actions">
                  <label className="change-image-btn">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file-input"
                    />
                    <Upload size={16} />
                    Change
                  </label>
                  <button 
                    type="button" 
                    className="remove-image-btn"
                    onClick={handleRemoveImage}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                onClick={() => setFormData({ 
                  ...formData, 
                  quantity: Math.max(1, formData.quantity - 1) 
                })}
                disabled={formData.quantity <= 1}
              >
                −
              </button>
              <input
                id="equipment-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  quantity: parseInt(e.target.value) || 1 
                })}
                className="quantity-input"
                required
              />
              <button
                type="button"
                className="quantity-btn"
                onClick={() => setFormData({ 
                  ...formData, 
                  quantity: formData.quantity + 1 
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
              className="btn-danger" 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading || deleting}
            >
              <Trash2 size={18} />
              Delete
            </button>
            <div className="action-group">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onClose}
                disabled={loading || deleting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading || deleting}
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="confirm-icon danger">
                <Trash2 size={32} />
              </div>
              <h3>Delete Equipment?</h3>
              <p>
                Are you sure you want to delete <strong>{equipment.name}</strong>? 
                This action cannot be undone.
              </p>
              <div className="confirm-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button 
                  className="btn-danger-confirm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <div className="btn-spinner"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete Equipment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}