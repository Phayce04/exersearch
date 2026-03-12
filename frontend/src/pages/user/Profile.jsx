import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Profilestyle.css";
import { alertSuccess, alertError, alertInfo } from "../../utils/adminAlert";
import { api } from "../../utils/apiClient";
import {
  User,
  Mail,
  MapPin,
  Ruler,
  Weight,
  Calendar,
  Pencil,
  Upload,
  X,
  Check,
  ChevronRight,
  Target,
  Activity,
  Wallet,
  Dumbbell,
  Building2,
  Camera,
  SlidersHorizontal,
  ImageUp,
  Clock3,
  HeartPulse,
  Salad,
  Flame,
} from "lucide-react";

const FALLBACK_AVATAR = "/arellano.png";
const MAIN = "#d23f0b";

const GOAL_OPTIONS = [
  { value: "", label: "Select goal" },
  { value: "weight loss", label: "Weight Loss" },
  { value: "muscle gain", label: "Muscle Gain" },
  { value: "maintenance", label: "Maintenance" },
  { value: "endurance", label: "Endurance" },
  { value: "general fitness", label: "General Fitness" },
];

const ACTIVITY_LEVEL_OPTIONS = [
  { value: "", label: "Select activity level" },
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very active", label: "Very Active" },
];

const PLAN_TYPE_OPTIONS = [
  { value: "", label: "Select plan type" },
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
];

const WORKOUT_TIME_OPTIONS = [
  { value: "", label: "Select workout time" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const WORKOUT_LEVEL_OPTIONS = [
  { value: "", label: "Select workout level" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const WORKOUT_PLACE_OPTIONS = [
  { value: "", label: "Select workout place" },
  { value: "home", label: "Home" },
  { value: "gym", label: "Gym" },
  { value: "both", label: "Both" },
];

const PREFERRED_STYLE_OPTIONS = [
  { value: "", label: "Select preferred style" },
  { value: "strength", label: "Strength" },
  { value: "hypertrophy", label: "Hypertrophy" },
  { value: "endurance", label: "Endurance" },
  { value: "hiit", label: "HIIT" },
  { value: "mixed", label: "Mixed" },
];

const DIETARY_OPTIONS = [
  "halal",
  "vegetarian",
  "vegan",
  "pescatarian",
  "low-carb",
  "gluten-free",
  "dairy-free",
  "nut-free",
];

const INJURY_OPTIONS = [
  "knee",
  "back",
  "shoulder",
  "ankle",
  "wrist",
  "neck",
];

function toNumOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function asArray(x) {
  return Array.isArray(x) ? x : [];
}

function prettifyLabel(value) {
  if (!value) return "—";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function pickPrefPayload(prefResData) {
  const root = prefResData?.preferences ?? prefResData?.data ?? prefResData ?? {};

  return {
    goal: root?.goal ?? "",
    activity_level:
      root?.activity_level ??
      root?.activityLevel ??
      root?.activity ??
      "",
    budget: root?.budget ?? "",
    plan_type: root?.plan_type ?? "",
    workout_days: root?.workout_days ?? "",
    workout_time: root?.workout_time ?? "",
    food_budget: root?.food_budget ?? "",
    workout_level: root?.workout_level ?? "",
    session_minutes: root?.session_minutes ?? "",
    workout_place: root?.workout_place ?? "",
    preferred_style: root?.preferred_style ?? "",
    dietary_restrictions: asArray(root?.dietary_restrictions),
    injuries: asArray(root?.injuries),
  };
}

function absoluteUrlMaybe(pathOrUrl) {
  if (!pathOrUrl) return "";
  const s = String(pathOrUrl).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;

  const base = String(api.defaults.baseURL || "").replace(/\/api\/v1\/?$/, "");
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${base}${path}`;
}

function MultiToggleChips({ options, selectedValues, onToggle }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap",
      }}
    >
      {options.map((opt) => {
        const active = selectedValues.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            style={{
              border: `1px solid ${active ? "var(--orange)" : "var(--stroke)"}`,
              background: active ? "rgba(210, 63, 11, 0.12)" : "var(--card)",
              color: active ? "var(--orange)" : "var(--text)",
              borderRadius: "999px",
              padding: "0.5rem 0.85rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {prettifyLabel(opt)}
          </button>
        );
      })}
    </div>
  );
}

function PrefModal({
  open,
  onClose,
  prefLoading,
  prefSaving,
  prefForm,
  setPrefForm,
  equipments,
  amenities,
  onSave,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

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

  const toggleArrayItem = (field, value) => {
    setPrefForm((prev) => {
      const current = asArray(prev[field]);
      const exists = current.includes(value);
      return {
        ...prev,
        [field]: exists
          ? current.filter((x) => x !== value)
          : [...current, value],
      };
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "980px" }}
      >
        <div className="modal-head">
          <div>
            <div className="modal-title">Edit Preferences</div>
            <div className="modal-subtitle">
              Fitness, meal, workout, equipment, and amenity preferences
            </div>
          </div>
          <button
            className="btn-secondary"
            onClick={onClose}
            style={{ width: "auto", padding: "0.5rem 1.125rem" }}
          >
            <X size={16} /> Close
          </button>
        </div>

        <div className="modal-body">
          {prefLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "var(--gray-500)",
                fontWeight: 700,
              }}
            >
              Loading…
            </div>
          ) : (
            <>
              <div className="modal-section-label">Main Fitness Preferences</div>
              <div className="modal-2col">
                <div>
                  <div className="modal-field-label">Goal</div>
                  <select
                    className="modal-input"
                    value={prefForm.goal}
                    onChange={(e) =>
                      setPrefForm((p) => ({ ...p, goal: e.target.value }))
                    }
                  >
                    {GOAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="modal-field-label">Activity Level</div>
                  <select
                    className="modal-input"
                    value={prefForm.activity_level}
                    onChange={(e) =>
                      setPrefForm((p) => ({ ...p, activity_level: e.target.value }))
                    }
                  >
                    {ACTIVITY_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="modal-field-label">Budget (₱)</div>
                  <input
                    className="modal-input"
                    type="number"
                    value={prefForm.budget}
                    onChange={(e) =>
                      setPrefForm((p) => ({ ...p, budget: e.target.value }))
                    }
                    placeholder="e.g. 2500"
                  />
                </div>

                <div>
                  <div className="modal-field-label">Food Budget (₱)</div>
                  <input
                    className="modal-input"
                    type="number"
                    value={prefForm.food_budget}
                    onChange={(e) =>
                      setPrefForm((p) => ({ ...p, food_budget: e.target.value }))
                    }
                    placeholder="e.g. 3000"
                  />
                </div>
              </div>

              <div className="modal-section-label">Workout Preferences</div>
              <div className="modal-2col">
                <div>
                  <div className="modal-field-label">Plan Type</div>
                  <select
                    className="modal-input"
                    value={prefForm.plan_type}
                    onChange={(e) =>
                      setPrefForm((p) => ({ ...p, plan_type: e.target.value }))
                    }
                  >
                    {PLAN_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="modal-field-label">Workout Days</div>
                  <input
                    className="modal-input"
                    type="number"
                    min="1"
                    max="7"
                    value={prefForm.workout_days}
                    onChange={(e) =>
                      setPrefForm((p) => ({ ...p, workout_days: e.target.value }))
                    }
                    placeholder="1 to 7"
                  />
                </div>

                <div>
                  <div className="modal-field-label">Workout Time</div>
                  <select
                    className="modal-input"
                    value={prefForm.workout_time}
                    onChange={(e) =>
                      setPrefForm((p) => ({ ...p, workout_time: e.target.value }))
                    }
                  >
                    {WORKOUT_TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="modal-field-label">Workout Level</div>
                  <select
                    className="modal-input"
                    value={prefForm.workout_level}
                    onChange={(e) =>
                      setPrefForm((p) => ({ ...p, workout_level: e.target.value }))
                    }
                  >
                    {WORKOUT_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="modal-field-label">Session Minutes</div>
                  <input
                    className="modal-input"
                    type="number"
                    min="10"
                    max="240"
                    value={prefForm.session_minutes}
                    onChange={(e) =>
                      setPrefForm((p) => ({
                        ...p,
                        session_minutes: e.target.value,
                      }))
                    }
                    placeholder="e.g. 60"
                  />
                </div>

                <div>
                  <div className="modal-field-label">Workout Place</div>
                  <select
                    className="modal-input"
                    value={prefForm.workout_place}
                    onChange={(e) =>
                      setPrefForm((p) => ({ ...p, workout_place: e.target.value }))
                    }
                  >
                    {WORKOUT_PLACE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <div className="modal-field-label">Preferred Style</div>
                  <select
                    className="modal-input"
                    value={prefForm.preferred_style}
                    onChange={(e) =>
                      setPrefForm((p) => ({
                        ...p,
                        preferred_style: e.target.value,
                      }))
                    }
                  >
                    {PREFERRED_STYLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-section-label">Meal Preferences</div>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div>
                  <div className="modal-field-label">Dietary Restrictions</div>
                  <MultiToggleChips
                    options={DIETARY_OPTIONS}
                    selectedValues={asArray(prefForm.dietary_restrictions)}
                    onToggle={(value) => toggleArrayItem("dietary_restrictions", value)}
                  />
                </div>

                <div>
                  <div className="modal-field-label">Injuries / Limitations</div>
                  <MultiToggleChips
                    options={INJURY_OPTIONS}
                    selectedValues={asArray(prefForm.injuries)}
                    onToggle={(value) => toggleArrayItem("injuries", value)}
                  />
                </div>
              </div>

              <div className="modal-section-label">Preferred Equipment</div>
              <div className="modal-items-grid">
                {equipments.map((e) => {
                  const id = e.equipment_id ?? e.id;
                  const selected = prefForm.selectedEquipmentIds.has(Number(id));
                  return (
                    <div
                      key={id}
                      className={`modal-item ${selected ? "selected" : ""}`}
                      onClick={() => toggleSelected("equipment", id)}
                    >
                      <div className="modal-item-thumb">
                        {e.image_url ? (
                          <img
                            src={absoluteUrlMaybe(e.image_url)}
                            alt={e.name}
                            onError={(ev) => (ev.currentTarget.style.display = "none")}
                          />
                        ) : (
                          <Dumbbell size={14} />
                        )}
                      </div>
                      <span className="modal-item-name">
                        {e.name || `Equipment #${id}`}
                      </span>
                      <div className="modal-check">
                        {selected && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="modal-section-label">Preferred Amenities</div>
              <div className="modal-items-grid">
                {amenities.map((a) => {
                  const id = a.amenity_id ?? a.id;
                  const selected = prefForm.selectedAmenityIds.has(Number(id));
                  return (
                    <div
                      key={id}
                      className={`modal-item ${selected ? "selected" : ""}`}
                      onClick={() => toggleSelected("amenity", id)}
                    >
                      <div className="modal-item-thumb">
                        {a.image_url ? (
                          <img
                            src={absoluteUrlMaybe(a.image_url)}
                            alt={a.name}
                            onError={(ev) => (ev.currentTarget.style.display = "none")}
                          />
                        ) : (
                          <Building2 size={14} />
                        )}
                      </div>
                      <span className="modal-item-name">
                        {a.name || `Amenity #${id}`}
                      </span>
                      <div className="modal-check">
                        {selected && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onSave} disabled={prefSaving}>
            <Check size={16} /> {prefSaving ? "Saving..." : "Save Preferences"}
          </button>
          <button className="btn-secondary" onClick={onClose} disabled={prefSaving}>
            <X size={16} /> Cancel
          </button>
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
  const [showAllPreferences, setShowAllPreferences] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [localPreview, setLocalPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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
    gender: "",
    profile_photo_url: "",
    created_at: "",
    updated_at: "",
  });
  const [formData, setFormData] = useState({ ...userData });

  const [prefLoading, setPrefLoading] = useState(true);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefView, setPrefView] = useState({
    goal: "",
    activity_level: "",
    budget: "",
    plan_type: "",
    workout_days: "",
    workout_time: "",
    food_budget: "",
    workout_level: "",
    session_minutes: "",
    workout_place: "",
    preferred_style: "",
    dietary_restrictions: [],
    injuries: [],
    preferred_equipments: [],
    preferred_amenities: [],
  });
  const [prefForm, setPrefForm] = useState({
    goal: "",
    activity_level: "",
    budget: "",
    plan_type: "",
    workout_days: "",
    workout_time: "",
    food_budget: "",
    workout_level: "",
    session_minutes: "",
    workout_place: "",
    preferred_style: "",
    dietary_restrictions: [],
    injuries: [],
    selectedEquipmentIds: new Set(),
    selectedAmenityIds: new Set(),
  });
  const [equipments, setEquipments] = useState([]);
  const [amenities, setAmenities] = useState([]);

  const avatarSrc = useMemo(() => {
    if (localPreview) return localPreview;
    const raw =
      (isEditingProfile ? formData.profile_photo_url : userData.profile_photo_url) ||
      "";
    if (!raw) return FALLBACK_AVATAR;
    return absoluteUrlMaybe(raw) || FALLBACK_AVATAR;
  }, [localPreview, isEditingProfile, formData.profile_photo_url, userData.profile_photo_url]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      setLoading(true);
      try {
        const res = await api.get("/me");
        const root = res.data?.user || res.data || {};
        const p = root?.user_profile || {};

        const next = {
          name: root?.name || "",
          email: root?.email || "",
          role: root?.role || "",
          age: p?.age ?? "",
          height: p?.height ?? "",
          weight: p?.weight ?? "",
          address: p?.address ?? "",
          latitude: p?.latitude ?? "",
          longitude: p?.longitude ?? "",
          gender: p?.gender ?? "",
          profile_photo_url: p?.profile_photo_url ?? "",
          created_at: p?.created_at ? String(p.created_at).slice(0, 10) : "",
          updated_at: p?.updated_at ? String(p.updated_at).slice(0, 10) : "",
        };

        if (!mounted) return;
        setUserData(next);
        setFormData(next);
        setLocalPreview("");
        setSelectedFile(null);
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

  useEffect(() => {
    let mounted = true;

    async function loadPrefs() {
      setPrefLoading(true);
      try {
        const [prefRes, eqPickRes, amPickRes, allEqRes, allAmRes] = await Promise.all([
          api.get("/user/preferences"),
          api.get("/user/preferred-equipments"),
          api.get("/user/preferred-amenities"),
          api.get("/equipments"),
          api.get("/amenities"),
        ]);

        const basePref = pickPrefPayload(prefRes.data);

        const preferredEquipments =
          eqPickRes.data?.preferred_equipments ??
          eqPickRes.data?.data ??
          eqPickRes.data ??
          [];
        const preferredAmenities =
          amPickRes.data?.preferred_amenities ??
          amPickRes.data?.data ??
          amPickRes.data ??
          [];

        const allEq = allEqRes.data?.data ?? allEqRes.data ?? [];
        const allAm = allAmRes.data?.data ?? allAmRes.data ?? [];

        const view = {
          ...basePref,
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
          ...basePref,
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

  const processFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alertInfo({
        title: "Invalid file",
        text: "Please choose an image file.",
        theme,
        mainColor: MAIN,
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alertInfo({ title: "File too large", text: "Max 2MB.", theme, mainColor: MAIN });
      return;
    }

    setSelectedFile(file);

    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
  };

  const onPickFile = (e) => processFile(e.target.files?.[0]);

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const uploadAvatar = async () => {
    const file = selectedFile;

    if (!file) {
      alertInfo({
        title: "No image selected",
        text: "Pick or drag an image first.",
        theme,
        mainColor: MAIN,
      });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);

      const res = await api.post("/me/avatar/user", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const url = res.data?.avatar_url;
      if (!url) {
        alertError({
          title: "Upload incomplete",
          text: "Server did not return an image URL.",
          theme,
          mainColor: MAIN,
        });
        return;
      }

      setUserData((p) => ({ ...p, profile_photo_url: url }));
      setFormData((p) => ({ ...p, profile_photo_url: url }));

      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview("");
      setSelectedFile(null);

      if (fileRef.current) fileRef.current.value = "";

      alertSuccess({
        title: "Photo updated",
        text: res.data?.message || "Profile photo updated.",
        theme,
        mainColor: MAIN,
      }).then(() => window.location.reload());
    } catch (err) {
      const validation = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join("\n")
        : null;

      alertError({
        title: "Upload failed",
        text: validation || err?.response?.data?.message || "Failed to upload.",
        theme,
        mainColor: MAIN,
      });
    } finally {
      setUploading(false);
    }
  };

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
        gender: formData.gender || null,
      };

      const res = await api.put("/user/profile", payload);

      alertSuccess({
        title: "Profile updated",
        text: res.data?.message || "Changes saved.",
        theme,
        mainColor: MAIN,
      }).then(() => window.location.reload());
    } catch (err) {
      const validation = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join("\n")
        : null;

      alertError({
        title: "Save failed",
        text: validation || err?.response?.data?.message || "Failed to save.",
        theme,
        mainColor: MAIN,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePreferences = async () => {
    setPrefSaving(true);
    try {
      await api.post("/user/preferences", {
        goal: prefForm.goal || null,
        activity_level: prefForm.activity_level || null,
        budget: prefForm.budget === "" ? null : toNumOrNull(prefForm.budget),
        plan_type: prefForm.plan_type || null,
        workout_days:
          prefForm.workout_days === "" ? null : toNumOrNull(prefForm.workout_days),
        workout_time: prefForm.workout_time || null,
        food_budget:
          prefForm.food_budget === "" ? null : toNumOrNull(prefForm.food_budget),
        workout_level: prefForm.workout_level || null,
        session_minutes:
          prefForm.session_minutes === ""
            ? null
            : toNumOrNull(prefForm.session_minutes),
        workout_place: prefForm.workout_place || null,
        preferred_style: prefForm.preferred_style || null,
        dietary_restrictions: asArray(prefForm.dietary_restrictions),
        injuries: asArray(prefForm.injuries),
      });

      const equipment_ids = Array.from(prefForm.selectedEquipmentIds)
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n));

      const amenity_ids = Array.from(prefForm.selectedAmenityIds)
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n));

      await api.post("/user/preferred-equipments", { equipment_ids });
      await api.post("/user/preferred-amenities", { amenity_ids });

      setPrefModalOpen(false);

      alertSuccess({
        title: "Preferences saved",
        text: "Your preferences were updated.",
        theme,
        mainColor: MAIN,
      }).then(() => window.location.reload());
    } catch (err) {
      const validation = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join("\n")
        : null;

      alertError({
        title: "Save failed",
        text: validation || err?.response?.data?.message || "Failed to save.",
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
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setIsEditingProfile(false);
  };

  const prefEquipText = prefView.preferred_equipments.length
    ? prefView.preferred_equipments
        .map((x) => x?.name || `#${x?.equipment_id ?? x?.id ?? "?"}`)
        .join(", ")
    : "—";

  const prefAmenText = prefView.preferred_amenities.length
    ? prefView.preferred_amenities
        .map((x) => x?.name || `#${x?.amenity_id ?? x?.id ?? "?"}`)
        .join(", ")
    : "—";

  if (loading) {
    return (
      <div
        className="profile-page"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--orange)" }}>
          Loading profile…
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-left">
          <div className="p-card identity-card">
            <div
              className="avatar-zone"
              onClick={() => isEditingProfile && fileRef.current?.click()}
            >
              <img src={avatarSrc} alt="Profile" className="avatar-img" />
              {isEditingProfile && (
                <div className="avatar-edit-overlay">
                  <Camera size={18} />
                  Change
                </div>
              )}
            </div>

            <h2 className="user-name">{userData.name || "—"}</h2>
            <p className="user-email">{userData.email || "—"}</p>

            <div className="sidebar-actions">
              <button
                className="btn-primary"
                onClick={() => setIsEditingProfile(true)}
                disabled={prefSaving || uploading}
              >
                <Pencil size={15} /> Edit Profile
              </button>
              <button
                className="btn-secondary"
                onClick={() => setPrefModalOpen(true)}
                disabled={prefLoading || prefSaving}
              >
                <SlidersHorizontal size={15} /> Edit Preferences
              </button>
            </div>
          </div>

          {isEditingProfile && (
            <div className="p-card upload-card">
              <span className="upload-card-label">Update Photo</span>

              {localPreview ? (
                <>
                  <img src={localPreview} alt="Preview" className="upload-preview-img" />
                  <div className="upload-actions">
                    <button
                      className="btn-primary"
                      onClick={uploadAvatar}
                      disabled={uploading}
                      style={{ padding: "0.75rem" }}
                    >
                      <Upload size={15} /> {uploading ? "Uploading..." : "Upload"}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        if (localPreview) URL.revokeObjectURL(localPreview);
                        setLocalPreview("");
                        setSelectedFile(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      disabled={uploading}
                      style={{ padding: "0.75rem" }}
                    >
                      <X size={15} /> Clear
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className={`upload-drop-zone ${isDragging ? "dragging" : ""}`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} />
                  <div className="upload-drop-icon">
                    <ImageUp size={28} />
                  </div>
                  <p className="upload-drop-text">
                    Drag & drop or <span>browse</span>
                    <br />
                    PNG, JPG up to 2MB
                  </p>
                </div>
              )}
            </div>
          )}

          {userData.role === "user" && (
            <div className="p-card owner-card">
              <div className="owner-card-glow" />
              <div className="owner-icon-box">
                <Building2 size={22} />
              </div>
              <h3 className="owner-card-title">Own a Gym?</h3>
              <p className="owner-card-desc">
                List your gym on ExerSearch and reach thousands of fitness enthusiasts in
                Pasig.
              </p>
              <Link to="/home/becomeowner" className="btn-owner">
                Become an Owner <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>

        <div className="profile-right">
          {isEditingProfile ? (
            <div className="p-card">
              <div className="card-head">
                <span className="card-head-title">Edit Profile</span>
                <span className="card-head-tag">Unsaved Changes</span>
              </div>
              <div className="card-body">
                <div className="edit-form-grid">
                  <div className="field-group">
                    <label className="field-label">
                      <Calendar size={12} /> Age
                    </label>
                    <input
                      className="field-input"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="e.g. 24"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      <Ruler size={12} /> Height (cm)
                    </label>
                    <input
                      className="field-input"
                      name="height"
                      type="number"
                      value={formData.height}
                      onChange={handleInputChange}
                      placeholder="e.g. 170"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      <Weight size={12} /> Weight (kg)
                    </label>
                    <input
                      className="field-input"
                      name="weight"
                      type="number"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="e.g. 70"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      <User size={12} /> Gender
                    </label>
                    <select
                      className="field-input"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      <MapPin size={12} /> Latitude
                    </label>
                    <input
                      className="field-input"
                      name="latitude"
                      type="number"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      placeholder="e.g. 14.5764"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      <MapPin size={12} /> Longitude
                    </label>
                    <input
                      className="field-input"
                      name="longitude"
                      type="number"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      placeholder="e.g. 121.0851"
                    />
                  </div>
                  <div className="field-group span-full">
                    <label className="field-label">
                      <MapPin size={12} /> Address
                    </label>
                    <input
                      className="field-input"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="e.g. Pasig City, Metro Manila"
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      className="btn-primary"
                      onClick={saveProfile}
                      disabled={savingProfile || uploading || prefSaving}
                    >
                      <Check size={15} /> {savingProfile ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={cancelProfileEdit}
                      disabled={savingProfile || uploading || prefSaving}
                    >
                      <X size={15} /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-card">
                <div className="card-head">
                  <span className="card-head-title">Personal Information</span>
                  <span className="card-head-tag">
                    Member since {userData.created_at || "—"}
                  </span>
                </div>
                <div className="card-body">
                  <div className="info-grid">
                    <div className="info-tile">
                      <div className="tile-label">
                        <User size={11} /> Name
                      </div>
                      <div className="tile-value">{userData.name || "—"}</div>
                    </div>
                    <div className="info-tile">
                      <div className="tile-label">
                        <Mail size={11} /> Email
                      </div>
                      <div className="tile-value" style={{ fontSize: "0.9rem" }}>
                        {userData.email || "—"}
                      </div>
                    </div>
                    <div className="info-tile">
                      <div className="tile-label">
                        <Calendar size={11} /> Age
                      </div>
                      <div className="tile-value">
                        {userData.age ? `${userData.age} yrs` : "—"}
                      </div>
                    </div>
                    <div className="info-tile">
                      <div className="tile-label">
                        <Ruler size={11} /> Height
                      </div>
                      <div className="tile-value">
                        {userData.height ? `${userData.height} cm` : "—"}
                      </div>
                    </div>
                    <div className="info-tile">
                      <div className="tile-label">
                        <Weight size={11} /> Weight
                      </div>
                      <div className="tile-value">
                        {userData.weight ? `${userData.weight} kg` : "—"}
                      </div>
                    </div>
                    <div className="info-tile">
                      <div className="tile-label">
                        <User size={11} /> Gender
                      </div>
                      <div className="tile-value">{prettifyLabel(userData.gender)}</div>
                    </div>
                    <div className="info-tile span-full">
                      <div className="tile-label">
                        <MapPin size={11} /> Address
                      </div>
                      <div className="tile-value">{userData.address || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-card">
                <div className="card-head">
                  <span className="card-head-title">Fitness Preferences</span>
                  <span className="card-head-tag">
                    {showAllPreferences ? "Expanded View" : "Compact View"}
                  </span>
                </div>
                <div className="card-body">
                  {prefLoading ? (
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--gray-500)",
                        padding: "1rem 0",
                      }}
                    >
                      Fetching preferences…
                    </div>
                  ) : (
                    <>
                      <div className="pref-grid">
                        <div className="info-tile">
                          <div className="tile-label">
                            <Target size={11} /> Goal
                          </div>
                          <div className="tile-value">{prettifyLabel(prefView.goal)}</div>
                        </div>

                        <div className="info-tile">
                          <div className="tile-label">
                            <Activity size={11} /> Activity Level
                          </div>
                          <div className="tile-value">
                            {prettifyLabel(prefView.activity_level)}
                          </div>
                        </div>

                        <div className="info-tile">
                          <div className="tile-label">
                            <Flame size={11} /> Workout Level
                          </div>
                          <div className="tile-value">
                            {prettifyLabel(prefView.workout_level)}
                          </div>
                        </div>

                        <div className="info-tile">
                          <div className="tile-label">
                            <Building2 size={11} /> Workout Place
                          </div>
                          <div className="tile-value">
                            {prettifyLabel(prefView.workout_place)}
                          </div>
                        </div>

                        <div className="info-tile">
                          <div className="tile-label">
                            <Target size={11} /> Preferred Style
                          </div>
                          <div className="tile-value">
                            {prettifyLabel(prefView.preferred_style)}
                          </div>
                        </div>

                        <div className="info-tile">
                          <div className="tile-label">
                            <Salad size={11} /> Dietary Restrictions
                          </div>
                          <div className="tile-value">
                            {prefView.dietary_restrictions.length
                              ? `${prefView.dietary_restrictions.length} selected`
                              : "—"}
                          </div>
                        </div>

                        {showAllPreferences && (
                          <>
                            <div className="info-tile">
                              <div className="tile-label">
                                <Wallet size={11} /> Budget
                              </div>
                              <div className="tile-value">
                                {prefView.budget === "" || prefView.budget == null
                                  ? "—"
                                  : `₱${Number(prefView.budget).toLocaleString()}`}
                              </div>
                            </div>

                            <div className="info-tile">
                              <div className="tile-label">
                                <Salad size={11} /> Food Budget
                              </div>
                              <div className="tile-value">
                                {prefView.food_budget === "" || prefView.food_budget == null
                                  ? "—"
                                  : `₱${Number(prefView.food_budget).toLocaleString()}`}
                              </div>
                            </div>

                            <div className="info-tile">
                              <div className="tile-label">
                                <Calendar size={11} /> Plan Type
                              </div>
                              <div className="tile-value">
                                {prettifyLabel(prefView.plan_type)}
                              </div>
                            </div>

                            <div className="info-tile">
                              <div className="tile-label">
                                <Dumbbell size={11} /> Workout Days
                              </div>
                              <div className="tile-value">
                                {prefView.workout_days ? `${prefView.workout_days} days` : "—"}
                              </div>
                            </div>

                            <div className="info-tile">
                              <div className="tile-label">
                                <Clock3 size={11} /> Workout Time
                              </div>
                              <div className="tile-value">
                                {prettifyLabel(prefView.workout_time)}
                              </div>
                            </div>

                            <div className="info-tile">
                              <div className="tile-label">
                                <Clock3 size={11} /> Session Minutes
                              </div>
                              <div className="tile-value">
                                {prefView.session_minutes
                                  ? `${prefView.session_minutes} mins`
                                  : "—"}
                              </div>
                            </div>

                            <div className="info-tile span-full">
                              <div className="tile-label">
                                <HeartPulse size={11} /> Injuries / Limitations
                              </div>
                              <div className="tile-value">
                                {prefView.injuries.length
                                  ? prefView.injuries
                                      .map((x) => prettifyLabel(x))
                                      .join(", ")
                                  : "—"}
                              </div>
                            </div>

                            <div className="info-tile span-full">
                              <div className="tile-label">
                                <Dumbbell size={11} /> Preferred Equipment
                              </div>
                              <div
                                className="tile-value"
                                style={{ fontSize: "0.9rem", fontWeight: 600 }}
                              >
                                {prefEquipText}
                              </div>
                            </div>

                            <div className="info-tile span-full">
                              <div className="tile-label">
                                <Building2 size={11} /> Preferred Amenities
                              </div>
                              <div
                                className="tile-value"
                                style={{ fontSize: "0.9rem", fontWeight: 600 }}
                              >
                                {prefAmenText}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: "1rem",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setShowAllPreferences((prev) => !prev)}
                          style={{ width: "auto", padding: "0.7rem 1.15rem" }}
                        >
                          {showAllPreferences ? "Show Less" : "Show More"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <PrefModal
        open={prefModalOpen}
        onClose={() => setPrefModalOpen(false)}
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