import { useState, useEffect } from 'react';
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
          <img src={logo} alt="Logo" />
        </div>

        <nav className="nav-links">
          <a href="/login">LOGIN</a>
          <a href="#">SIGN UP</a>
        </nav>

        <div className="hamburger" onClick={toggleMobileMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </header>

      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#" onClick={() => setMobileMenuOpen(false)}>GYM</a>
        <a href="#" onClick={() => setMobileMenuOpen(false)}>NEARBY</a>
        <a href="#" onClick={() => setMobileMenuOpen(false)}>REGISTER</a>
      </div>
    </>
  );
}