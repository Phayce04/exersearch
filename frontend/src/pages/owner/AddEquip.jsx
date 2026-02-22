import React, { useEffect, useMemo, useState } from "react";
import { X, AlertCircle, Save } from "lucide-react";
import "./Modals.css";

import { listEquipments, addGymEquipment } from "../../utils/ownerGymApi";

function toInputDate(value) {
  if (!value) return "";
  const s = String(value).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

export default function AddEquipment({ gymId, onClose, onSuccess }) {
  const [allEquipments, setAllEquipments] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [form, setForm] = useState({
    equipment_id: "",
    quantity: 1,
    status: "available",
    date_purchased: "",
    last_maintenance: "",
    next_maintenance: "",
  });

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

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.equipment_id) {
      setError("Please select an equipment.");
      return;
    }

    const qty = Number(form.quantity);
    if (!Number.isFinite(qty) || qty < 0) {
      setError("Quantity must be 0 or higher.");
      return;
    }

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

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Add Equipment</h2>
            <p>Select from equipment list</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="modal-form">
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
      </div>
    </div>
  );
}