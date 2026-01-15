import './HF.css';
import footerLogo from '../../assets/footerimg.png';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col logo-col">
          <img src={footerLogo} alt="ExerSearch Logo" className="footer-logo" />
          <p className="footer-desc">
            ExerSearch helps you find affordable gyms, workouts, and nutrition plans
            to match your fitness goals.
          </p>
        </div>

        <div className="footer-col">
          <h4>EXPLORE</h4>
          <button>Home</button>
          <button>Gym</button>
          <button>Nearby</button>
          <button>Map</button>
          <button>Discover</button>
        </div>

        <div className="footer-col">
          <h4>LEARN</h4>
          <button>Nutrition</button>
          <button>Exercises</button>
          <button>Trainers</button>
          <button>FAQs</button>
          <button>Guides</button>
        </div>

        <div className="footer-col">
          <h4>ACCOUNT & LEGAL</h4>
          <button>Log In</button>
          <button>Sign Up</button>
          <button>Terms</button>
          <button>Privacy</button>
          <button>Security</button>
        </div>

        <div className="footer-col">
          <h4>SUPPORT</h4>
          <button>Help Center</button>
          <button>Contact</button>
          <button>Feedback</button>
          <button>Community</button>
          <button>Status</button>
        </div>
      </div>

      <div className="footer-bottom">
        <hr/>
        <p>© 2025 All rights reserved. ExerSearch</p>
      </div>
    </footer>
  );
}