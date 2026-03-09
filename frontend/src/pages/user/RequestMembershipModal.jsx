import React, { useMemo, useState, useEffect } from "react";
import { X, AlertCircle, Send, CalendarDays } from "lucide-react";
import "./modaluser.css";
import Swal from "sweetalert2";
import { createOrUpdateMembershipIntent } from "../../utils/membershipApi";

function toInputDate(value) {
  if (!value) return "";
  const s = String(value).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

export default function RequestMembershipModal({ gym, onClose, onSuccess }) {
  const gymId = gym?.gym_id ?? gym?.id;

  const planOptions = useMemo(() => {
    const out = [];
    const daily = Number(gym?.daily_price || 0) > 0;
    const monthly = Number(gym?.monthly_price || 0) > 0;
    const annual = Number(gym?.annual_price || 0) > 0;

    if (daily) out.push({ value: "daily", label: "Daily" });
    if (monthly) out.push({ value: "monthly", label: "Monthly" });
    if (annual) out.push({ value: "annual", label: "Annual" });

    if (!out.length) {
      out.push({ value: "monthly", label: "Monthly" });
      out.push({ value: "daily", label: "Daily" });
      out.push({ value: "annual", label: "Annual" });
    }

    return out;
  }, [gym]);

  const [form, setForm] = useState({
    plan_type: planOptions[0]?.value || "monthly",
    desired_start_date: "",
    note: "",
  });

  useEffect(() => {
    setForm((p) => {
      const first = planOptions[0]?.value || "monthly";
      const ok = planOptions.some((o) => String(o.value) === String(p.plan_type));
      return { ...p, plan_type: ok ? p.plan_type : first };
    });
  }, [planOptions]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!gymId) {
      setError("Missing gym id.");
      return;
    }

    if (!form.plan_type) {
      setError("Please choose a plan.");
      return;
    }

    const payload = {
      plan_type: form.plan_type,
      desired_start_date: form.desired_start_date || null,
      notes: form.note || null,
    };

    try {
      setLoading(true);
      await createOrUpdateMembershipIntent(gymId, payload);
      await Swal.fire(
        "Sent!",
        "Your membership request was sent to the gym owner.",
        "success"
      );
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send membership request.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rm-overlay" onMouseDown={onClose}>
      <div className="rm-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rm-header">
          <div>
            <h2 className="rm-title">Get Membership</h2>
            <p className="rm-subtitle">{gym?.name || "Gym"}</p>
          </div>

          <button className="rm-close" onClick={onClose} type="button">
            <X size={24} />
          </button>
        </div>

        {error ? (
          <div className="rm-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={submit} className="rm-form">
          <div className="rm-group">
            <label className="rm-label">Plan</label>
            <select
              className="rm-input"
              value={form.plan_type}
              onChange={(e) => setField("plan_type", e.target.value)}
              required
            >
              {planOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rm-group">
            <label className="rm-label">Desired start date</label>
            <div className="rm-inputIconWrap">
              <span className="rm-inputIcon">
                <CalendarDays size={18} />
              </span>
              <input
                type="date"
                className="rm-input"
                value={toInputDate(form.desired_start_date)}
                onChange={(e) => setField("desired_start_date", e.target.value)}
              />
            </div>
          </div>

          <div className="rm-group">
            <label className="rm-label">Message</label>
            <textarea
              className="rm-input rm-textarea"
              rows={4}
              value={form.note}
              onChange={(e) => setField("note", e.target.value)}
              placeholder="Optional note for the owner (e.g. preferred schedule, questions)"
            />
          </div>

          <div className="rm-footnote">
            This will notify the gym owner. Payment is handled directly at the gym.
          </div>
        </form>

        <div className="rm-actions">
          <div />
          <div className="rm-actionGroup">
            <button
              type="button"
              className="rm-btnSecondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button type="submit" className="rm-btnPrimary" disabled={loading} onClick={submit}>
              {loading ? (
                <>
                  <div className="rm-spinner"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}