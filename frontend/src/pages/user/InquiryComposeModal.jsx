import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Search, Bookmark, BookmarkCheck, ExternalLink, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./InquiryComposeModal.css";

import {
  listSavedGyms,
  saveGym,
  unsaveGym,
} from "../../utils/gymInquiriesApi";

import { api } from "../../utils/apiClient";

function safeStr(v) {
  return v == null ? "" : String(v);
}

function safeArr(v) {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.data?.data)) return v.data.data;
  return [];
}

function pickId(g) {
  return Number(g?.gym_id ?? g?.id ?? g?.gymId ?? 0) || 0;
}

function pickName(g) {
  return (
    safeStr(g?.gym_name || g?.name || g?.title || "").trim() ||
    `Gym #${pickId(g) || "—"}`
  );
}

function pickAddress(g) {
  return safeStr(g?.address || g?.location || g?.city || g?.barangay || "").trim();
}

function initialLetter(g) {
  const n = pickName(g);
  return (n.trim()[0] || "G").toUpperCase();
}

/**
 * InquiryComposeModal
 *
 * Props:
 * - onClose(): void
 * - onSend(gymId:number, question:string): Promise<void> | void   ✅ parent will send + refresh
 * - initialGym?: gym object (optional)
 */
export default function InquiryComposeModal({ onClose, onSend, initialGym = null }) {
  const navigate = useNavigate();

  const [tab, setTab] = useState("saved"); // "saved" | "search"

  const [savedLoading, setSavedLoading] = useState(true);
  const [savedRows, setSavedRows] = useState([]);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchRows, setSearchRows] = useState([]);

  const [selectedGym, setSelectedGym] = useState(initialGym);

  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef(null);
  const searchTimerRef = useRef(null);

  const savedIds = useMemo(() => {
    const s = new Set();
    savedRows.forEach((g) => s.add(pickId(g)));
    return s;
  }, [savedRows]);

  const isSavedSelected = selectedGym ? savedIds.has(pickId(selectedGym)) : false;

  const loadSaved = async () => {
    setSavedLoading(true);
    try {
      const res = await listSavedGyms();
      const rows = safeArr(res?.data ?? res);
      setSavedRows(rows);
    } catch (e) {
      setSavedRows([]);
    } finally {
      setSavedLoading(false);
    }
  };

  const searchGyms = async (q) => {
    const query = safeStr(q).trim();
    if (!query) {
      setSearchRows([]);
      return;
    }

    setSearchLoading(true);
    try {
      // If your baseURL is NOT /api/v1, change "/gyms" -> "/api/v1/gyms"
      const res = await api.get("/gyms", { params: { q: query, per_page: 20 } });
      const rows = safeArr(res?.data?.data ?? res?.data ?? res);
      setSearchRows(rows);
    } catch (e) {
      setSearchRows([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab !== "search") return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchGyms(searchQ), 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQ, tab]);

  const activeList = tab === "saved" ? savedRows : searchRows;
  const activeLoading = tab === "saved" ? savedLoading : searchLoading;

  const onToggleSave = async (gym) => {
    const id = pickId(gym);
    if (!id) return;

    const currentlySaved = savedIds.has(id);

    try {
      if (currentlySaved) {
        await unsaveGym(id);
      } else {
        await saveGym(id);
      }
      await loadSaved();
    } catch (e) {
      Swal.fire("Oops", e?.response?.data?.message || "Failed to update saved gyms.", "error");
    }
  };

  const onClearSelected = () => {
    setSelectedGym(null);
  };

  const onOpenDetails = () => {
    if (!selectedGym) return;
    const id = pickId(selectedGym);
    if (!id) return;
    navigate(`/home/gym/${id}`);
  };

  const onSubmit = async () => {
    const gId = pickId(selectedGym);
    const q = safeStr(question).trim();

    if (!gId) return Swal.fire("Select a gym", "Please choose a gym first.", "info");
    if (!q) return Swal.fire("Type your question", "Your message is empty.", "info");

    setSending(true);
    try {
      // ✅ IMPORTANT CHANGE:
      // Call parent so it can send + refresh the main page immediately
      await onSend?.(gId, q);

      // keep UX the same: clear + close
      setQuestion("");
      onClose?.();
    } catch (e) {
      Swal.fire("Failed", e?.response?.data?.message || "Failed to send inquiry.", "error");
      throw e;
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="im-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="im-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="im-header">
          <div>
            <h2 className="im-title">New Inquiry</h2>
            <p className="im-subtitle">Select a gym, then send your question.</p>
          </div>

          <button type="button" className="im-close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <div className="im-tabs">
          <button
            type="button"
            className={`im-tab ${tab === "saved" ? "im-tab--active" : ""}`}
            onClick={() => setTab("saved")}
          >
            <Bookmark size={18} />
            Saved gyms
          </button>

          <button
            type="button"
            className={`im-tab ${tab === "search" ? "im-tab--active" : ""}`}
            onClick={() => setTab("search")}
          >
            <Search size={18} />
            Search gyms
          </button>
        </div>

        <div className="im-body">
          <div className="im-left">
            <div className="im-panelTitle">{tab === "saved" ? "Saved gyms" : "Search gyms"}</div>

            {tab === "search" ? (
              <div className="im-searchBox">
                {searchLoading ? <Loader2 className="im-spin" size={18} /> : <Search size={18} />}
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search by name, city, barangay…"
                />
              </div>
            ) : null}

            <div className="im-list" ref={listRef}>
              {activeLoading ? (
                <div className="im-muted">Loading…</div>
              ) : activeList.length === 0 ? (
                <div className="im-empty">
                  <div className="im-emptyTitle">
                    {tab === "saved" ? "No saved gyms yet" : "No results"}
                  </div>
                  <div className="im-emptySub">
                    {tab === "saved"
                      ? "Save gyms you often message so you can select them quickly next time."
                      : "Try another keyword."}
                  </div>
                </div>
              ) : (
                activeList.map((g) => {
                  const id = pickId(g);
                  const name = pickName(g);
                  const addr = pickAddress(g);
                  const active = selectedGym && pickId(selectedGym) === id;
                  const saved = savedIds.has(id);

                  return (
                    <div
                      key={id || name}
                      className={`im-gymRow ${active ? "im-gymRow--active" : ""}`}
                      onClick={() => setSelectedGym(g)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="im-gymAvatar">{initialLetter(g)}</div>

                      <div className="im-gymMain">
                        <div className="im-gymName">{name}</div>
                        <div className="im-gymMeta">{addr || "—"}</div>
                      </div>

                      <button
                        type="button"
                        className={`im-saveBtn ${saved ? "im-saveBtn--on" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(g);
                        }}
                        aria-label={saved ? "Unsave gym" : "Save gym"}
                        title={saved ? "Saved" : "Save"}
                      >
                        {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="im-right">
            <div className="im-panelTitle">Selected gym</div>

            {selectedGym ? (
              <div className="im-selectedCard">
                <div className="im-selectedTop">
                  <div className="im-selectedAvatar">{initialLetter(selectedGym)}</div>

                  <div className="im-selectedMain">
                    <div className="im-selectedNameRow">
                      <div className="im-selectedName">{pickName(selectedGym)}</div>

                      <div className="im-selectedIconActions">
                        <button
                          type="button"
                          className={`im-iconBtn ${isSavedSelected ? "is-on" : ""}`}
                          onClick={() => onToggleSave(selectedGym)}
                          aria-label={isSavedSelected ? "Unsave gym" : "Save gym"}
                          title={isSavedSelected ? "Saved" : "Save"}
                        >
                          {isSavedSelected ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>

                        <button
                          type="button"
                          className="im-iconBtn"
                          onClick={onOpenDetails}
                          aria-label="Open gym details"
                          title="View details"
                        >
                          <ExternalLink size={18} />
                        </button>

                        <button
                          type="button"
                          className="im-iconBtn danger"
                          onClick={onClearSelected}
                          aria-label="Clear selection"
                          title="Clear"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="im-selectedEmpty">Select a gym from Saved or Search.</div>
            )}

            <div className="im-panelTitle">Your question</div>

            <textarea
              className="im-textarea"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about rates, schedules, promos, rules…"
              rows={6}
              style={{ minHeight: 170 }}
            />

            <div className="im-actions">
              <button type="button" className="im-btnGhost" onClick={onClose} disabled={sending}>
                Cancel
              </button>

              <button
                type="button"
                className="im-btnPrimary"
                onClick={onSubmit}
                disabled={sending || !safeStr(question).trim() || !selectedGym}
              >
                {sending ? (
                  <>
                    <div className="im-spinner" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send inquiry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="im-footHint">
          Tip: Save gyms you often ask so you can select them quickly next time.
        </div>
      </div>
    </div>
  );
}