import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./ProfileStyle.css";
import { alertSuccess, alertError, alertInfo } from "../../utils/adminAlert";

const API_BASE = "https://exersearch.test";
const FALLBACK_AVATAR = "/arellano.png";
const MAIN = "#d23f0b";

function toNumOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function asArray(x) {
  return Array.isArray(x) ? x : [];
}

function pickPrefPayload(prefResData) {
  // Accept lots of shapes safely:
  // 1) { preferences: {...} }
  // 2) { data: {...} }
  // 3) { goal, activity_level, budget }
  const root =
    prefResData?.preferences ??
    prefResData?.data ??
    prefResData ??
    {};

  const goal = root?.goal ?? root?.Goal ?? "";
  const activity_level =
    root?.activity_level ??
    root?.activityLevel ??
    root?.activity ??
    root?.ActivityLevel ??
    "";

  const budget =
    root?.budget ??
    root?.monthly_budget ??
    root?.budget_monthly ??
    root?.Budget ??
    "";

  return { goal, activity_level, budget };
}

function absoluteUrlMaybe(pathOrUrl) {
  if (!pathOrUrl) return "";
  const s = String(pathOrUrl);
  if (s.startsWith("http")) return s;
  return `${API_BASE}${s}`;
}

function PrefModal({
  open,
  onClose,
  theme,
  prefLoading,
  prefSaving,
  prefForm,
  setPrefForm,
  equipments,
  amenities,
  onSave,
}) {
  // escape close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const backdrop = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999,
  };

  const modal = {
    width: "min(980px, 96vw)",
    maxHeight: "86vh",
    overflow: "hidden",
    borderRadius: 16,
    background: theme === "dark" ? "#0f0f10" : "#ffffff",
    color: theme === "dark" ? "#f3f4f6" : "#111827",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
    display: "flex",
    flexDirection: "column",
  };

  const top = {
    padding: 14,
    borderBottom: theme === "dark" ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  };

  const body = {
    padding: 14,
    overflowY: "auto",
  };

  const sectionTitle = {
    fontWeight: 950,
    margin: "10px 0 8px",
    fontSize: 14,
  };

  const grid2 = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  };

  const input = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.12)",
    background: theme === "dark" ? "rgba(255,255,255,0.04)" : "#fff",
    color: "inherit",
    fontWeight: 800,
    outline: "none",
  };

  const listGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  };

  // checkbox item now (later you can swap this to image cards)
  const itemCard = (checked) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    border: theme === "dark"
      ? "1px solid rgba(255,255,255,0.10)"
      : "1px solid rgba(0,0,0,0.10)",
    background: checked
      ? "rgba(210,63,11,0.10)"
      : theme === "dark"
        ? "rgba(255,255,255,0.03)"
        : "rgba(0,0,0,0.02)",
    cursor: "pointer",
  });

  const thumb = {
    width: 38,
    height: 38,
    borderRadius: 12,
    overflow: "hidden",
    flex: "0 0 auto",
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)",
    background: theme === "dark" ? "rgba(255,255,255,0.04)" : "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    opacity: 0.9,
  };

  const toggleSelected = (kind, id) => {
    const n = Number(id);
    setPrefForm((prev) => {
      const next =
        kind === "equipment"
          ? new Set(prev.selectedEquipmentIds)
          : new Set(prev.selectedAmenityIds);

      if (next.has(n)) next.delete(n);
      else next.add(n);

      return {
        ...prev,
        ...(kind === "equipment"
          ? { selectedEquipmentIds: next }
          : { selectedAmenityIds: next }),
      };
    });
  };

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={top}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>Edit Preferences</div>
            <div style={{ opacity: 0.75, fontWeight: 800, fontSize: 12 }}>
              Goal • Activity Level • Budget • Equipments • Amenities
            </div>
          </div>

          <button className="secondary-btn" onClick={onClose} style={{ margin: 0 }}>
            Close
          </button>
        </div>

        <div style={body}>
          {prefLoading ? (
            <div style={{ fontWeight: 900 }}>Loading…</div>
          ) : (
            <>
              <div style={sectionTitle}>Main preferences</div>
              <div style={grid2}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Goal</div>
                  <input
                    style={input}
                    value={prefForm.goal}
                    onChange={(e) => setPrefForm((p) => ({ ...p, goal: e.target.value }))}
                    placeholder="e.g. Build Muscle"
                  />
                </div>

                <div>
                  <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Activity Level</div>
                  <input
                    style={input}
                    value={prefForm.activity_level}
                    onChange={(e) => setPrefForm((p) => ({ ...p, activity_level: e.target.value }))}
                    placeholder="e.g. Moderate"
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 6 }}>Budget</div>
                  <input
                    style={input}
                    value={prefForm.budget}
                    onChange={(e) => setPrefForm((p) => ({ ...p, budget: e.target.value }))}
                    placeholder="e.g. 2500"
                  />
                </div>
              </div>

              <div style={sectionTitle}>Preferred Equipments</div>
              <div style={listGrid}>
                {equipments.map((e) => {
                  const id = e.equipment_id ?? e.id;
                  const checked = prefForm.selectedEquipmentIds.has(Number(id));
                  const img = e.image_url;

                  return (
                    <div
                      key={id}
                      style={itemCard(checked)}
                      onClick={() => toggleSelected("equipment", id)}
                      title="(Later we can upgrade this to image cards)"
                    >
                      <div style={thumb}>
                        {img ? (
                          <img
                            src={absoluteUrlMaybe(img)}
                            alt={e.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(ev) => (ev.currentTarget.style.display = "none")}
                          />
                        ) : (
                          "EQ"
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelected("equipment", id)}
                        onClick={(ev) => ev.stopPropagation()}
                      />
                      <div style={{ fontWeight: 900 }}>{e.name || `Equipment #${id}`}</div>
                    </div>
                  );
                })}
              </div>

              <div style={sectionTitle}>Preferred Amenities</div>
              <div style={listGrid}>
                {amenities.map((a) => {
                  const id = a.amenity_id ?? a.id;
                  const checked = prefForm.selectedAmenityIds.has(Number(id));
                  const img = a.image_url;

                  return (
                    <div
                      key={id}
                      style={itemCard(checked)}
                      onClick={() => toggleSelected("amenity", id)}
                      title="(Later we can upgrade this to image cards)"
                    >
                      <div style={thumb}>
                        {img ? (
                          <img
                            src={absoluteUrlMaybe(img)}
                            alt={a.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(ev) => (ev.currentTarget.style.display = "none")}
                          />
                        ) : (
                          "AM"
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelected("amenity", id)}
                        onClick={(ev) => ev.stopPropagation()}
                      />
                      <div style={{ fontWeight: 900 }}>{a.name || `Amenity #${id}`}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  className="primary-btn"
                  onClick={onSave}
                  disabled={prefSaving}
                  style={{ margin: 0, flex: 1 }}
                >
                  {prefSaving ? "Saving..." : "Save Preferences"}
                </button>
                <button
                  className="secondary-btn"
                  onClick={onClose}
                  disabled={prefSaving}
                  style={{ margin: 0, flex: 1 }}
                >
                  Cancel
                </button>
              </div>

              <div style={{ marginTop: 8, opacity: 0.75, fontSize: 12, fontWeight: 800 }}>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const fileRef = useRef(null);
  const theme = localStorage.getItem("theme") || "light";
  const token = localStorage.getItem("token");

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [prefModalOpen, setPrefModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState("");

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: "",
    age: "",
    height: "",
    weight: "",
    address: "",
    latitude: "",
    longitude: "",
    profile_photo_url: "",
    created_at: "",
    updated_at: "",
  });

  const [formData, setFormData] = useState({ ...userData });

  // ✅ preferences
  const [prefLoading, setPrefLoading] = useState(true);
  const [prefSaving, setPrefSaving] = useState(false);

  const [prefView, setPrefView] = useState({
    goal: "",
    activity_level: "",
    budget: "",
    preferred_equipments: [],
    preferred_amenities: [],
  });

  const [prefForm, setPrefForm] = useState({
    goal: "",
    activity_level: "",
    budget: "",
    selectedEquipmentIds: new Set(),
    selectedAmenityIds: new Set(),
  });

  const [equipments, setEquipments] = useState([]);
  const [amenities, setAmenities] = useState([]);

  const avatarSrc = useMemo(() => {
    if (localPreview) return localPreview;

    const raw =
      (isEditingProfile ? formData.profile_photo_url : userData.profile_photo_url) || "";
    if (!raw) return FALLBACK_AVATAR;
    if (raw.startsWith("http")) return raw;
    return `${API_BASE}${raw}`;
  }, [localPreview, isEditingProfile, formData.profile_photo_url, userData.profile_photo_url]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  // ----------------------------
  // LOAD: /me
  // ----------------------------
  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/v1/me`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        const u = res.data;
        const p = u?.user_profile;

        const next = {
          name: u?.name || "",
          email: u?.email || "",
          role: u?.role || "",
          age: p?.age ?? "",
          height: p?.height ?? "",
          weight: p?.weight ?? "",
          address: p?.address ?? "",
          latitude: p?.latitude ?? "",
          longitude: p?.longitude ?? "",
          profile_photo_url: p?.profile_photo_url ?? "",
          created_at: p?.created_at ? String(p.created_at).slice(0, 10) : "",
          updated_at: p?.updated_at ? String(p.updated_at).slice(0, 10) : "",
        };

        if (!mounted) return;
        setUserData(next);
        setFormData(next);
        setLocalPreview("");
      } catch (err) {
        alertError({
          title: "Failed to load profile",
          text: err?.response?.data?.message || "Something went wrong.",
          theme,
          mainColor: MAIN,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (token) loadMe();
    else {
      setLoading(false);
      alertInfo({
        title: "Session missing",
        text: "No token found. Please log in again.",
        theme,
        mainColor: MAIN,
      });
    }

    return () => {
      mounted = false;
    };
  }, [token, theme]);

  // ----------------------------
  // LOAD: preferences + master lists
  // ----------------------------
  useEffect(() => {
    let mounted = true;

    async function loadPrefs() {
      setPrefLoading(true);
      try {
        const [prefRes, eqPickRes, amPickRes, allEqRes, allAmRes] = await Promise.all([
          axios.get(`${API_BASE}/api/v1/user/preferences`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }),
          axios.get(`${API_BASE}/api/v1/user/preferred-equipments`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }),
          axios.get(`${API_BASE}/api/v1/user/preferred-amenities`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }),
          axios.get(`${API_BASE}/api/v1/equipments`),
          axios.get(`${API_BASE}/api/v1/amenities`),
        ]);

        const { goal, activity_level, budget } = pickPrefPayload(prefRes.data);

        const preferredEquipments =
          eqPickRes.data?.preferred_equipments ?? eqPickRes.data?.data ?? eqPickRes.data ?? [];
        const preferredAmenities =
          amPickRes.data?.preferred_amenities ?? amPickRes.data?.data ?? amPickRes.data ?? [];

        const allEq = allEqRes.data?.data ?? allEqRes.data ?? [];
        const allAm = allAmRes.data?.data ?? allAmRes.data ?? [];

        const view = {
          goal: goal ?? "",
          activity_level: activity_level ?? "",
          budget: budget ?? "",
          preferred_equipments: asArray(preferredEquipments),
          preferred_amenities: asArray(preferredAmenities),
        };

        const selectedEquipmentIds = new Set(
          view.preferred_equipments
            .map((x) => x?.equipment_id ?? x?.id)
            .filter((v) => v != null)
            .map((v) => Number(v))
        );

        const selectedAmenityIds = new Set(
          view.preferred_amenities
            .map((x) => x?.amenity_id ?? x?.id)
            .filter((v) => v != null)
            .map((v) => Number(v))
        );

        if (!mounted) return;

        setPrefView(view);
        setEquipments(asArray(allEq));
        setAmenities(asArray(allAm));

        setPrefForm({
          goal: view.goal || "",
          activity_level: view.activity_level || "",
          budget: view.budget ?? "",
          selectedEquipmentIds,
          selectedAmenityIds,
        });
      } catch (err) {
        alertError({
          title: "Failed to load preferences",
          text: err?.response?.data?.message || "Could not fetch your preferences.",
          theme,
          mainColor: MAIN,
        });
      } finally {
        if (mounted) setPrefLoading(false);
      }
    }

    if (token) loadPrefs();
    return () => {
      mounted = false;
    };
  }, [token, theme]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // ----------------------------
  // PHOTO: pick + upload
  // ----------------------------
  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alertInfo({ title: "Invalid file", text: "Please choose an image file.", theme, mainColor: MAIN });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alertInfo({ title: "File too large", text: "Image is too large (max 2MB).", theme, mainColor: MAIN });
      return;
    }

    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      alertInfo({
        title: "No image selected",
        text: "Please choose an image before uploading.",
        theme,
        mainColor: MAIN,
      });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);

      const res = await axios.post(`${API_BASE}/api/v1/me/avatar`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      const url = res.data?.avatar_url;
      if (!url) {
        alertError({ title: "Upload incomplete", text: "Server did not return an image URL.", theme, mainColor: MAIN });
        return;
      }

      setUserData((p) => ({ ...p, profile_photo_url: url }));
      setFormData((p) => ({ ...p, profile_photo_url: url }));

      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview("");
      if (fileRef.current) fileRef.current.value = "";

      alertSuccess({
        title: "Profile photo updated",
        text: res.data?.message || "Your profile photo has been updated.",
        theme,
        mainColor: MAIN,
      }).then(() => window.location.reload());
    } catch (err) {
      const validation = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join("\n")
        : null;

      alertError({
        title: "Upload failed",
        text: validation || err?.response?.data?.message || "Failed to upload avatar.",
        theme,
        mainColor: MAIN,
      });
    } finally {
      setUploading(false);
    }
  };

  // ----------------------------
  // SAVE: profile fields
  // ----------------------------
  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const payload = {
        age: toNumOrNull(formData.age),
        height: toNumOrNull(formData.height),
        weight: toNumOrNull(formData.weight),
        address: formData.address || null,
        latitude: toNumOrNull(formData.latitude),
        longitude: toNumOrNull(formData.longitude),
      };

      const res = await axios.put(`${API_BASE}/api/v1/user/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      alertSuccess({
        title: "Profile updated",
        text: res.data?.message || "Your changes have been saved.",
        theme,
        mainColor: MAIN,
      }).then(() => window.location.reload());
    } catch (err) {
      const validation = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join("\n")
        : null;

      alertError({
        title: "Save failed",
        text: validation || err?.response?.data?.message || "Failed to save profile.",
        theme,
        mainColor: MAIN,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // ----------------------------
  // SAVE: preferences (only when user clicks Save in modal)
  // ----------------------------
const savePreferences = async () => {
  setPrefSaving(true);
  try {
    await axios.post(
      `${API_BASE}/api/v1/user/preferences`,
      {
        goal: prefForm.goal || null,
        activity_level: prefForm.activity_level || null,
        budget: prefForm.budget === "" ? null : prefForm.budget,
      },
      { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
    );

    const equipment_ids = Array.from(prefForm.selectedEquipmentIds)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));

    const amenity_ids = Array.from(prefForm.selectedAmenityIds)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));

    await axios.post(
      `${API_BASE}/api/v1/user/preferred-equipments`,
      { equipment_ids },
      { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
    );

    await axios.post(
      `${API_BASE}/api/v1/user/preferred-amenities`,
      { amenity_ids },
      { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
    );

setPrefModalOpen(false);

// 2️⃣ show success alert
alertSuccess({
  title: "Preferences saved",
  text: "Your preferences were updated.",
  theme,
  mainColor: MAIN,
}).then(() => {
  // 3️⃣ refresh everything (top bar + /me)
  window.location.reload();
});
  } catch (err) {
    const validation = err?.response?.data?.errors
      ? Object.values(err.response.data.errors).flat().join("\n")
      : null;

    alertError({
      title: "Save failed",
      text: validation || err?.response?.data?.message || "Failed to save preferences.",
      theme,
      mainColor: MAIN,
    });
  } finally {
    setPrefSaving(false);
  }
};
  const cancelProfileEdit = () => {
    setFormData({ ...userData });
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview("");
    if (fileRef.current) fileRef.current.value = "";
    setIsEditingProfile(false);
  };

  const prefEquipText = prefView.preferred_equipments.length
    ? prefView.preferred_equipments.map((x) => x?.name || `#${x?.equipment_id ?? x?.id ?? "?"}`).join(", ")
    : "—";

  const prefAmenText = prefView.preferred_amenities.length
    ? prefView.preferred_amenities.map((x) => x?.name || `#${x?.amenity_id ?? x?.id ?? "?"}`).join(", ")
    : "—";

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Left Column */}
        <div className="profile-left">
          <div className="avatar-wrapper">
            <img src={avatarSrc} alt="Profile" className="avatar-img" />
          </div>

          <h2 className="profile-name">{userData.name || "—"}</h2>
          <p className="profile-email">{userData.email || "—"}</p>

          {/* ✅ separate buttons */}
          <div style={{ display: "grid", gap: 10, width: "100%", marginTop: 10 }}>
            <button
              className="primary-btn"
              onClick={() => setIsEditingProfile(true)}
              disabled={prefSaving || uploading}
            >
              Edit Profile
            </button>

            <button
              className="secondary-btn"
              onClick={() => setPrefModalOpen(true)}
              disabled={prefLoading || prefSaving}
            >
              Edit Preferences
            </button>
          </div>

          {/* photo upload (only when editing profile, same as before) */}
          {isEditingProfile && (
            <div style={{ marginTop: 14, width: "100%" }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Update photo</div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
                style={{ width: "100%" }}
              />

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  className="primary-btn"
                  onClick={uploadAvatar}
                  disabled={uploading}
                  style={{ flex: 1, margin: 0 }}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => {
                    if (localPreview) URL.revokeObjectURL(localPreview);
                    setLocalPreview("");
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  disabled={uploading}
                  style={{ flex: 1, margin: 0 }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="profile-right">
          {isEditingProfile ? (
            <div className="edit-form">
              <h3 className="section-title">Edit Profile</h3>

              <label>Address</label>
              <input name="address" value={formData.address} onChange={handleInputChange} />

              <label>Age</label>
              <input name="age" type="number" value={formData.age} onChange={handleInputChange} />

              <label>Height (cm)</label>
              <input name="height" type="number" value={formData.height} onChange={handleInputChange} />

              <label>Weight (kg)</label>
              <input name="weight" type="number" value={formData.weight} onChange={handleInputChange} />

              <label>Latitude</label>
              <input name="latitude" type="number" value={formData.latitude} onChange={handleInputChange} />

              <label>Longitude</label>
              <input name="longitude" type="number" value={formData.longitude} onChange={handleInputChange} />

              <div className="edit-actions">
                <button
                  className="primary-btn"
                  onClick={saveProfile}
                  disabled={savingProfile || uploading || prefSaving}
                >
                  {savingProfile ? "Saving..." : "Save"}
                </button>

                <button
                  className="secondary-btn"
                  onClick={cancelProfileEdit}
                  disabled={savingProfile || uploading || prefSaving}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="section-title">User Info</h3>
              <div className="info-grid">
                <div className="info-card">
                  <label>Age</label>
                  <strong>{userData.age ? `${userData.age} yrs` : "-"}</strong>
                </div>
                <div className="info-card">
                  <label>Height</label>
                  <strong>{userData.height ? `${userData.height} cm` : "-"}</strong>
                </div>
                <div className="info-card">
                  <label>Weight</label>
                  <strong>{userData.weight ? `${userData.weight} kg` : "-"}</strong>
                </div>
                <div className="info-card">
                  <label>Address</label>
                  <strong>{userData.address || "-"}</strong>
                </div>
                <div className="info-card">
                  <label>Member Since</label>
                  <strong>{userData.created_at || "-"}</strong>
                </div>
              </div>

              {/* ✅ Preferences BELOW user info (view) */}
              <h3 className="section-title" style={{ marginTop: 16 }}>
                Preferences
              </h3>

              {prefLoading ? (
                <div className="info-grid">
                  <div className="info-card" style={{ gridColumn: "1 / -1" }}>
                    <label>Loading</label>
                    <strong>Fetching preferences…</strong>
                  </div>
                </div>
              ) : (
                <div className="info-grid">
                  <div className="info-card">
                    <label>Goal</label>
                    <strong>{prefView.goal || "—"}</strong>
                  </div>

                  <div className="info-card">
                    <label>Activity Level</label>
                    <strong>{prefView.activity_level || "—"}</strong>
                  </div>

                  <div className="info-card">
                    <label>Budget</label>
                    <strong>
                      {prefView.budget === "" || prefView.budget == null
                        ? "—"
                        : `₱${Number(prefView.budget).toLocaleString()}`}
                    </strong>
                  </div>

                  <div className="info-card" style={{ gridColumn: "1 / -1" }}>
                    <label>Preferred Equipments</label>
                    <strong>{prefEquipText}</strong>
                  </div>

                  <div className="info-card" style={{ gridColumn: "1 / -1" }}>
                    <label>Preferred Amenities</label>
                    <strong>{prefAmenText}</strong>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ✅ separate window/modal for preferences */}
      <PrefModal
        open={prefModalOpen}
        onClose={() => setPrefModalOpen(false)}
        theme={theme}
        prefLoading={prefLoading}
        prefSaving={prefSaving}
        prefForm={prefForm}
        setPrefForm={setPrefForm}
        equipments={equipments}
        amenities={amenities}
        onSave={savePreferences}
      />
    </div>
  );
}
