import React, { useEffect, useRef, useState } from "react";
import { X, Send, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./GymInquiryModal.css";

function safeStr(v) {
  return v == null ? "" : String(v);
}

function pickId(g) {
  return Number(g?.gym_id ?? g?.id ?? g?.gymId ?? 0) || 0;
}

function pickName(g) {
  return safeStr(g?.gym_name || g?.name || g?.title || "").trim() || `Gym #${pickId(g) || "—"}`;
}

export default function GymInquiryModal({
  gym,
  onClose,
  onSend, // (gymId:number, question:string) => Promise<void>
  sending = false,
}) {
  const [question, setQuestion] = useState("");
  const taRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => taRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const gymId = pickId(gym);

  const submit = async () => {
    const q = safeStr(question).trim();
    if (!gymId) return Swal.fire("Missing gym", "Gym ID not found.", "error");
    if (!q) return Swal.fire("Type your question", "Your message is empty.", "info");
    if (sending) return;

    try {
      await onSend?.(gymId, q);
      setQuestion("");
      onClose?.();
    } catch (e) {
      Swal.fire("Failed", e?.response?.data?.message || "Failed to send inquiry.", "error");
    }
  };

  return (
    <div className="gi-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="gi-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="gi-head">
          <div className="gi-titleWrap">
            <div className="gi-title">Inquire Now</div>
            <div className="gi-sub">
              To: <span className="gi-gymName">{pickName(gym)}</span>
            </div>
          </div>

          {/* ✅ Right side header icons */}
          <div style={{ display: "flex", gap: 8 }}>
            {/* Go to inquiries page */}
            <button
              type="button"
              className="gi-iconBtn"
              onClick={() => {
                onClose?.();
                navigate("/home/inquiries");
              }}
              title="Go to My Inquiries"
              aria-label="Go to My Inquiries"
              disabled={sending}
            >
              <MessageSquare size={18} />
            </button>

            {/* Close */}
            <button
              type="button"
              className="gi-x"
              onClick={onClose}
              aria-label="Close"
              disabled={sending}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="gi-body">
          <label className="gi-label">Your message</label>
          <textarea
            ref={taRef}
            className="gi-textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about rates, schedules, promos, rules…"
            rows={6}
            disabled={sending}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
          <div className="gi-hint">Tip: Press Ctrl+Enter to send.</div>
        </div>

        <div className="gi-actions">
          <button
            type="button"
            className="gi-btnGhost"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </button>

          <button
            type="button"
            className="gi-btnPrimary"
            onClick={submit}
            disabled={sending || !safeStr(question).trim() || !gymId}
            aria-label="Send inquiry"
          >
            {sending ? (
              <>
                <div className="gi-spinner" />
                Sending…
              </>
            ) : (
              <>
                <Send size={18} />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}