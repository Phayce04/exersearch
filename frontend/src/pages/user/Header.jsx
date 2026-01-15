import { useState } from 'react';
import './HF.css';
import logo from '../../assets/exersearchlogo.png';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <header className="header">
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>

        <nav className="nav-links">
          <a href="#">GYM</a>
          <a href="#">NEARBY</a>
          <a href="#">REGISTER</a>
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