import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../user/Header-user";
import Footer from "../user/Footer";
import "./EditGym.css";
import {
  Save, X, Upload, Trash2, Plus, MapPin, Clock, 
  DollarSign, Dumbbell, Image as ImageIcon, Phone, 
  Mail, Globe, AlertCircle, CheckCircle, Copy, ChevronLeft
} from "lucide-react";

const MOCK_GYM = {
  id: 1,
  name: "IronForge Fitness",
  description: "Premier strength training facility in the heart of Pasig City. We offer state-of-the-art equipment, experienced trainers, and a motivating atmosphere for all fitness levels.",
  address: "123 Kapitolyo Street, Barangay Kapitolyo",
  city: "Pasig City",
  landmark: "Near SM Pasig, 2nd Floor",
  contact_number: "09171234567",
  email: "info@ironforge.ph",
  website: "www.ironforge.ph",
  photos: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80",
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80",
  ],
  hours: {
    Monday: { open: "06:00", close: "22:00" },
    Tuesday: { open: "06:00", close: "22:00" },
    Wednesday: { open: "06:00", close: "22:00" },
    Thursday: { open: "06:00", close: "22:00" },
    Friday: { open: "06:00", close: "22:00" },
    Saturday: { open: "08:00", close: "20:00" },
    Sunday: { open: "08:00", close: "18:00" },
  },
  pricing: {
    day_pass: 150,
    monthly: 2500,
    quarterly: 6500,
  },
  amenities: ["Shower Rooms", "Locker Rooms", "Parking", "Air Conditioning", "WiFi", "Personal Training"],
  equipments: [
    { id: 1, name: "Treadmill", quantity: 8 },
    { id: 2, name: "Dumbbells", quantity: 20 },
    { id: 3, name: "Bench Press", quantity: 4 },
  ],
};

const AMENITY_OPTIONS = [
  "Shower Rooms", "Locker Rooms", "Parking", "Air Conditioning", 
  "WiFi", "Personal Training", "Cardio Area", "Free Weights",
  "Weight Machines", "Boxing Area", "Yoga Studio", "Sauna",
  "Steam Room", "Juice Bar", "Pro Shop", "24/7 Access"
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function EditGym() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    landmark: "",
    contact_number: "",
    email: "",
    website: "",
    photos: [],
    hours: {},
    pricing: { day_pass: "", monthly: "", quarterly: "" },
    amenities: [],
    equipments: [],
  });

  const [newEquipment, setNewEquipment] = useState({ name: "", quantity: "" });
  const [errors, setErrors] = useState({});
  const [copyAllHours, setCopyAllHours] = useState(false);
  const [baseHours, setBaseHours] = useState({ open: "06:00", close: "22:00" });

  useEffect(() => {
    setTimeout(() => {
      setForm(MOCK_GYM);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleHourChange = (day, type, value) => {
    setForm(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: { ...prev.hours[day], [type]: value }
      }
    }));
    setHasChanges(true);
  };

  const applySameHours = () => {
    if (!copyAllHours) return;
    const newHours = {};
    FULL_DAYS.forEach(day => {
      newHours[day] = { ...baseHours };
    });
    setForm(prev => ({ ...prev, hours: newHours }));
    setHasChanges(true);
  };

  const toggleAmenity = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
    setHasChanges(true);
  };

  const addEquipment = () => {
    if (!newEquipment.name || !newEquipment.quantity) return;
    setForm(prev => ({
      ...prev,
      equipments: [...prev.equipments, { id: Date.now(), ...newEquipment }]
    }));
    setNewEquipment({ name: "", quantity: "" });
    setHasChanges(true);
  };

  const removeEquipment = (id) => {
    setForm(prev => ({
      ...prev,
      equipments: prev.equipments.filter(e => e.id !== id)
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Gym name is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.contact_number.trim()) newErrors.contact_number = "Contact number is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab("basic");
      return;
    }

    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSaving(false);
    setHasChanges(false);
    
    const notification = document.createElement('div');
    notification.className = 'eg-success-toast';
    notification.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Changes saved successfully!</span>';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        navigate(`/owner/gym/${id}`);
      }
    } else {
      navigate(`/owner/gym/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="eg-app">
        <Header />
        <div className="eg-loading">
          <div className="eg-spinner"></div>
          <p>Loading gym details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="eg-app">
      <Header />

      <div className="eg-container">

        {/* Sticky Header */}
        <div className="eg-sticky-header">
          <div className="eg-header-content">
            <button className="eg-back-btn" onClick={handleCancel}>
              <ChevronLeft size={18} />
              Back
            </button>
            <div className="eg-header-info">
              <h1>Edit Gym</h1>
              {hasChanges && (
                <span className="eg-changes-indicator">
                  <span className="eg-dot"></span>
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
          <div className="eg-header-actions">
            <button className="eg-btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button 
              className="eg-btn-primary" 
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <>
                  <div className="eg-btn-spinner"></div>
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

        {/* Tabs */}
        <div className="eg-tabs">
          <button 
            className={`eg-tab ${activeTab === "basic" ? "active" : ""}`}
            onClick={() => setActiveTab("basic")}
          >
            <Phone size={18} />
            Basic Info
          </button>
          <button 
            className={`eg-tab ${activeTab === "location" ? "active" : ""}`}
            onClick={() => setActiveTab("location")}
          >
            <MapPin size={18} />
            Location
          </button>
          <button 
            className={`eg-tab ${activeTab === "hours" ? "active" : ""}`}
            onClick={() => setActiveTab("hours")}
          >
            <Clock size={18} />
            Hours
          </button>
          <button 
            className={`eg-tab ${activeTab === "pricing" ? "active" : ""}`}
            onClick={() => setActiveTab("pricing")}
          >
            <DollarSign size={18} />
            Pricing
          </button>
          <button 
            className={`eg-tab ${activeTab === "facilities" ? "active" : ""}`}
            onClick={() => setActiveTab("facilities")}
          >
            <Dumbbell size={18} />
            Facilities
          </button>
          <button 
            className={`eg-tab ${activeTab === "media" ? "active" : ""}`}
            onClick={() => setActiveTab("media")}
          >
            <ImageIcon size={18} />
            Media
          </button>
        </div>

        {/* Content */}
        <div className="eg-content">

          {activeTab === "basic" && (
            <div className="eg-tab-content">
              <div className="eg-section">
                <h2>Gym Information</h2>
                
                <div className="eg-field">
                  <label>Gym Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={errors.name ? "error" : ""}
                    placeholder="Enter your gym name"
                  />
                  {errors.name && <span className="eg-error">{errors.name}</span>}
                </div>

                <div className="eg-field">
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={5}
                    placeholder="Describe your gym, facilities, and what makes it unique..."
                  />
                  <span className="eg-char-count">{form.description.length} / 500</span>
                </div>
              </div>

              <div className="eg-section">
                <h2>Contact Information</h2>
                
                <div className="eg-row-2">
                  <div className="eg-field">
                    <label>Phone Number *</label>
                    <div className="eg-input-icon">
                      <Phone size={18} />
                      <input
                        type="text"
                        value={form.contact_number}
                        onChange={(e) => handleChange("contact_number", e.target.value)}
                        className={errors.contact_number ? "error" : ""}
                        placeholder="09XX XXX XXXX"
                      />
                    </div>
                    {errors.contact_number && <span className="eg-error">{errors.contact_number}</span>}
                  </div>
                  <div className="eg-field">
                    <label>Email Address</label>
                    <div className="eg-input-icon">
                      <Mail size={18} />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="gym@email.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="eg-field">
                  <label>Website</label>
                  <div className="eg-input-icon">
                    <Globe size={18} />
                    <input
                      type="text"
                      value={form.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      placeholder="www.yourgym.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "location" && (
            <div className="eg-tab-content">
              <div className="eg-section">
                <h2><MapPin size={20} /> Location Details</h2>
                
                <div className="eg-field">
                  <label>Street Address *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className={errors.address ? "error" : ""}
                    placeholder="123 Main Street, Building Name, Floor"
                  />
                  {errors.address && <span className="eg-error">{errors.address}</span>}
                </div>

                <div className="eg-row-2">
                  <div className="eg-field">
                    <label>City *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="Pasig City"
                    />
                  </div>
                  <div className="eg-field">
                    <label>Landmark</label>
                    <input
                      type="text"
                      value={form.landmark}
                      onChange={(e) => handleChange("landmark", e.target.value)}
                      placeholder="Near SM Mall, beside 7-Eleven"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "hours" && (
            <div className="eg-tab-content">
              <div className="eg-section">
                <h2><Clock size={20} /> Operating Hours</h2>
                
                <div className="eg-quick-hours">
                  <label className="eg-toggle-label">
                    <input
                      type="checkbox"
                      checked={copyAllHours}
                      onChange={(e) => setCopyAllHours(e.target.checked)}
                    />
                    <span>Same hours for all days</span>
                  </label>

                  {copyAllHours && (
                    <div className="eg-base-hours">
                      <input
                        type="time"
                        value={baseHours.open}
                        onChange={(e) => setBaseHours(prev => ({ ...prev, open: e.target.value }))}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={baseHours.close}
                        onChange={(e) => setBaseHours(prev => ({ ...prev, close: e.target.value }))}
                      />
                      <button className="eg-apply-btn" onClick={applySameHours}>
                        Apply to All
                      </button>
                    </div>
                  )}
                </div>

                <div className="eg-hours-modern">
                  {FULL_DAYS.map((day, i) => (
                    <div key={day} className="eg-hour-card">
                      <div className="eg-hour-day">
                        <span className="eg-day-short">{DAYS[i]}</span>
                        <span className="eg-day-full">{day}</span>
                      </div>
                      <div className="eg-hour-times">
                        <input
                          type="time"
                          value={form.hours[day]?.open || "06:00"}
                          onChange={(e) => handleHourChange(day, "open", e.target.value)}
                        />
                        <span>—</span>
                        <input
                          type="time"
                          value={form.hours[day]?.close || "22:00"}
                          onChange={(e) => handleHourChange(day, "close", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="eg-tab-content">
              <div className="eg-section">
                <h2><DollarSign size={20} /> Membership Pricing</h2>
                
                <div className="eg-pricing-grid">
                  <div className="eg-price-card">
                    <label>Day Pass</label>
                    <div className="eg-price-input">
                      <span className="eg-currency">₱</span>
                      <input
                        type="number"
                        value={form.pricing.day_pass}
                        onChange={(e) => handleChange("pricing", { ...form.pricing, day_pass: e.target.value })}
                        placeholder="150"
                      />
                    </div>
                  </div>

                  <div className="eg-price-card featured">
                    <div className="eg-popular-badge">Most Popular</div>
                    <label>Monthly</label>
                    <div className="eg-price-input">
                      <span className="eg-currency">₱</span>
                      <input
                        type="number"
                        value={form.pricing.monthly}
                        onChange={(e) => handleChange("pricing", { ...form.pricing, monthly: e.target.value })}
                        placeholder="2500"
                      />
                    </div>
                  </div>

                  <div className="eg-price-card">
                    <label>Quarterly</label>
                    <div className="eg-price-input">
                      <span className="eg-currency">₱</span>
                      <input
                        type="number"
                        value={form.pricing.quarterly}
                        onChange={(e) => handleChange("pricing", { ...form.pricing, quarterly: e.target.value })}
                        placeholder="6500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "facilities" && (
            <div className="eg-tab-content">
              <div className="eg-section">
                <h2><CheckCircle size={20} /> Amenities</h2>
                <div className="eg-amenities-modern">
                  {AMENITY_OPTIONS.map(amenity => (
                    <label key={amenity} className="eg-amenity-modern">
                      <input
                        type="checkbox"
                        checked={form.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                      />
                      <span>{amenity}</span>
                      <CheckCircle className="eg-check-icon" size={18} />
                    </label>
                  ))}
                </div>
              </div>

              <div className="eg-section">
                <h2><Dumbbell size={20} /> Equipment</h2>
                
                <div className="eg-equipment-modern">
                  {form.equipments.map(eq => (
                    <div key={eq.id} className="eg-equipment-card">
                      <div className="eg-equipment-details">
                        <strong>{eq.name}</strong>
                        <span>{eq.quantity} available</span>
                      </div>
                      <button
                        className="eg-remove-btn"
                        onClick={() => removeEquipment(eq.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="eg-add-equipment-modern">
                  <input
                    type="text"
                    placeholder="Equipment name (e.g., Treadmill)"
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={newEquipment.quantity}
                    onChange={(e) => setNewEquipment(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                  <button onClick={addEquipment}>
                    <Plus size={18} />
                    Add Equipment
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="eg-tab-content">
              <div className="eg-section">
                <h2><ImageIcon size={20} /> Gym Photos</h2>
                <p className="eg-media-helper">Upload high-quality photos that showcase your gym. Recommended: 1920x1080px</p>
                
                <div className="eg-photos-modern">
                  {form.photos.map((photo, i) => (
                    <div key={i} className="eg-photo-card">
                      <img src={photo} alt="" />
                      <div className="eg-photo-overlay">
                        <button className="eg-photo-delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="eg-photo-upload-modern">
                    <Upload size={32} />
                    <span>Upload Photos</span>
                    <small>JPG, PNG up to 10MB</small>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      <Footer />
    </div>
  );
}