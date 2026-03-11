import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Home, LogOut, Mail } from "lucide-react";
import "./login.css";
import { api } from "../../utils/apiClient";

const LOGO_LEFT_SRC = "/src/assets/exersearchlogo.png";

export default function VerifyEmail() {
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const verified = searchParams.get("verified");
  const error = searchParams.get("error");

  useEffect(() => {
    if (!verified) return;

    const t = setTimeout(() => {
      checkVerified();
    }, 600);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified]);

  const resend = async () => {
    if (!token) {
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
      return;
    }

    setSending(true);
    try {
      await api.post(
        "/email/verification-notification",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSent(true);
      alert("Verification email sent. Please check your inbox or spam folder.");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to resend verification email.");
    } finally {
      setSending(false);
    }
  };

  const checkVerified = async () => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setChecking(true);
    try {
      const res = await api.get("/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.email_verified_at) {
        navigate("/home", { replace: true });
        return;
      }

      alert("Not verified yet. Please click the link in your email first.");
    } catch (e) {
      localStorage.removeItem("token");
      alert("Session expired. Please login again.");
      navigate("/login", { replace: true });
    } finally {
      setChecking(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="auth-left__photo" />
        <div className="auth-left__content">
          <div className="auth-logo">
            <img
              className="auth-logo__wordmark"
              src={LOGO_LEFT_SRC}
              alt="ExerSearch"
            />
          </div>

          <div className="auth-left__copy">
            <div className="auth-left__tag">
              <div className="auth-left__tag-line" />
              <span className="auth-left__tag-text">Almost done</span>
            </div>

            <h1 className="auth-left__title">
              Check Your
              <br />
              <em>Email</em> Inbox
            </h1>

            <p className="auth-left__desc">
              Verify your email to activate your account and continue using
              ExerSearch.
            </p>

            <div className="auth-left__stats">
              <div>
                <div className="auth-left__stat-num">Fast</div>
                <div className="auth-left__stat-label">One-click verification</div>
              </div>
              <div>
                <div className="auth-left__stat-num">Secure</div>
                <div className="auth-left__stat-label">Protected account access</div>
              </div>
              <div>
                <div className="auth-left__stat-num">Ready</div>
                <div className="auth-left__stat-label">Continue after confirming</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right__logo">
          <button
            className="auth-home-btn"
            type="button"
            onClick={() => navigate("/")}
            title="Back to home"
          >
            <Home size={15} strokeWidth={2} />
            Home
          </button>
        </div>

        <div className="auth-right__inner">
          <div className="auth-card auth-view--verify">
            <div className="auth-verify">
              <div className="auth-verify__rings">
                <div className="auth-verify__ring" />
                <div className="auth-verify__ring" />
                <div className="auth-verify__ring" />
                <div className="auth-verify__icon">
                  <Mail size={22} strokeWidth={1.8} />
                </div>
              </div>

              <h2 className="auth-verify__title">Verify your email</h2>

              {verified && (
                <p
                  className="auth-verify__body"
                  style={{ color: "var(--green)", fontWeight: 700 }}
                >
                  Email verified successfully! You can continue to the app.
                </p>
              )}

              {error && (
                <p
                  className="auth-verify__body"
                  style={{ color: "var(--red)", fontWeight: 700 }}
                >
                  Invalid or expired verification link. Please resend and try again.
                </p>
              )}

              {!verified && !error && (
                <p className="auth-verify__body">
                  We sent a verification link to your email. Click it, then come
                  back here.
                </p>
              )}

              <div className="auth-verify__btns">
                <button
                  className="auth-vbtn auth-vbtn--primary"
                  onClick={checkVerified}
                  disabled={checking}
                  type="button"
                >
                  <Check size={15} strokeWidth={2.5} />
                  {checking ? "Checking..." : verified ? "Continue" : "I already verified"}
                </button>

                <button
                  className="auth-vbtn auth-vbtn--outline"
                  onClick={resend}
                  disabled={sending}
                  type="button"
                >
                  <Mail size={14} />
                  {sending ? "Sending..." : "Resend email"}
                </button>

                <button
                  className="auth-vbtn auth-vbtn--ghost"
                  onClick={logout}
                  type="button"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>

              {sent && (
                <p className="auth-verify__ok">
                  Verification email sent. Please check your inbox or spam folder.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}