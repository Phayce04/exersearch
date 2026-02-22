import React, { useEffect, useMemo, useState } from "react";
import { X, Plus, Check, AlertCircle, Wifi, Car, Droplet, Wind, Dumbbell, Users, Coffee, Lock, Sparkles } from "lucide-react";
import "./Modals.css";
import { listAmenities, createAmenity, syncGymAmenitiesByIds } from "../../utils/amenityApi";

function getRoleMaybe() {
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u?.role) return String(u.role);
    }
  } catch {}
  const r = localStorage.getItem("role");
  return r ? String(r) : "";
}

function toAmenityId(a) {
  if (a == null) return null;
  if (typeof a === "number") return a;
  if (typeof a === "string") return Number(a);
  if (typeof a === "object") return Number(a.amenity_id ?? a.id);
  return null;
}

function uniqFiniteNums(arr) {
  const out = [];
  const seen = new Set();
  for (const v of arr) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function iconForAmenityName(name) {
  const s = String(name || "").toLowerCase();

  if (s.includes("wifi") || s.includes("wi-fi") || s.includes("internet")) return Wifi;
  if (s.includes("park")) return Car;
  if (s.includes("shower") || s.includes("bath") || s.includes("toilet") || s.includes("restroom")) return Droplet;
  if (s.includes("aircon") || s.includes("air con") || s.includes("ac") || s.includes("vent") || s.includes("fan")) return Wind;
  if (s.includes("locker") || s.includes("lock")) return Lock;
  if (s.includes("cafe") || s.includes("coffee") || s.includes("juice") || s.includes("bar")) return Coffee;
  if (s.includes("trainer") || s.includes("coaching") || s.includes("staff") || s.includes("personal")) return Users;

  if (
    s.includes("dumbbell") ||
    s.includes("weights") ||
    s.includes("free weight") ||
    s.includes("cardio") ||
    s.includes("treadmill") ||
    s.includes("crossfit") ||
    s.includes("boxing") ||
    s.includes("gym") ||
    s.includes("strength")
  )
    return Dumbbell;

  return Sparkles;
}

export default function AddAmenities({ gymId, existingAmenities = [], onClose, onSuccess }) {
  const role = useMemo(() => getRoleMaybe(), []);
  const canCreateAmenity = role === "superadmin";

  const existingIds = useMemo(() => {
    return uniqFiniteNums((Array.isArray(existingAmenities) ? existingAmenities : []).map(toAmenityId).filter(Boolean));
  }, [existingAmenities]);

  const [allAmenities, setAllAmenities] = useState([]);
  const [selectedIds, setSelectedIds] = useState(existingIds);

  const [customAmenity, setCustomAmenity] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedIds(existingIds);
    setCustomAmenity("");
    setError("");
  }, [gymId, existingIds]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingList(true);
        const data = await listAmenities();
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
        setAllAmenities(list);
      } catch (e) {
        if (!alive) return;
        setAllAmenities([]);
        setError(e?.message || "Failed to load amenities");
      } finally {
        if (alive) setLoadingList(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggleAmenity = (id) => {
    const n = Number(id);
    if (!Number.isFinite(n)) return;
    setSelectedIds((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  const addCustomAmenity = async () => {
    const name = String(customAmenity || "").trim();
    if (!name) return;

    const dup = allAmenities.some((a) => String(a?.name || "").trim().toLowerCase() === name.toLowerCase());
    if (dup) {
      setError("That amenity already exists. Select it from the list.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await createAmenity({ name });
      const created = res?.amenity ?? res?.data?.amenity ?? res?.data ?? res;

      const newId = Number(created?.amenity_id ?? created?.id);
      if (!Number.isFinite(newId)) throw new Error("Amenity created but ID not returned");

      setAllAmenities((prev) =>
        [...prev, created].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")))
      );
      setSelectedIds((prev) => (prev.includes(newId) ? prev : [...prev, newId]));
      setCustomAmenity("");
    } catch (e) {
      setError(e?.message || "Failed to create amenity");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedIds.length === 0) {
      setError("Please select at least one amenity");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await syncGymAmenitiesByIds(gymId, selectedIds, existingAmenities);
      onSuccess && onSuccess(selectedIds);
    } catch (e) {
      setError(e?.message || "Failed to save amenities");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content amenities-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Manage Amenities</h2>
            <p>Select amenities available at your gym</p>
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
          <div className="form-section">
            <label className="section-label">Select Amenities</label>

            {loadingList ? (
              <div className="vg-empty-state">Loading amenities…</div>
            ) : allAmenities.length === 0 ? (
              <div className="vg-empty-state">No amenities found</div>
            ) : (
              <div className="amenities-grid">
                {allAmenities.map((a) => {
                  const id = Number(a.amenity_id);
                  const isSelected = selectedIds.includes(id);
                  const Icon = iconForAmenityName(a.name);

                  return (
                    <button
                      key={id}
                      type="button"
                      className={`amenity-option ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleAmenity(id)}
                    >
                      <div className="amenity-icon">
                        <Icon size={24} />
                      </div>
                      <span className="amenity-label">{a.name}</span>
                      {isSelected && (
                        <div className="amenity-check">
                          <Check size={16} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {canCreateAmenity && (
            <div className="form-section">
              <label className="section-label">Add Amenity (Superadmin only)</label>
              <div className="custom-amenity-input">
                <input
                  type="text"
                  placeholder="Creates a new amenity in database"
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomAmenity();
                    }
                  }}
                  className="form-input"
                />
                <button
                  type="button"
                  className="add-custom-btn"
                  onClick={addCustomAmenity}
                  disabled={saving || !String(customAmenity || "").trim()}
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>

            <button type="submit" className="btn-primary" disabled={saving || selectedIds.length === 0}>
              {saving ? (
                <>
                  <div className="btn-spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Save Amenities
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}