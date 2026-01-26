import React, { useState } from "react";
import "./ProfileStyle.css";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: "John Carter",
    email: "john@email.com",
    age: 24,
    height: 175,
    weight: 72,
    address: "Manila, Philippines",
    bio: "Fitness enthusiast and health tracker user",
    avatar: "https://i.pravatar.cc/150?img=12",
    goal: "Build Muscle",
    activityLevel: "Moderate",
    budget: "₱2500/month",
    preferredEquipments: "Dumbbells, Treadmill",
    preferredAmenities: "Pool, Sauna",
    created_at: "2024-09-12",
  });

  const [formData, setFormData] = useState({ ...userData });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setUserData({ ...formData });
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Left Column */}
        <div className="profile-left">
          <div className="avatar-wrapper">
            <img
              src={userData.avatar}
              alt="Profile"
              className="avatar-img"
            />
          </div>
          <h2 className="profile-name">{userData.name}</h2>
          <p className="profile-email">{userData.email}</p>
          <p className="profile-bio">{userData.bio}</p>
          {!isEditing && (
            <button
              className="primary-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Right Column */}
        <div className="profile-right">
          {isEditing ? (
            <div className="edit-form">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
              />
              <label>Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
              />
              <label>Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
              />
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
              />
              <div className="edit-actions">
                <button className="primary-btn" onClick={handleSave}>
                  Save
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="section-title">User Info</h3>
              <div className="info-grid">
                <div className="info-card">
                  <label>Age</label>
                  <strong>{userData.age} yrs</strong>
                </div>
                <div className="info-card">
                  <label>Height</label>
                  <strong>{userData.height} cm</strong>
                </div>
                <div className="info-card">
                  <label>Weight</label>
                  <strong>{userData.weight} kg</strong>
                </div>
                <div className="info-card">
                  <label>Address</label>
                  <strong>{userData.address}</strong>
                </div>
                <div className="info-card">
                  <label>Member Since</label>
                  <strong>{userData.created_at}</strong>
                </div>
              </div>

              <h3 className="section-title">Preferences</h3>
              <div className="info-grid">
                <div className="info-card">
                  <label>Goal</label>
                  <strong>{userData.goal}</strong>
                </div>
                <div className="info-card">
                  <label>Activity Level</label>
                  <strong>{userData.activityLevel}</strong>
                </div>
                <div className="info-card">
                  <label>Budget</label>
                  <strong>{userData.budget}</strong>
                </div>
                <div className="info-card">
                  <label>Equipments</label>
                  <strong>{userData.preferredEquipments}</strong>
                </div>
                <div className="info-card">
                  <label>Amenities</label>
                  <strong>{userData.preferredAmenities}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
