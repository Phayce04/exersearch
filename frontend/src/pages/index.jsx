import React from "react";
import { Link } from "react-router-dom";
import Header from "./user/Header";
import Footer from "./user/Footer";
import sidePic from "../assets/indexsidepic.png";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { SiGmail } from "react-icons/si";

export default function Landing() {
  return (
    <div>
      <Header />

      {/* Add padding-top to account for fixed header when it appears */}
      <main className="main" style={{ minHeight: '100vh' }}>
        <div className="main-left">
          <h1 className="hero-title">FIND YOUR FIT</h1>
          <p className="hero-subtext">
            Search gyms, build strength, and live healthier with ExerSearch.
          </p>

          <label className="search-label">Find Gyms Near You</label>
          <div className="search-box">
            <span className="search-icon">&#128269;</span>
            <input type="text" placeholder="Search by location or gym name" />
          </div>

          <button className="membership-btn">Get Membership</button>

          <div className="social-links">
            <a href="#" className="social fb">
              <FaFacebook size={25} />
            </a>
            <a href="#" className="social ig">
              <FaInstagram size={25} />
            </a>
            <a href="#" className="social wa">
              <SiGmail size={25} />
            </a>
          </div>
        </div>

        <div className="main-right">
          <img 
            src={sidePic} 
            alt="Fitness Illustration" 
            className="right-img" 
          />
        </div>
      </main>

      {/* Extra content to ensure scrolling works */}
      <div style={{ height: '100vh', background: 'linear-gradient(to bottom, #f0f0f0, #ffffff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: '#d23f0b' }}>Scroll to see more content</h2>
      </div>

      <Footer />
    </div>
  );
}