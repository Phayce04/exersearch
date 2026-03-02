import React, { useEffect, useMemo, useState } from "react";
import { X, AlertCircle, Save, Search, CheckSquare, Square, Plus, Minus } from "lucide-react";
import "./Modals.css";

import { listEquipments, addGymEquipment } from "../../utils/ownerGymApi";

function toInputDate(value) {
  if (!value) return "";
  const s = String(value).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

function safeId(e) {
  const id = e?.equipment_id ?? e?.id;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function safeStr(v) {
  return v == null ? "" : String(v);
}

function toAbsUrl(u) {
  const s = safeStr(u).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&q=80";

export default function AddEquipment({ gymId, onClose, onSuccess }) {
  const [tab, setTab] = useState("single"); // "single" | "batch"

  const [allEquipments, setAllEquipments] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // single add form
  const [form, setForm] = useState({
    equipment_id: "",
    quantity: 1,
    status: "available",
    date_purchased: "",
    last_maintenance: "",
    next_maintenance: "",
  });

  // batch add state
  const [q, setQ] = useState("");
  // { [equipmentId]: { selected: boolean, quantity: number } }
  const [batchMap, setBatchMap] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingList(true);
        const res = await listEquipments();
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (!alive) return;

        setAllEquipments(rows);

        const init = {};
        for (const e of rows) {
          const id = safeId(e);
          if (id == null) continue;
          init[id] = { selected: false, quantity: 1 };
        }
        setBatchMap(init);
      } catch {
        if (!alive) return;
        setAllEquipments([]);
        setError("Failed to load equipment list.");
      } finally {
        if (alive) setLoadingList(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const selectedEquipment = useMemo(() => {
    const id = Number(form.equipment_id);
    return allEquipments.find((e) => Number(e.equipment_id ?? e.id) === id) || null;
  }, [form.equipment_id, allEquipments]);

  const filteredEquipments = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allEquipments;
    return allEquipments.filter((e) => safeStr(e?.name).toLowerCase().includes(term));
  }, [allEquipments, q]);

  const selectedBatchIds = useMemo(() => {
    return Object.entries(batchMap)
      .filter(([, v]) => v?.selected)
      .map(([id]) => Number(id))
      .filter((n) => Number.isFinite(n));
  }, [batchMap]);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleBatchSelect = (equipmentId) => {
    setBatchMap((prev) => {
      const cur = prev[equipmentId] || { selected: false, quantity: 1 };
      const nextSelected = !cur.selected;
      return {
        ...prev,
        [equipmentId]: {
          ...cur,
          selected: nextSelected,
          // if selecting for the first time, keep qty at least 1
          quantity: nextSelected ? Math.max(1, Number(cur.quantity) || 1) : cur.quantity,
        },
      };
    });
  };

  const bumpQty = (equipmentId, delta) => {
    setBatchMap((prev) => {
      const cur = prev[equipmentId] || { selected: false, quantity: 1 };
      if (!cur.selected) return prev;

      const curQ = Number(cur.quantity);
      const safeQ = Number.isFinite(curQ) ? curQ : 1;
      const nextQ = Math.max(0, safeQ + delta);

      return {
        ...prev,
        [equipmentId]: { ...cur, quantity: nextQ },
      };
    });
  };

  const setQtyDirect = (equipmentId, v) => {
    setBatchMap((prev) => {
      const cur = prev[equipmentId] || { selected: false, quantity: 1 };
      if (!cur.selected) return prev;

      const n = Number(v);
      const nextQ = Number.isFinite(n) ? Math.max(0, n) : 0;

      return {
        ...prev,
        [equipmentId]: { ...cur, quantity: nextQ },
      };
    });
  };

  const selectAllVisible = () => {
    const visibleIds = filteredEquipments
      .map((e) => safeId(e))
      .filter((n) => Number.isFinite(n));

    setBatchMap((prev) => {
      const next = { ...prev };
      for (const id of visibleIds) {
        const cur = next[id] || { selected: false, quantity: 1 };
        next[id] = { ...cur, selected: true, quantity: Math.max(1, Number(cur.quantity) || 1) };
      }
      return next;
    });
  };

  const clearAll = () => {
    setBatchMap((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) next[k] = { ...next[k], selected: false };
      return next;
    });
  };

  // --- submit single ---
  const submitSingle = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.equipment_id) return setError("Please select an equipment.");

    const qty = Number(form.quantity);
    if (!Number.isFinite(qty) || qty < 0) return setError("Quantity must be 0 or higher.");

    const payload = {
      equipment_id: Number(form.equipment_id),
      quantity: qty,
      status: form.status || "available",
      date_purchased: form.date_purchased || null,
      last_maintenance: form.last_maintenance || null,
      next_maintenance: form.next_maintenance || null,
    };

    try {
      setLoading(true);
      await addGymEquipment(gymId, payload);
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add equipment.");
    } finally {
      setLoading(false);
    }
  };

  // --- submit batch ---
  const submitBatch = async (e) => {
    e.preventDefault();
    setError("");

    const ids = selectedBatchIds;
    if (!ids.length) return setError("Select at least 1 equipment.");

    for (const id of ids) {
      const qty = Number(batchMap?.[id]?.quantity);
      if (!Number.isFinite(qty) || qty < 0) return setError("All selected quantities must be 0 or higher.");
    }

    // ✅ status is automatically available, no dates in batch
    const base = { status: "available" };

    try {
      setLoading(true);

      const tasks = ids.map((equipment_id) => {
        const qty = Number(batchMap?.[equipment_id]?.quantity ?? 1);
        return addGymEquipment(gymId, { ...base, equipment_id, quantity: qty });
      });

      const results = await Promise.allSettled(tasks);

      const failed = results
        .map((r, idx) => ({ r, id: ids[idx] }))
        .filter((x) => x.r.status === "rejected");

      if (failed.length) {
        const firstErr = failed[0]?.r?.reason;
        const msg =
          firstErr?.response?.data?.message ||
          firstErr?.message ||
          "Some items failed to add.";
        setError(`${msg} (${failed.length} failed, ${ids.length - failed.length} added)`);
      }

      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add selected equipment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Add Equipment</h2>
            <p>{tab === "single" ? "Add one equipment item" : "Batch select equipment and set quantity"}</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="ae-tabs" style={{ padding: "1.25rem 2.5rem 0" }}>
          <button
            type="button"
            className={`ae-tab ${tab === "single" ? "active" : ""}`}
            onClick={() => {
              setError("");
              setTab("single");
            }}
          >
            Single Add
          </button>
          <button
            type="button"
            className={`ae-tab ${tab === "batch" ? "active" : ""}`}
            onClick={() => {
              setError("");
              setTab("batch");
            }}
          >
            Batch Add
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* SINGLE TAB */}
        {tab === "single" ? (
          <form onSubmit={submitSingle} className="modal-form">
            <div className="form-group">
              <label>
                Equipment <span className="required">*</span>
              </label>

              {loadingList ? (
                <div className="helper-text">Loading equipment list...</div>
              ) : (
                <select
                  className="form-input"
                  value={form.equipment_id}
                  onChange={(e) => setField("equipment_id", e.target.value)}
                  required
                >
                  <option value="">Select equipment...</option>
                  {allEquipments.map((e) => {
                    const id = e.equipment_id ?? e.id;
                    return (
                      <option key={id} value={id}>
                        {e.name}
                      </option>
                    );
                  })}
                </select>
              )}

              {selectedEquipment ? (
                <div className="helper-text">
                  {selectedEquipment.category ? `Category: ${selectedEquipment.category}` : ""}
                  {selectedEquipment.target_muscle_group ? ` • Target: ${selectedEquipment.target_muscle_group}` : ""}
                  {selectedEquipment.difficulty ? ` • Difficulty: ${selectedEquipment.difficulty}` : ""}
                </div>
              ) : null}
            </div>

            <div className="form-group">
              <label>
                Quantity <span className="required">*</span>
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={form.quantity}
                onChange={(e) => setField("quantity", e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select className="form-input" value={form.status} onChange={(e) => setField("status", e.target.value)}>
                <option value="available">available</option>
                <option value="maintenance">maintenance</option>
                <option value="broken">broken</option>
                <option value="retired">retired</option>
              </select>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>Date Purchased</label>
                <input
                  type="date"
                  className="form-input"
                  value={toInputDate(form.date_purchased)}
                  onChange={(e) => setField("date_purchased", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Last Maintenance</label>
                <input
                  type="date"
                  className="form-input"
                  value={toInputDate(form.last_maintenance)}
                  onChange={(e) => setField("last_maintenance", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Next Maintenance</label>
                <input
                  type="date"
                  className="form-input"
                  value={toInputDate(form.next_maintenance)}
                  onChange={(e) => setField("next_maintenance", e.target.value)}
                />
              </div>
            </div>

            <div className="form-actions">
              <div />
              <div className="action-group">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading || loadingList}>
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Add Equipment
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* BATCH TAB (equipments at TOP) */
          <form onSubmit={submitBatch} className="modal-form">
            {/* Search + bulk buttons */}
            <div className="ae-search-row">
              <div className="ae-search">
                <Search size={16} />
                <input
                  className="form-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search equipment..."
                />
              </div>

              <button type="button" className="ae-mini-btn" onClick={selectAllVisible} disabled={loadingList || loading}>
                Select visible
              </button>
              <button type="button" className="ae-mini-btn" onClick={clearAll} disabled={loadingList || loading}>
                Clear
              </button>
            </div>

            <div className="ae-selected-info">
              Selected: <strong>{selectedBatchIds.length}</strong> (Batch status: <strong>available</strong>)
            </div>

            {/* Equipment grid (TOP) */}
            <div className="ae-batch-grid">
              {loadingList ? (
                <div className="helper-text">Loading equipment list...</div>
              ) : filteredEquipments.length ? (
                filteredEquipments.map((e) => {
                  const id = safeId(e);
                  if (id == null) return null;

                  const state = batchMap?.[id] || { selected: false, quantity: 1 };
                  const selected = Boolean(state.selected);

                  const img = toAbsUrl(e?.image_url) || FALLBACK_IMG;

                  return (
                    <div
                      key={id}
                      className={`ae-item ${selected ? "selected" : ""}`}
                      onClick={() => toggleBatchSelect(id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") toggleBatchSelect(id);
                      }}
                    >
                      <div className="ae-item-head">
                        <div className="ae-check">{selected ? <CheckSquare size={18} /> : <Square size={18} />}</div>

                        <img className="ae-thumb" src={img} alt={e?.name || "equipment"} />

                        <div className="ae-item-main">
                          <div className="ae-item-title">{e?.name}</div>
                        </div>
                      </div>

                      <div className="ae-item-qty">
                        <button
                          type="button"
                          className="ae-qty-btn"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            bumpQty(id, -1);
                          }}
                          disabled={!selected || loading}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={16} />
                        </button>

                        <input
                          type="number"
                          min="0"
                          className="ae-qty-input"
                          value={Number(state.quantity) || 0}
                          onClick={(ev) => ev.stopPropagation()}
                          onChange={(ev) => setQtyDirect(id, ev.target.value)}
                          disabled={!selected || loading}
                        />

                        <button
                          type="button"
                          className="ae-qty-btn"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            bumpQty(id, +1);
                          }}
                          disabled={!selected || loading}
                          aria-label="Increase quantity"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="helper-text">No equipment matched your search.</div>
              )}
            </div>

            {/* Actions */}
            <div className="form-actions">
              <div />
              <div className="action-group">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading || loadingList}>
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Add Selected ({selectedBatchIds.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}