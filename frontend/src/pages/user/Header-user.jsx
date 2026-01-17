import { useState, useRef, useEffect } from 'react';
import './HF.css';
import logo from '../../assets/exersearchlogo.png';
import { useAuth } from '../../authcon';
import { Link } from 'react-router-dom';

export default function HeaderUser() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const { user, logout } = useAuth();

  const containerRef = useRef(null);

  // Toggle profile dropdown
  const toggleProfileDropdown = () => setProfileDropdown(prev => !prev);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If dropdown is open and click is outside the container
      if (profileDropdown && containerRef.current && !containerRef.current.contains(event.target)) {
        setProfileDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside); // listen on click, not mousedown
    return () => document.removeEventListener('click', handleClickOutside);
  }, [profileDropdown]);

  return (
    <>
      <header className="header">
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>

        <nav className="nav-links">
          <a href="#">DASHBOARD</a>
          <a href="#">MY GYMS</a>

          {/* Profile */}
          <div className="profile-container" ref={containerRef}>
            <button className="profile-btn" onClick={toggleProfileDropdown}>
              <img
                className="profile-avatar"
                src={user?.photoURL || user?.avatar || 'https://i.pravatar.cc/40?img=12'}
                alt="profile"
                onError={(e) => { e.target.src = 'https://i.pravatar.cc/40?img=12'; }}
              />
              <span className={`dropdown-arrow ${profileDropdown ? 'open' : ''}`}>▾</span>
            </button>

            {/* Dropdown */}
            <div className={`profile-dropdown ${profileDropdown ? 'open' : ''}`}>
              <div className="profile-header">
                <img
                  className="dropdown-avatar"
                  src={user?.photoURL || user?.avatar || 'https://i.pravatar.cc/60?img=12'}
                  alt="profile"
                  onError={(e) => { e.target.src = 'https://i.pravatar.cc/60?img=12'; }}
                />
                <div>
                  <div className="profile-name">{user?.name || 'User'}</div>
                  <div className="profile-email">{user?.email || 'user@email.com'}</div>
                </div>
              </div>

              <div className="dropdown-divider" />

          <Link to="/profile" onClick={() => setProfileDropdown(false)}>My Profile</Link>
    
          <Link to="/home/settings" onClick={() => setProfileDropdown(false)}>Settings</Link>

                <a href="#" onClick={logout}>Logout</a> 
            </div>
          </div>
        </nav>

        {/* Mobile Hamburger */}
        <div className="hamburger" onClick={() => setMobileMenuOpen(prev => !prev)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#" onClick={() => setMobileMenuOpen(false)}>DASHBOARD</a>
        <a href="#" onClick={() => setMobileMenuOpen(false)}>MY GYMS</a>
        <a href="/profile" onClick={() => setMobileMenuOpen(false)}>My Profile</a>
        <a href="/settings" onClick={() => setMobileMenuOpen(false)}>Settings</a>
        <a
          href="#"
          onClick={() => {
            logout();
            setMobileMenuOpen(false);
          }}
        >
          Logout
        </a>
      </div>
    </>
  );
}
