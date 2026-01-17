import React from "react";
import "./Profilestyle.css";

export default function Profile() {
  // TEMP mock data (replace later with API)
  const user = {
    name: "John Carter",
    email: "john@email.com",
    role: "user",
    created_at: "2024-09-12",
    avatar: "https://i.pravatar.cc/150?img=12", // profile picture
  };

  const profile = {
    age: 24,
    height: 175,
    weight: 72,
    address: "Manila, Philippines",
  };

  return (
    <div className="profile-page">

      {/* Header */}
      <div className="profile-header">

        {/* Avatar */}
        <div className="avatar-wrapper">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="Profile"
              className="avatar-img"
            />
          ) : (
            <div className="avatar-fallback">
              {user.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="header-info">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <span className="role-badge">{user.role}</span>
        </div>

      </div>

      {/* Info Grid */}
      <div className="profile-grid">

        <div className="info-card">
          <label>Age</label>
          <strong>{profile.age} years</strong>
        </div>

        <div className="info-card">
          <label>Height</label>
          <strong>{profile.height} cm</strong>
        </div>

        <div className="info-card">
          <label>Weight</label>
          <strong>{profile.weight} kg</strong>
        </div>

        <div className="info-card">
          <label>Location</label>
          <strong>{profile.address}</strong>
        </div>

        <div className="info-card">
          <label>Member Since</label>
          <strong>{user.created_at}</strong>
        </div>

      </div>

      {/* Actions */}
      <div className="profile-actions">
        <button className="primary-btn">Edit Profile</button>
        <button className="secondary-btn">Change Password</button>
      </div>

    </div>
  );
}
