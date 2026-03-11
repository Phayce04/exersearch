import React from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useTheme } from "./ThemeContext";
import ScrollThemeWidget from "../../utils/ScrollThemeWidget";
import { Home, ArrowRight } from "lucide-react";
import "./NotFound.css";

export default function NotFound() {
  const { isDark } = useTheme();

  return (
    <>
      <Header />
      <div className="nf-page" data-theme={isDark ? "dark" : "light"}>
        
        {/* Animated SVG Train Scene */}
        <div className="nf-scene">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 355" className="nf-svg">
            
            {/* Ocean/Sky Background */}
            <g id="nf-ocean">
              <path id="nf-sky" className="nf-sky" d="M0 0h1000v203.1H0z"/>
              <linearGradient id="nf-water-gradient" gradientUnits="userSpaceOnUse" x1="500" y1="354" x2="500" y2="200.667">
                <stop offset="0" stopColor="var(--nf-water-light)"/>
                <stop offset="1" stopColor="var(--nf-water-dark)"/>
              </linearGradient>
              <path id="nf-water" fill="url(#nf-water-gradient)" d="M0 200.7h1000V354H0z"/>
              <path id="nf-land" className="nf-land" d="M0 273.4h1000V354H0z"/>
              
              {/* Animated Land Bumps */}
              <g id="nf-bumps">
                <path className="nf-land" d="M0 275.2s83.8-28 180-28 197 28 197 28H0z"/>
                <path className="nf-land" d="M377 275.2s54.7-28 117.5-28 128.6 28 128.6 28H377z"/>
                <path className="nf-land" d="M623.2 275.2s83.7-28 179.9-28 196.9 28 196.9 28H623.2z"/>
                <path className="nf-land" d="M-998 275.2s83.8-28 180-28 197 28 197 28h-377z"/>
                <path className="nf-land" d="M-621 275.2s54.7-28 117.5-28 128.6 28 128.6 28H-621z"/>
                <path className="nf-land" d="M-374.8 275.2s83.7-28 179.9-28S2 275.2 2 275.2h-376.8z"/>
              </g>
            </g>

            {/* Animated Railroad Tracks */}
            <g id="nf-tracks">
              {[...Array(100)].map((_, i) => (
                <path key={i} className="nf-track" d={`M${i * 10} 282.4h-3l-6.8 25.2h3z`}/>
              ))}
              <path className="nf-track-bar" d="M-499.5 300.2H1000v5.1H-499.5z"/>
              <path className="nf-track-bar" d="M-499.5 283.8H1000v2.8H-499.5z"/>
            </g>

            {/* Animated Clouds */}
            <g id="nf-clouds">
              <path id="nf-cloud1" className="nf-cloud" d="M19.5 69.7s-21.3.5-25-12.2c0 0-4.3-21.3 16-21.8 0 0-2.1-12.2 12.2-14.9 0 0 15-3.2 21.3 6.9 0 0 3.6-20.7 17.8-22.3 0 0 24-3 26.6 13.1 0 0 .1 9.5-2.8 13.5 0 0 9.5-15 26.5-4.8 0 0 12.1 7.9 7 20.2 0 0 16 4.8 10.1 18.1 0 0-10.2 8.5-17.1-1.1 0 0-5.5 16-32.5 16 0 0-19.1 2.1-27-13.3 0 0 .5 10.1-13.3 10.6-.1 0-20.3 3.2-19.8-8z"/>
              <path id="nf-cloud2" className="nf-cloud" d="M19.3 159.5s-15.9.6-18.8-5.1c0 0-3.4-9.5 11.7-10.1 0 0-1.7-5.5 9-6.9 0 0 11.2-1.7 16 2.8 0 0 2.5-9.4 13.1-10.3 0 0 17.9-1.8 20 5.4 0 0 .2 4.3-2 6.1 0 0 6.9-6.9 19.8-2.6 0 0 9.1 3.4 5.5 9 0 0 6.5 0 4.5 6.7 0 0-2.6 5.6-9.6 1 0 0-4 7.3-24.2 7.7 0 0-14.2 1.3-20.4-5.5 0 0 .5 4.5-9.8 5 0 .1-15 1.8-14.8-3.2z"/>
              <path id="nf-cloud3" className="nf-cloud" d="M836 132s-18.3 2.1-22.2-4.9c0 0-4.9-11.8 12.5-13.8 0 0-2.5-6.8 9.7-9.6 0 0 12.7-3.1 18.7 2.1 0 0 2-12.2 14-14.3 0 0 16.6-3.3 23.7 2.1 0 0 4.8 3.9 2.4 6.5 0 0 3.1-4.8 18.4-.4 0 0 10.9 3.5 7.2 11 0 0 13.8-1.5 9.7 9.5 0 0-4.1 10.8-15.5 4.8 0 0-3.1 5.6-26.4 7.9 0 0-16.3 2.8-24-5.3 0 0 1 5.7-10.8 7.2-.1.1-17.2 3.6-17.4-2.8z"/>
              <path id="nf-cloud4" className="nf-cloud" d="M511.7 12.4s-21.3-.3-25 7c0 0-4.3 12.2 16 12.5 0 0-2.1 7 12.2 8.6 0 0 15 1.8 21.3-4 0 0 3.6 11.9 17.8 12.8 0 0 19.5 1.6 27-4.4 0 0 5-4.4 2.1-6.7 0 0 4.1 4.4 21.2-1.5 0 0 12.1-4.6 7-11.6 0 0 16-2.8 10.1-10.4 0 0-10.2-4.9-17.1.6 0 0-5.5-9.2-32.5-9.2 0 0-19.1-1.2-27 7.6 0 0 .5-5.8-13.3-6.1-.1.2-20.3-1.6-19.8 4.8z"/>
            </g>

            {/* Train */}
            <g id="nf-train">
              <path className="nf-train-body" d="M344.5 248.5h507.2v37.8H344.5z"/>
              
              {/* Wheels */}
              <g id="nf-wheels">
                {[384.1, 416.1, 469.1, 734.1, 766.1, 821.1].map((cx, i) => (
                  <g key={i}>
                    <circle className="nf-wheel" cx={cx} cy="285.6" r="15.1"/>
                    <circle className="nf-wheel-inner" cx={cx} cy="285.6" r="10.1"/>
                  </g>
                ))}
              </g>

              {/* Wheel Braces */}
              <path className="nf-brace" d="M383.2 285.6h88.1"/>
              <path className="nf-brace" d="M733.2 285.6h88.1"/>

              {/* Train Car */}
              <path className="nf-car" d="M321.8 300.7v-32.4s1.2.7-1.5-2.4v-29.1s3.1-11.6 10.7-21.1c0 0 7.6-12 15.5-17.5h1.3s10.2-4.9 30.9-28h.6s-.9-1.4 0-2.7c0 0 10.1-10.5 21-12.3 0 0 9.4-1.8 20.2-1.8h47.7V151H492v-1.1h10.1v1.1h19v2.2s8.2.9 19.2-4.2c0 0 1.4-1.1 28.8-1.1h291.5v6.8h7.5v2.2s12.2-.6 12.2 9.8V177l-10-.1v57.9s14.9-.5 14.9 10.2c0 0 1 9-14.9 8.9v3.8H719.5s-2.4.1-4.3 3l-15 29s-2.9 5.1-10.8 5.1H504.3s-2.9.1-6.1-5l-13.1-25s-4.5-7.1-11.8-7.1H369v2.4s-3.2 1.3-7.1 8.7L351.4 289s-2.9 6.3-6.9 6.4h-17.8l-4.9 5.3z"/>
              
              {/* Streamline */}
              <path className="nf-streamline" d="M320.3 236.6s1.4-6.8 4.4-11.3c0 0 .1-2.3 23.2-6.3l78-16.6s103.3-21.1 134.9-26.1c0 0 93.3-16 120.5-17.9 0 0 57.6-4.3 100-4.1h88.9v63.4s-10.3 5.4-17.1 5.3c0 0-305.6 4.9-366.3 8.1 0 0-100.3 4.8-119.1 6.8 0-.1-46.6 1.2-47.4-1.3z"/>
              
              {/* Window */}
              <g className="nf-window">
                <rect x="739.5" y="161.4" width="114.5" height="26.1" className="nf-window-frame"/>
                <path className="nf-window-line" d="M739.5 182.6H854"/>
                <path className="nf-window-line" d="M739.5 177.6H854"/>
                <path className="nf-window-line" d="M739.5 172.6H854"/>
                <path className="nf-window-line" d="M739.5 167.6H854"/>
              </g>

              {/* Ladders */}
              <g className="nf-ladder">
                <rect x="433.8" y="258.4" width="17.8" height="34.8" className="nf-ladder-frame"/>
                <path className="nf-ladder-rung" d="M433.8 281.1h17.7"/>
                <path className="nf-ladder-rung" d="M433.8 268.6h17.7"/>
              </g>
              <g className="nf-ladder">
                <rect x="851.8" y="257.8" width="17.8" height="34.8" className="nf-ladder-frame"/>
                <path className="nf-ladder-rung" d="M851.8 268.6h17.7"/>
                <path className="nf-ladder-rung" d="M851.8 281.1h17.7"/>
              </g>
            </g>
          </svg>

          {/* 404 Text Overlay */}
          <div className="nf-text-overlay">
            <h1 className="nf-404">404</h1>
            <p className="nf-message">Page Not Found</p>
          </div>
        </div>

        {/* Content Below Scene */}
        <div className="nf-content">
          <p className="nf-subtitle">
            Looks like this page took the wrong track. Let's get you back on course.
          </p>
          
          <Link to="/" className="nf-btn">
            <Home size={20} className="nf-btn-icon" />
            <span>Back to Home</span>
            <ArrowRight size={18} className="nf-btn-arrow" />
          </Link>
        </div>

      </div>
      <Footer />
      <ScrollThemeWidget/>
    </>
  );
}