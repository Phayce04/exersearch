import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Sparkles, CheckCircle2 } from "lucide-react";
import "./GiftRevealModal.css";

function safeText(v, fallback = "") {
  const s = String(v ?? "").trim();
  return s || fallback;
}

export default function GiftRevealModal({
  open,
  onClose,
  gymName,
  status = "claimed", // claimed | used
  claimCode,
}) {
  const isUsed = String(status) === "used";

  const [opened, setOpened] = useState(false);
  const [burst, setBurst] = useState(false);

  const burstTimer = useRef(null);
  const hasCelebrated = useRef(false);

  const title = useMemo(() => (isUsed ? "Visit Verified!" : "First Visit Claimed!"), [isUsed]);

  useEffect(() => {
    if (!open) {
      setOpened(false);
      setBurst(false);
      hasCelebrated.current = false;
      if (burstTimer.current) clearTimeout(burstTimer.current);
      return;
    }

    setOpened(isUsed); // used -> show immediately
    setBurst(false);
    hasCelebrated.current = isUsed;

    return () => {
      if (burstTimer.current) clearTimeout(burstTimer.current);
    };
  }, [open, isUsed]);

  function fireConfettiOnce() {
    if (hasCelebrated.current) return;
    hasCelebrated.current = true;
    setBurst(true);
    if (burstTimer.current) clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst(false), 1100);
  }

  function reveal() {
    if (isUsed) return;
    if (!opened) {
      setOpened(true);
      fireConfettiOnce();
    }
  }

  const confettiCount = 46;
  const confetti = Array.from({ length: confettiCount });

  if (!open) return null;

  return (
    <div className="grm-overlay" role="dialog" aria-modal="true">
      <div className="grm-modal grm-modalLg">
        <button className="grm-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="grm-head">
          <div className="grm-badge">
            {isUsed ? (
              <>
                <CheckCircle2 size={16} />
                USED
              </>
            ) : (
              <>
                <Sparkles size={16} />
                CLAIMED
              </>
            )}
          </div>

          <div className="grm-title">{title}</div>
          <div className="grm-sub">{safeText(gymName, "Gym")}</div>
        </div>

        {/* Taller stage + reserved space so pop-up never overlaps header */}
        <div className={`grm-stage2 ${opened ? "is-open" : ""}`}>
          <div className="grm-center">
            {burst ? (
              <div className="grm-confettiWrap" aria-hidden="true">
                {confetti.map((_, i) => (
                  <span key={i} className={`grm-confetti2 p${i % 12}`} />
                ))}
              </div>
            ) : null}

            <div className="grm-boxShell">
              <button
                type="button"
                className="grm-boxBtn"
                onClick={reveal}
                onMouseEnter={reveal}
                onFocus={reveal}
                disabled={isUsed}
                aria-label="Reveal claim code"
                title={isUsed ? "Already used" : "Hover or click to reveal"}
              >
                <div className="grm-boxBody3">
                  {/* Popped content (dark text, white pill background) */}
                  <div className={`grm-popCard ${opened ? "show" : ""}`}>
                    <div className="grm-popLabel">Claim Code</div>
                    <div className="grm-popValue">{claimCode ? String(claimCode) : "—"}</div>
                  </div>

                  {/* center ribbon */}
                  <div className="grm-ribbonStripe" aria-hidden="true" />

                  {/* lid */}
                  <div className="grm-boxLid3" aria-hidden="true">
                    <div className="grm-ribbonStripe grm-ribbonStripeLid" />
                    <div className="grm-bowtie3" />
                  </div>
                </div>
              </button>

              <div className={`grm-hint ${isUsed ? "muted" : ""}`}>
                {isUsed ? "This code is already used." : "Hover or click the gift to reveal your code."}
              </div>

              <div className="grm-tip2">Tip: screenshot this claim before you go.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}