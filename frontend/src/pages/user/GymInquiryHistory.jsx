import React, { useEffect, useMemo, useRef, useState } from "react";
import "./GymInquiryHistory.css";
import {
  listMyInquiries,
  askGymInquiry,
  normalizeInquiryListResponse,
} from "../../utils/gymInquiriesApi";
import InquiryComposeModal from "./InquiryComposeModal";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
/* ---------------- helpers ---------------- */
const PH_TZ = "Asia/Manila";

function safeStr(v) {
  return v == null ? "" : String(v);
}

function toDateSafe(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  let s = String(value).trim();
  if (!s) return null;

  // Laravel common: "YYYY-MM-DD HH:mm:ss" (no timezone) → treat as UTC to avoid ambiguous parsing
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    s = s.replace(" ", "T") + "Z";
  }

  // ISO without timezone: "YYYY-MM-DDTHH:mm:ss" → force UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) {
    s = s + "Z";
  }

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function fmtTimeAgo(d) {
  const dt = toDateSafe(d);
  if (!dt) return "";
  const diff = Date.now() - dt.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return dt.toLocaleDateString("en-PH", { timeZone: PH_TZ });
}

function fmtPHDateTime(d) {
  const dt = toDateSafe(d);
  if (!dt) return "";
  return dt.toLocaleString("en-PH", { timeZone: PH_TZ });
}

function pickGymTitle(inq) {
  const g = inq?.gym || inq?.Gym || null;
  return (
    safeStr(g?.gym_name || g?.name || g?.title || "").trim() ||
    `Gym #${inq?.gym_id ?? inq?.gymId ?? "—"}`
  );
}

function pickGymMeta(inq) {
  const g = inq?.gym || inq?.Gym || null;
  return safeStr(g?.address || g?.location || g?.city || g?.barangay || "").trim();
}

function statusLabel(s) {
  const x = safeStr(s).toLowerCase();
  if (x === "open") return "Open";
  if (x === "answered") return "Answered";
  if (x === "closed") return "Closed";
  return x || "—";
}

function buildThreadFromInquiry(inq) {
  const items = [];
  const idBase = inq?.inquiry_id ?? inq?.id ?? "x";

  if (inq?.question) {
    items.push({
      id: `q-${idBase}`,
      who: "me",
      text: safeStr(inq.question),
      at: inq?.created_at,
    });
  }

  if (inq?.answer) {
    items.push({
      id: `a-${idBase}`,
      who: "owner",
      text: safeStr(inq.answer),
      at: inq?.answered_at || inq?.updated_at || inq?.created_at,
    });
  }

  return items;
}

function fmtMoney(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `₱${n.toLocaleString()}`;
}

function fmtHHMM(v) {
  if (!v) return "—";
  const s = String(v);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function truthy(v) {
  return v === true || v === 1 || v === "1" || v === "true";
}

function absUrl(u) {
  if (!u) return "";
  const s = String(u);
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? `${window.location.origin}${s}` : s;
}

function getGymIdFromInquiry(r) {
  const gid = Number(r?.gym_id ?? r?.gymId ?? r?.gym?.id ?? r?.Gym?.id);
  return Number.isFinite(gid) ? gid : null;
}

function getGymFromInquiry(r) {
  return r?.gym || r?.Gym || null;
}

function pickGymTitleFromGym(gym, fallbackGymId) {
  const g = gym || null;
  return (
    safeStr(g?.gym_name || g?.name || g?.title || "").trim() ||
    `Gym #${fallbackGymId ?? "—"}`
  );
}

function pickGymMetaFromGym(gym) {
  const g = gym || null;
  return safeStr(g?.address || g?.location || g?.city || g?.barangay || "").trim();
}

function convStatus(conv) {
  if (!conv?.items?.length) return "—";
  const hasOpen = conv.items.some((i) => safeStr(i?.status).toLowerCase() === "open");
  if (hasOpen) return "Open";
  const hasAnswered = conv.items.some((i) => safeStr(i?.status).toLowerCase() === "answered");
  if (hasAnswered) return "Answered";
  const last = conv.items[conv.items.length - 1];
  return statusLabel(last?.status);
}

/* ---------------- Right panel (FB-style) ---------------- */
function FbSection({ title, children }) {
  return (
    <div className="fb-section">
      <div className="fb-section-title">{title}</div>
      {children}
    </div>
  );
}

function FbRow({ icon, label, value }) {
  if (!safeStr(value).trim()) return null;
  return (
    <div className="fb-row">
      <div className="fb-left">
        <div className="fb-ico" aria-hidden="true">
          {icon}
        </div>
        <div className="fb-k">{label}</div>
      </div>
      <div className="fb-v">{value}</div>
    </div>
  );
}

export default function GymInquiryHistory() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
const navigate = useNavigate();
  // ✅ Active conversation is gym-based
  const [activeGymId, setActiveGymId] = useState(null);

  const [searchLeft, setSearchLeft] = useState("");
  const [searchRight, setSearchRight] = useState("");

  // compose modal
  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // bottom chat composer
  const [chatText, setChatText] = useState("");
  const [chatSending, setChatSending] = useState(false);

  const [theme, setTheme] = useState("orange");

  const listRef = useRef(null);
  const chatRef = useRef(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await listMyInquiries({ per_page: 100 });
      const norm = normalizeInquiryListResponse(res);

      const newRows = norm.rows || [];
      setRows(newRows);
      setMeta(norm.meta || null);

      // keep activeGymId if still exists; else pick first available
      const current = activeGymId;
      const hasCurrent =
        current != null &&
        newRows.some((r) => {
          const gid = getGymIdFromInquiry(r);
          return gid === current;
        });

      if (!hasCurrent) {
        const first = newRows[0];
        const firstGid = getGymIdFromInquiry(first);
        setActiveGymId(firstGid || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  // ✅ conversations grouped by gym
  const conversations = useMemo(() => {
    const map = new Map(); // gymId -> { gymId, gym, items: [] }

    for (const r of rows) {
      const gid = getGymIdFromInquiry(r);
      if (!gid || gid <= 0) continue;

      if (!map.has(gid)) {
        map.set(gid, { gymId: gid, gym: getGymFromInquiry(r), items: [] });
      }
      const bucket = map.get(gid);

      if (!bucket.gym) bucket.gym = getGymFromInquiry(r);

      bucket.items.push(r);
    }

    const list = Array.from(map.values()).map((c) => {
      // oldest -> newest by created
      c.items.sort((a, b) => {
        const ta = toDateSafe(a?.created_at || a?.updated_at || 0)?.getTime() ?? 0;
        const tb = toDateSafe(b?.created_at || b?.updated_at || 0)?.getTime() ?? 0;
        return ta - tb;
      });

      const last = c.items[c.items.length - 1];
      const lastAt = last?.answered_at || last?.updated_at || last?.created_at || null;

      return { ...c, last, lastAt };
    });

    // newest first by last activity
    list.sort((a, b) => {
      const ta = toDateSafe(a.lastAt || 0)?.getTime() ?? 0;
      const tb = toDateSafe(b.lastAt || 0)?.getTime() ?? 0;
      return tb - ta;
    });

    return list;
  }, [rows]);

  const filteredLeft = useMemo(() => {
    const q = searchLeft.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((c) => {
      const gymTitle = pickGymTitleFromGym(c.gym, c.gymId).toLowerCase();
      const anyMatch = c.items.some((r) => {
        const msg = safeStr(r?.question).toLowerCase();
        const ans = safeStr(r?.answer).toLowerCase();
        return msg.includes(q) || ans.includes(q);
      });
      return gymTitle.includes(q) || anyMatch;
    });
  }, [conversations, searchLeft]);

  const activeConv = useMemo(() => {
    if (!activeGymId) return null;
    return conversations.find((c) => c.gymId === activeGymId) || null;
  }, [conversations, activeGymId]);

  const thread = useMemo(() => {
    if (!activeConv) return [];

    const items = [];
    for (const inq of activeConv.items) {
      items.push(...buildThreadFromInquiry(inq));
    }

    const q = searchRight.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => safeStr(m.text).toLowerCase().includes(q));
  }, [activeConv, searchRight]);

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [activeGymId, thread.length]);

  const onOpenCompose = () => setComposeOpen(true);

  // ✅ called by modal (modal calls onSend(gymId, question))
  const onSendFromModal = async (gymId, question) => {
    setSending(true);
    try {
      await askGymInquiry(gymId, { question });
      setComposeOpen(false);
      setActiveGymId(Number(gymId));
      await refresh();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to send inquiry");
      throw e;
    } finally {
      setSending(false);
    }
  };

  const onSendChat = async () => {
    const text = chatText.trim();
    if (!text) return;

    const gid = Number(activeGymId);
    if (!Number.isFinite(gid) || gid <= 0) return alert("Select a gym first.");

    setChatSending(true);
    try {
      await askGymInquiry(gid, { question: text });

      setChatText("");
      await refresh();
      setActiveGymId(gid);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to send message");
    } finally {
      setChatSending(false);
    }
  };

  const gym = activeConv?.gym || null;

  const socials = useMemo(() => {
    if (!gym) return [];
    const arr = [];
    if (safeStr(gym?.website).trim()) arr.push({ label: "Website", value: safeStr(gym.website) });
    if (safeStr(gym?.facebook_page).trim())
      arr.push({ label: "Facebook", value: safeStr(gym.facebook_page) });
    if (safeStr(gym?.instagram_page).trim())
      arr.push({ label: "Instagram", value: safeStr(gym.instagram_page) });
    return arr;
  }, [gym]);

  return (
    <div className="ih-page">
      <div className="ih-bg" aria-hidden="true">
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>

      <div className="app" ref={listRef}>
        {/* TOP HEADER */}
        <div className="header">
          <div className="logo">
            <svg viewBox="0 0 513 513" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M256.025.05C117.67-2.678 3.184 107.038.025 245.383a240.703 240.703 0 0085.333 182.613v73.387c0 5.891 4.776 10.667 10.667 10.667a10.67 10.67 0 005.653-1.621l59.456-37.141a264.142 264.142 0 0094.891 17.429c138.355 2.728 252.841-106.988 256-245.333C508.866 107.038 394.38-2.678 256.025.05z" />
              <path
                d="M330.518 131.099l-213.825 130.08c-7.387 4.494-5.74 15.711 2.656 17.97l72.009 19.374a9.88 9.88 0 007.703-1.094l32.882-20.003-10.113 37.136a9.88 9.88 0 001.083 7.704l38.561 63.826c4.488 7.427 15.726 5.936 18.003-2.425l65.764-241.49c2.337-8.582-7.092-15.72-14.723-11.078zM266.44 356.177l-24.415-40.411 15.544-57.074c2.336-8.581-7.093-15.719-14.723-11.078l-50.536 30.744-45.592-12.266L319.616 160.91 266.44 356.177z"
                fill="#fff"
              />
            </svg>
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search inquiries..."
              value={searchLeft}
              onChange={(e) => setSearchLeft(e.target.value)}
            />
          </div>

          <div className="user-settings">
            <div className="header-pill">
              {meta?.total != null ? `${meta.total} inquiries` : "Inquiries"}
            </div>
          </div>
        </div>

        <div className="wrapper">
          {/* LEFT LIST */}
          <div className="conversation-area">
            <div className="ih-left-header">
              <div className="ih-left-title">
                <div className="ih-left-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a4 4 0 01-4 4H7l-4 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
                    <path d="M7.5 8.5h9M7.5 12h6" />
                  </svg>
                </div>

                <div className="ih-left-text">
                  <div className="ih-left-h1">Inquiries</div>
                  <div className="ih-left-sub">{loading ? "Loading…" : `${filteredLeft.length} shown`}</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="ih-empty">
                <div className="ih-empty-title">Loading…</div>
                <div className="ih-empty-sub">Fetching your inquiry history</div>
              </div>
            ) : filteredLeft.length === 0 ? (
              <div className="ih-empty">
                <div className="ih-empty-title">No inquiries yet</div>
                <div className="ih-empty-sub">Tap the plus button to ask a gym.</div>
              </div>
            ) : (
              filteredLeft.map((c) => {
                const isActive = c.gymId === activeGymId;
                const gymTitle = pickGymTitleFromGym(c.gym, c.gymId);
                const last = c.last;
                const snippet = safeStr(last?.answer || last?.question || "").trim() || "—";
                const t = fmtTimeAgo(c.lastAt);
                const online = safeStr(last?.status).toLowerCase() === "answered";

                return (
                  <div
                    key={c.gymId}
                    className={`msg ${isActive ? "active" : ""} ${online ? "online" : ""}`}
                    onClick={() => setActiveGymId(c.gymId)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="msg-profile group">
                      <svg
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2zM12 22v-6.5" />
                        <path d="M22 8.5l-10 7-10-7" />
                        <path d="M2 15.5l10-7 10 7M12 2v6.5" />
                      </svg>
                    </div>

                    <div className="msg-detail">
                      <div className="msg-username">{gymTitle}</div>
                      <div className="msg-content">
                        <span className="msg-message">{snippet}</span>
                        <span className="msg-date">{t}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div className="overlay" />
            <button className="add" onClick={onOpenCompose} type="button" aria-label="New inquiry" />
          </div>

          {/* MIDDLE CHAT */}
          <div className="chat-area">
            <div className="chat-area-header">
              <div className="chat-area-title">
                {activeConv ? pickGymTitleFromGym(gym, activeConv.gymId) : "Select an inquiry"}
              </div>
<div className="chat-area-group">
    {activeConv && (
      <button
        type="button"
        className="ih-open-gym-btn"
        onClick={() => navigate(`/home/gym/${activeConv.gymId}`)}
        title="Open gym page"
        aria-label="Open gym page"
      >
        <ExternalLink size={18} />
      </button>
    )}
  </div>
            </div>

            <div className="chat-area-main" ref={chatRef}>
              {!activeConv ? (
                <div className="ih-chat-empty">
                  <div className="ih-chat-empty-title">No inquiry selected</div>
                  <div className="ih-chat-empty-sub">Choose one on the left, or tap the plus button.</div>
                </div>
              ) : thread.length === 0 ? (
                <div className="ih-chat-empty">
                  <div className="ih-chat-empty-title">No matching messages</div>
                  <div className="ih-chat-empty-sub">Try another search term.</div>
                </div>
              ) : (
                thread.map((m) => {
                  const isOwner = m.who === "owner";
                  return (
                    <div key={m.id} className={`chat-msg ${isOwner ? "owner" : ""}`}>
                      <div className="chat-msg-profile">
                        <div className="ih-avatar">{isOwner ? "G" : "You"}</div>
                        <div className="chat-msg-date">{fmtPHDateTime(m.at)}</div>
                      </div>
                      <div className="chat-msg-content">
                        <div className="chat-msg-text">{m.text}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="chat-area-footer">
              <input
                type="text"
                placeholder={activeConv ? "Type a message…" : "Select an inquiry first…"}
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                disabled={!activeConv || chatSending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSendChat();
                  }
                }}
              />

              <button
                type="button"
                className="ih-send-btn"
                onClick={onSendChat}
                disabled={!activeConv || chatSending || !chatText.trim()}
                aria-label="Send"
                title="Send"
              >
                {chatSending ? "…" : "Send"}
              </button>
            </div>
          </div>

          {/* RIGHT DETAILS */}
          <div className="detail-area">
            <div className="detail-area-header">
              <div className="detail-title">
                {activeConv ? pickGymTitleFromGym(gym, activeConv.gymId) : "Select a gym"}
              </div>
              <div className="detail-subtitle">
                {activeConv ? pickGymMetaFromGym(gym) : "Select an inquiry"}
              </div>
            </div>

            <div className="detail-changes">
              <input
                type="text"
                placeholder="Search in Conversation"
                value={searchRight}
                onChange={(e) => setSearchRight(e.target.value)}
              />

              <div className="detail-change">
                Change Color
                <div className="colors">
                  <div
                    className={`color orange ${theme === "orange" ? "selected" : ""}`}
                    onClick={() => setTheme("orange")}
                    role="button"
                    tabIndex={0}
                  />
                  <div
                    className={`color purple ${theme === "purple" ? "selected" : ""}`}
                    onClick={() => setTheme("purple")}
                    role="button"
                    tabIndex={0}
                  />
                  <div
                    className={`color green ${theme === "green" ? "selected" : ""}`}
                    onClick={() => setTheme("green")}
                    role="button"
                    tabIndex={0}
                  />
                  <div
                    className={`color blue ${theme === "blue" ? "selected" : ""}`}
                    onClick={() => setTheme("blue")}
                    role="button"
                    tabIndex={0}
                  />
                </div>
              </div>

              <div className="fb-info">
                <FbSection title="GYM DETAILS">
                  <FbRow
                    icon="🕒"
                    label="Hours"
                    value={
                      gym
                        ? `${fmtHHMM(gym?.opening_time)} – ${fmtHHMM(gym?.closing_time)}${
                            truthy(gym?.is_24_hours) ? " • 24 Hours" : ""
                          }`
                        : ""
                    }
                  />
                  <FbRow
                    icon="💳"
                    label="Pricing"
                    value={
                      gym
                        ? `${fmtMoney(gym?.daily_price)} • ${fmtMoney(gym?.monthly_price)}${
                            gym?.annual_price ? ` • ${fmtMoney(gym?.annual_price)}` : ""
                          }`
                        : ""
                    }
                  />
                  <FbRow icon="🏷️" label="Type" value={safeStr(gym?.gym_type)} />
                </FbSection>

                <FbSection title="CONTACT">
                  <FbRow icon="📞" label="Phone" value={safeStr(gym?.contact_number)} />
                  <FbRow icon="✉️" label="Email" value={safeStr(gym?.email)} />

                  {socials.map((s) => (
                    <div className="fb-row" key={s.label}>
                      <div className="fb-left">
                        <div className="fb-ico" aria-hidden="true">
                          🔗
                        </div>
                        <div className="fb-k">{s.label}</div>
                      </div>
                      <div className="fb-v">
                        <a className="fb-link" href={absUrl(s.value)} target="_blank" rel="noreferrer">
                          {s.value}
                        </a>
                      </div>
                    </div>
                  ))}
                </FbSection>
              </div>
            </div>

            <a className="follow-me" href="#" onClick={(e) => e.preventDefault()}>
              <span className="follow-text">ExerSearch — Inquiries</span>
              <span className="developer">
                <div className="ih-dev-avatar">ES</div>
                Support Inbox
              </span>
            </a>
          </div>
        </div>

        {/* ✅ compose modal */}
        {composeOpen && (
          <InquiryComposeModal
            onClose={() => setComposeOpen(false)}
            onSend={onSendFromModal}
            initialGym={null}
            sending={sending}
          />
        )}
      </div>
    </div>
  );
}