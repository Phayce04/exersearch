import React, { useState } from 'react';
import './Profilestyle.css';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    name: 'John Carter',
    email: 'john@email.com',
    role: 'user',
    created_at: '2024-09-12',
    avatar: 'https://i.pravatar.cc/150?img=12',
    age: 24,
    height: 175,
    weight: 72,
    address: 'Manila, Philippines',
    bio: 'Fitness enthusiast and health tracker user'
  });
  
  const [formData, setFormData] = useState({ ...userData });
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    setUserData({ ...formData });
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    alert('Account deletion requested');
    setShowDeleteModal(false);
  };

  const handlePasswordChange = () => {
    alert('Password change functionality');
    setShowPasswordModal(false);
  };

  const ProfileSection = () => (
    <div className="profile-content">
      <div className="profile-header-section">
        <div className="avatar-container">
          <div className="avatar-wrapper-large">
            {userData.avatar ? (
              <img src={userData.avatar} alt="Profile" className="avatar-img-large" />
            ) : (
              <div className="avatar-fallback-large">
                {userData.name.charAt(0)}
              </div>
            )}
            <button className="avatar-edit-btn">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {!isEditing ? (
          <div className="profile-info-display">
            <h2 className="profile-name">{userData.name}</h2>
            <p className="profile-email">{userData.email}</p>
            <span className="role-badge">{userData.role}</span>
            <p className="profile-location">{userData.address}</p>
            <p className="profile-bio">{userData.bio}</p>
            <button onClick={() => setIsEditing(true)} className="primary-btn">
              Edit Profile
            </button>
          </div>
        ) : (
          <div className="profile-edit-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="3"
                className="form-input"
              />
            </div>
            <div className="form-actions">
              <button onClick={handleSubmit} className="primary-btn">
                Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ ...userData });
                }}
                className="secondary-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="profile-stats-grid">
        <div className="info-card">
          <label>Age</label>
          <strong>{userData.age} years</strong>
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
          <label>Member Since</label>
          <strong>{userData.created_at}</strong>
        </div>
      </div>
    </div>
  );

  const SettingsSection = () => (
    <div className="settings-content">
      <h2 className="settings-title">Account Settings</h2>
      
      <div className="settings-card">
        <div className="setting-item">
          <div className="setting-info">
            <h3 className="setting-name">Notifications</h3>
            <p className="setting-desc">Receive email notifications</p>
          </div>
          <div className="toggle-wrapper">
            <input 
              type="checkbox" 
              id="notifications" 
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
              className="toggle-input"
            />
            <label htmlFor="notifications" className={`toggle-label ${notifications ? 'active' : ''}`}>
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div className="setting-item">
          <div className="setting-info">
            <h3 className="setting-name">Dark Mode</h3>
            <p className="setting-desc">Switch between light and dark theme</p>
          </div>
          <div className="toggle-wrapper">
            <input 
              type="checkbox" 
              id="darkMode" 
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              className="toggle-input"
            />
            <label htmlFor="darkMode" className={`toggle-label ${darkMode ? 'active' : ''}`}>
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-divider"></div>

        <div className="setting-item">
          <div className="setting-info">
            <h3 className="setting-name">Password</h3>
            <p className="setting-desc">Change your account password</p>
          </div>
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="secondary-btn"
          >
            Change Password
          </button>
        </div>
        
        <div className="setting-divider"></div>
        
        <div className="danger-zone">
          <h3 className="danger-title">Danger Zone</h3>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="danger-btn"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const DeleteModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Delete Account</h3>
        <p className="modal-text">Are you sure you want to delete your account? This action cannot be undone.</p>
        <div className="modal-actions">
          <button onClick={() => setShowDeleteModal(false)} className="secondary-btn">
            Cancel
          </button>
          <button onClick={handleDeleteAccount} className="danger-btn">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const PasswordModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Change Password</h3>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input type="password" className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input type="password" className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input type="password" className="form-input" />
        </div>
        <div className="modal-actions">
          <button onClick={() => setShowPasswordModal(false)} className="secondary-btn">
            Cancel
          </button>
          <button onClick={handlePasswordChange} className="primary-btn">
            Change Password
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`profile-page ${darkMode ? 'dark-mode' : ''}`}>
      <div className="profile-container">
        <div className="profile-layout">
          {/* Sidebar Navigation */}
          <div className="sidebar">
            <div className="sidebar-content">
              <div className="sidebar-header">
                <h1 className="sidebar-title">User Settings</h1>
              </div>
              <nav className="sidebar-nav">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  <span>Settings</span>
                </button>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="main-content">
            <div className="content-card">
              {activeTab === 'profile' ? <ProfileSection /> : <SettingsSection />}
            </div>
          </div>
        </div>
      </div>
      
      {showDeleteModal && <DeleteModal />}
      {showPasswordModal && <PasswordModal />}
    </div>
  );
}