// ✅ WHOLE FILE: src/pages/Maintenance.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Maintenance.css";

export default function Maintenance() {
  return (
    <div className="mx-page">
      <div className="mx-wrap">
        {/* Top mini nav */}
        <div className="mx-topRow">
          <Link to="/" className="mx-link">
            ← Back to Home
          </Link>

          <div className="mx-pills">
            <span className="mx-pill">Service Unavailable</span>
            <span className="mx-pillMuted">Maintenance Mode</span>
          </div>
        </div>

        {/* Card */}
        <div className="mx-panel">
          <div className="mx-panelTop">
            {/* ✅ BIG Animated gears */}
            <div className="mx-anim" aria-hidden="true">
              <span className="mx-gear mx-gearOne mx-spinOne" />
              <span className="mx-gear mx-gearTwo mx-spinTwo" />
              <span className="mx-gear mx-gearThree mx-spinOne" />
              <span className="mx-animGlow" />
            </div>

            <div className="mx-titleWrap">
              <div className="mx-title">We’re doing maintenance</div>
              <div className="mx-subtitle">
                ExerSearch is temporarily unavailable while we update the system.
                Please try again later.
              </div>

              <div className="mx-actions mx-actionsTop">
                <button
                  className="mx-btn mx-btnSecondary"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>

                <Link to="/" className="mx-btn mx-btnPrimary mx-linkBtn">
                  Go to Home
                </Link>

                <Link to="/login" className="mx-btn mx-btnSecondary mx-linkBtn">
                  Login
                </Link>
              </div>

              <div className="mx-note">
                Tip: If you keep landing here, maintenance is still enabled.
              </div>
            </div>
          </div>

          <div className="mx-panelBody">
            <div className="mx-hints">
              <div className="mx-hint">
                <div className="mx-hintTitle">What you can do</div>
                <ul className="mx-list">
                  <li>Wait a few minutes and try again.</li>
                  <li>Go back to the homepage.</li>
                  <li>If you’re an admin, use the admin panel.</li>
                </ul>
              </div>

              <div className="mx-hint">
                <div className="mx-hintTitle">What’s happening</div>
                <div className="mx-par">
                  We’re deploying updates and doing system checks. This page will
                  disappear once maintenance is turned off by the admin.
                </div>
              </div>
            </div>
          </div>

          <div className="mx-footer">
            <span className="mx-muted">
              Status: <b>Maintenance Mode Enabled</b>
            </span>
            <span className="mx-muted">Error: 503</span>
          </div>
        </div>
      </div>
    </div>
  );
}
