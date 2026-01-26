import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HF.css';
import logo from '../../assets/exersearchlogo.png';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.pageYOffset > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Logo" />
          </Link>
        </div>

        <nav className="nav-links">
          <Link to="/login">LOGIN</Link>
        </nav>

        <div className="hamburger" onClick={toggleMobileMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </header>
    {/* NEW: Secondary Navigation */}
    <div className={`secondary-nav ${isScrolled ? 'secondary-nav--scrolled' : ''}`}>
      <div className="secondary-nav-container">
        <Link to="/reviews" className="secondary-nav-link">Reviews</Link>
        <Link to="/how-it-works" className="secondary-nav-link">How It Works</Link>
        <Link to="/apps" className="secondary-nav-link">About Us</Link>
        <Link to="/philosophy" className="secondary-nav-link">Our Philosophy</Link>
        <Link to="/advertise" className="secondary-nav-link">FAQs</Link>
      </div>
    </div>
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <Link to="/gym" onClick={() => setMobileMenuOpen(false)}>GYM</Link>
        <Link to="/nearby" onClick={() => setMobileMenuOpen(false)}>NEARBY</Link>
        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>LOGIN</Link>
      </div>
    </>
  );
}
