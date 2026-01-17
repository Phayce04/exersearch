import React from "react";
import "./Profilestyle.css";

export default function Profile() {
  return (
    <div className="gym-profile">

      {/* HEADER */}
      <div className="profile-header">
        <img
          className="avatar"
          src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=400"
          alt="Profile"
        />
        <div className="profile-info">
          <h1>Alex Carter</h1>
          <p>Premium Member • Muscle Building Program</p>
        </div>
        <button className="edit-btn">Edit Profile</button>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <h2>124</h2>
          <span>Workouts</span>
        </div>
        <div className="stat-card">
          <h2>32,450</h2>
          <span>Calories Burned</span>
        </div>
        <div className="stat-card">
          <h2>18 Days</h2>
          <span>Streak</span>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="main-grid">

        {/* MEMBERSHIP */}
        <div className="card membership">
          <h3>Membership</h3>
          <p><strong>Plan:</strong> Elite Monthly</p>
          <p><strong>Renewal:</strong> Feb 15, 2026</p>
          <button className="primary-btn">Manage Plan</button>
        </div>

        {/* GOALS */}
        <div className="card goals">
          <h3>Fitness Goals</h3>

          <div className="goal">
            <span>Weight Loss</span>
            <div className="progress-bar">
              <div style={{ width: "70%" }} />
            </div>
          </div>

          <div className="goal">
            <span>Muscle Gain</span>
            <div className="progress-bar">
              <div style={{ width: "45%" }} />
            </div>
          </div>

          <div className="goal">
            <span>Cardio Endurance</span>
            <div className="progress-bar">
              <div style={{ width: "60%" }} />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="card actions">
          <h3>Quick Actions</h3>
          <button>Log Workout</button>
          <button>Track Meal</button>
          <button>View Progress</button>
        </div>

      </div>
    </div>
  );
}
