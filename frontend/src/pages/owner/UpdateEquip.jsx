import React, { useEffect, useState } from "react";
import { X, Save, Trash2, AlertCircle } from "lucide-react";
import "./Modals.css";

function toInputDate(value) {
  if (!value) return "";
  const s = String(value).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

export default function UpdateEquipment({ equipment, onClose, onSuccess, onDelete }) {
  const [formData, setFormData] = useState({
    quantity: 1,
    status: "available",
    date_purchased: "",
    last_maintenance: "",
    next_maintenance: "",
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setFormData({
      quantity: equipment?.pivot?.quantity ?? 1,
      status: equipment?.pivot?.status ?? "available",
      date_purchased: toInputDate(equipment?.pivot?.date_purchased),
      last_maintenance: toInputDate(equipment?.pivot?.last_maintenance),
      next_maintenance: toInputDate(equipment?.pivot?.next_maintenance),
    });
  }, [equipment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const qty = Number(formData.quantity);
    if (!Number.isFinite(qty) || qty < 0) {
      setError("Quantity must be 0 or higher");
      return;
    }

    setLoading(true);
    try {
      const updated = {
        ...equipment,
        pivot: {
          ...(equipment?.pivot || {}),
          quantity: qty,
          status: formData.status || "available",
          date_purchased: formData.date_purchased || null,
          last_maintenance: formData.last_maintenance || null,
          next_maintenance: formData.next_maintenance || null,
        },
      };

      await onSuccess?.(updated);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update equipment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      const equipmentId = equipment?.equipment_id ?? equipment?.id;
      await onDelete?.(equipmentId);
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete equipment");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Update Equipment</h2>
            <p>{equipment?.name || "Edit equipment details"}</p>
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

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="equipment-quantity">
              Quantity <span className="required">*</span>
            </label>
            <div className="quantity-controls">
              <button
                type="button"
                className="quantity-btn"
                onClick={() => setFormData((p) => ({ ...p, quantity: Math.max(0, Number(p.quantity || 0) - 1) }))}
                disabled={Number(formData.quantity || 0) <= 0}
              >
                −
              </button>

              <input
                id="equipment-quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    quantity: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className="quantity-input"
                required
              />

              <button
                type="button"
                className="quantity-btn"
                onClick={() => setFormData((p) => ({ ...p, quantity: Number(p.quantity || 0) + 1 }))}
              >
                +
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              className="form-input"
              value={formData.status}
              onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
            >
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
                value={toInputDate(formData.date_purchased)}
                onChange={(e) => setFormData((p) => ({ ...p, date_purchased: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Last Maintenance</label>
              <input
                type="date"
                className="form-input"
                value={toInputDate(formData.last_maintenance)}
                onChange={(e) => setFormData((p) => ({ ...p, last_maintenance: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>Next Maintenance</label>
              <input
                type="date"
                className="form-input"
                value={toInputDate(formData.next_maintenance)}
                onChange={(e) => setFormData((p) => ({ ...p, next_maintenance: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading || deleting}
            >
              <Trash2 size={18} />
              Delete
            </button>

            <div className="action-group">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading || deleting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading || deleting}>
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="confirm-overlay" onMouseDown={() => setShowDeleteConfirm(false)}>
            <div className="confirm-dialog" onMouseDown={(e) => e.stopPropagation()}>
              <div className="confirm-icon danger">
                <Trash2 size={32} />
              </div>
              <h3>Delete Equipment?</h3>
              <p>
                Remove <strong>{equipment?.name}</strong> from this gym?
              </p>
              <div className="confirm-actions">
                <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                  Cancel
                </button>
                <button className="btn-danger-confirm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? (
                    <>
                      <div className="btn-spinner"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}