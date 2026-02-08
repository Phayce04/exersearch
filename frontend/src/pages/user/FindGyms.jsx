// src/pages/user/FindGyms.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Homestyles.css";

import {
  fetchAmenities,
  fetchEquipments,
  groupEquipmentsByTypeAndMuscle,
  labelForSelectedKey,
  absoluteUrl,
  prettyCategory,
  parseTargets,
} from "../../utils/findGymsData";

import {
  getUserPreference,
  getUserPreferredEquipments,
  getUserPreferredAmenities,
  getUserProfile,
  saveUserPreferences,
  savePreferredEquipments,
  savePreferredAmenities,
  saveUserProfileLocation,
} from "../../utils/findGymsApi";

// -----------------------
// CONFIG: redirect route
// -----------------------
const GYMS_LIST_ROUTE = "/user/gyms"; // ✅ change to your gyms list page route
const MAIN_ORANGE = "#ff8c00";

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// -------- helpers: selectedItems -> payloads --------
function buildBudget(selectedItems) {
  const k = Object.keys(selectedItems).find((x) => x.startsWith("budget:"));
  if (!k) return null;
  const v = Number(k.split(":")[1]);
  return Number.isFinite(v) ? v : null;
}

function buildEquipmentIds(selectedItems) {
  return Object.keys(selectedItems)
    .filter((k) => k.startsWith("equipment:"))
    .map((k) => Number(k.split(":")[1]))
    .filter((n) => Number.isFinite(n));
}

function buildAmenityIds(selectedItems) {
  return Object.keys(selectedItems)
    .filter((k) => k.startsWith("amenity:"))
    .map((k) => Number(k.split(":")[1]))
    .filter((n) => Number.isFinite(n));
}

function getSelectedLocationKey(selectedItems) {
  const k = Object.keys(selectedItems).find((x) => x.startsWith("location:"));
  return k || null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function FindGyms() {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Keys like: amenity:12, equipment:55, budget:200, gymtype:..., location:...
  const [selectedItems, setSelectedItems] = useState({});

  // Location
  const [locationInput, setLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pinLocation, setPinLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([14.5764, 121.0851]);
  const [mapKey, setMapKey] = useState(0);

  // coords to backend
  const [locationMeta, setLocationMeta] = useState({
    address: "",
    lat: null,
    lng: null,
  });

  // DB options
  const [amenities, setAmenities] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState(null);

  // Load state for existing picks
  const [prefsLoading, setPrefsLoading] = useState(false);

  // Equipment preview modal
  const [previewEquip, setPreviewEquip] = useState(null);

  // ✅ Loading effects
  const [savingPhase, setSavingPhase] = useState(false);
  const [rankingPhase, setRankingPhase] = useState(false);
  const [progress, setProgress] = useState(0);

  // steps
  const sections = ["Location", "Budget", "Amenities", "Gym Types", "Machines", "Free Weights"];

  // Static sections for now
  const sectionData = {
    Budget: [
      { label: "₱50 and below", value: 50 },
      { label: "₱100 and below", value: 100 },
      { label: "₱200", value: 200 },
      { label: "₱300", value: 300 },
      { label: "₱500 and above", value: 500 },
    ],
    "Gym Types": [
      "Commercial Gym - Large gym with full equipment",
      "Local Gym - Small neighborhood gym",
      "24-Hour Gym - Open anytime",
      "Budget Gym - Affordable rates",
      "Franchise Gym - Branded gym",
    ],
  };

  // selection styling (works even without CSS updates)
  const selectedStyle = {
    border: `2px solid ${MAIN_ORANGE}`,
    background: "rgba(255,140,0,0.12)",
  };

  const isSelected = (key) => !!selectedItems[key];

  // ---------- Load master options + user saved picks ----------
  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      setOptionsLoading(true);
      setOptionsError(null);
      setPrefsLoading(true);

      try {
        const [amen, eq] = await Promise.all([fetchAmenities(), fetchEquipments()]);
        if (!mounted) return;
        setAmenities(amen || []);
        setEquipments(eq || []);

        // user saved picks
        try {
          const [prefRes, eqRes, amRes, profileRes] = await Promise.all([
            getUserPreference(),
            getUserPreferredEquipments(),
            getUserPreferredAmenities(),
            getUserProfile(),
          ]);

          const pref = prefRes?.data ?? null;
          const preferredEquip = Array.isArray(eqRes?.data) ? eqRes.data : [];
          const preferredAmen = Array.isArray(amRes?.data) ? amRes.data : [];
          const profile = profileRes?.user_profile ?? null;

          const nextSelected = {};

          // budget
          const budget = pref?.budget;
          if (budget !== null && budget !== undefined && budget !== "") {
            const n = Number(budget);
            if (Number.isFinite(n)) nextSelected[`budget:${n}`] = true;
          }

          // preferred equipments
          for (const e of preferredEquip) {
            const id = Number(e?.equipment_id ?? e?.id);
            if (Number.isFinite(id)) nextSelected[`equipment:${id}`] = true;
          }

          // preferred amenities
          for (const a of preferredAmen) {
            const id = Number(a?.amenity_id ?? a?.id);
            if (Number.isFinite(id)) nextSelected[`amenity:${id}`] = true;
          }

          // location from profile
          const addr = profile?.address || "";
          const lat = profile?.latitude;
          const lng = profile?.longitude;

          if (addr) {
            nextSelected[`location:${addr}`] = true;
            setLocationInput(addr);
            setLocationMeta({ address: addr, lat: lat ?? null, lng: lng ?? null });
          }

          if (lat != null && lng != null) {
            const la = Number(lat);
            const lo = Number(lng);
            if (Number.isFinite(la) && Number.isFinite(lo)) {
              setPinLocation([la, lo]);
              setMapCenter([la, lo]);
              setMapKey((k) => k + 1);
              setLocationMeta((prev) => ({
                address: prev.address || addr || `${la}, ${lo}`,
                lat: la,
                lng: lo,
              }));
            }
          }

          setSelectedItems(nextSelected);
        } catch (e) {
          console.warn("[FindGyms] user preference load skipped:", e?.message || e);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setOptionsError(String(e?.message || e));
      } finally {
        if (mounted) {
          setOptionsLoading(false);
          setPrefsLoading(false);
        }
      }
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  // grouped by muscle groups
  const grouped = useMemo(() => groupEquipmentsByTypeAndMuscle(equipments), [equipments]);

  const openModal = () => {
    setIsModalOpen(true);
    setCurrentStep(0);
  };

  const closeModal = () => {
    if (savingPhase || rankingPhase) return; // ✅ prevent closing while saving/ranking
    setIsModalOpen(false);
    setPreviewEquip(null);
    setShowSuggestions(false);
  };

  const nextStep = () => {
    if (currentStep < sections.length - 1) setCurrentStep((s) => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const addSelected = (key) => {
    // keep one location only
    if (key.startsWith("location:")) {
      const next = {};
      Object.keys(selectedItems).forEach((k) => {
        if (!k.startsWith("location:")) next[k] = true;
      });
      next[key] = true;
      setSelectedItems(next);
      return;
    }

    // keep one budget only
    if (key.startsWith("budget:")) {
      const next = {};
      Object.keys(selectedItems).forEach((k) => {
        if (!k.startsWith("budget:")) next[k] = true;
      });
      next[key] = true;
      setSelectedItems(next);
      return;
    }

    // ✅ toggle for equipments/amenities feels better
    if (key.startsWith("equipment:") || key.startsWith("amenity:")) {
      setSelectedItems((prev) => {
        const next = { ...prev };
        if (next[key]) delete next[key];
        else next[key] = true;
        return next;
      });
      return;
    }

    setSelectedItems((prev) => ({ ...prev, [key]: true }));
  };

  const removeSelected = (key) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    if (key.startsWith("location:")) {
      setLocationInput("");
      setLocationMeta({ address: "", lat: null, lng: null });
      setPinLocation(null);
      setMapCenter([14.5764, 121.0851]);
      setMapKey((k) => k + 1);
    }
  };

  // ✅ Apply at the END: SAVE to backend + loading effects + redirect
  const handleApply = async () => {
    try {
      // ---- Phase 1: Saving ----
      setSavingPhase(true);
      setRankingPhase(false);
      setProgress(5);

      const budget = buildBudget(selectedItems);
      if (budget !== null) {
        setProgress(15);
        await saveUserPreferences({ budget });
      }

      const equipment_ids = buildEquipmentIds(selectedItems);
      setProgress(30);
      await savePreferredEquipments(equipment_ids);

      const amenity_ids = buildAmenityIds(selectedItems);
      setProgress(50);
      await savePreferredAmenities(amenity_ids);

      const locKey = getSelectedLocationKey(selectedItems);
      const address = locKey ? locKey.slice("location:".length) : (locationMeta.address || "");
      if (address || (locationMeta?.lat != null && locationMeta?.lng != null)) {
        setProgress(65);
        await saveUserProfileLocation({
          address: address || null,
          latitude: locationMeta.lat,
          longitude: locationMeta.lng,
        });
      }

      setProgress(80);

      // small pause so user feels the save is real
      await sleep(450);

      setProgress(100);
      await sleep(250);

      // ---- Phase 2: Ranking / Calculating ----
      setSavingPhase(false);
      setRankingPhase(true);
      setProgress(0);

      // fake "calculation" progress
      // (later, replace this with a real API call to your ranking endpoint)
      const steps = [10, 22, 35, 48, 60, 72, 84, 92, 100];
      for (const p of steps) {
        setProgress(p);
        await sleep(180);
      }

      // redirect to gyms list (your ranking page)
      closeModal();
      navigate(GYMS_LIST_ROUTE, { replace: false });
    } catch (e) {
      console.error("❌ Apply failed:", e);
      setSavingPhase(false);
      setRankingPhase(false);
      setProgress(0);
      alert(`Failed to save:\n${e.message}`);
    }
  };

  // ---------- Location helpers ----------
  const photonSearch = async (q) => {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      q
    )}&limit=15&lang=en&lon=121.0851&lat=14.5764`;
    const res = await fetch(url);
    const data = await res.json();
    return data;
  };

  const toPasigResults = (features) => {
    return (features || [])
      .filter((f) => {
        const props = f.properties || {};
        return (
          props.city === "Pasig" ||
          props.city === "Pasig City" ||
          props.district === "Pasig" ||
          (props.state && props.state.includes("Metro Manila"))
        );
      })
      .map((f) => ({
        display_name: `${f.properties.name || f.properties.street || ""}, ${
          f.properties.city || "Pasig"
        }, Philippines`,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
      }));
  };

  const handleLocationInput = async (value) => {
    setLocationInput(value);

    if (value.length > 2) {
      try {
        const data = await photonSearch(value + " Pasig");
        const pasigResults = toPasigResults(data.features || []);
        setLocationSuggestions(pasigResults);
        setShowSuggestions(pasigResults.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const applyLocation = ({ address, lat, lon }) => {
    const newLocation = [parseFloat(lat), parseFloat(lon)];
    setPinLocation(newLocation);
    setMapCenter(newLocation);
    setMapKey((k) => k + 1);

    setLocationInput(address);
    setLocationMeta({ address, lat: Number(lat), lng: Number(lon) });

    addSelected(`location:${address}`);
  };

  const selectSuggestion = (suggestion) => {
    setShowSuggestions(false);
    applyLocation({
      address: suggestion.display_name,
      lat: suggestion.lat,
      lon: suggestion.lon,
    });
  };

  const searchLocation = async () => {
    const q = locationInput.trim();
    if (!q) return;

    setShowSuggestions(false);

    try {
      const data = await photonSearch(q + " Pasig");
      const pasigResults = toPasigResults(data.features || []);
      const best = pasigResults[0];

      if (best?.lat && best?.lon) {
        applyLocation({ address: best.display_name, lat: best.lat, lon: best.lon });
      } else {
        setLocationMeta({ address: q, lat: null, lng: null });
        addSelected(`location:${q}`);
      }
    } catch (e) {
      console.error(e);
      setLocationMeta({ address: q, lat: null, lng: null });
      addSelected(`location:${q}`);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setPinLocation([lat, lng]);
        setMapCenter([lat, lng]);
        setMapKey((k) => k + 1);

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then((res) => res.json())
          .then((data) => {
            const name = data.display_name || `${lat}, ${lng}`;
            setLocationInput(name);
            setLocationMeta({ address: name, lat, lng });
            addSelected(`location:${name}`);
          })
          .catch(() => {
            const name = `${lat}, ${lng}`;
            setLocationInput(name);
            setLocationMeta({ address: name, lat, lng });
            addSelected(`location:${name}`);
          });
      },
      (error) => {
        alert("Unable to get your location. Please enter manually.");
        console.error(error);
      }
    );
  };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;

        setPinLocation([lat, lng]);

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then((res) => res.json())
          .then((data) => {
            const name = data.display_name || `${lat}, ${lng}`;
            setLocationInput(name);
            setLocationMeta({ address: name, lat, lng });
            addSelected(`location:${name}`);
          })
          .catch(() => {
            const name = `${lat}, ${lng}`;
            setLocationInput(name);
            setLocationMeta({ address: name, lat, lng });
            addSelected(`location:${name}`);
          });
      },
    });

    return pinLocation ? <Marker position={pinLocation} /> : null;
  }

  const prettySelectedLabel = useCallback(
    (key) => labelForSelectedKey(key, amenities, equipments),
    [amenities, equipments]
  );

  // Equipment Preview
  const openEquipPreview = (equip) => setPreviewEquip(equip);
  const closeEquipPreview = () => setPreviewEquip(null);

  // Equipment Group Renderer
  const renderEquipmentGroups = (entries) => {
    if (optionsLoading) return <p style={{ padding: 10 }}>Loading equipments…</p>;
    if (optionsError) return <p style={{ padding: 10, color: "red" }}>{optionsError}</p>;
    if (!entries || entries.length === 0) return <p>No equipments found.</p>;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {entries.map(([groupName, list]) => (
          <div key={groupName}>
            <div style={{ fontWeight: 800, margin: "6px 0 10px", opacity: 0.9 }}>
              {groupName}
            </div>

            <div className="options-grid">
              {list.map((e) => {
                const key = `equipment:${e.equipment_id}`;
                const picked = isSelected(key);

                return (
                  <div
                    key={e.equipment_id}
                    className="option equip-card"
                    style={picked ? selectedStyle : undefined}
                    onClick={() => addSelected(key)}
                  >
                    <div className="equip-topbar">
                      <strong className="equip-title">{e.name}</strong>

                      <button
                        type="button"
                        className="equip-viewBtn equip-viewBtn--dots"
                        title="View details"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openEquipPreview(e);
                        }}
                      >
                        ⋯
                      </button>
                    </div>

                    {e.image_url ? (
                      <div className="equip-imgWrap">
                        <img src={absoluteUrl(e.image_url)} alt={e.name} />
                      </div>
                    ) : (
                      <div className="equip-imgPlaceholder">No image</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLeftPanel = () => {
    const currentSection = sections[currentStep];

    // LOCATION
    if (currentSection === "Location") {
      return (
        <div className="location-section">
          {prefsLoading ? (
            <p style={{ fontWeight: 800, opacity: 0.8 }}>Loading your saved preferences…</p>
          ) : null}

          <p className="section-title">Set your location:</p>

          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                className="input-box"
                placeholder="Enter your address in Pasig City"
                value={locationInput}
                onChange={(e) => handleLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchLocation();
                }}
                style={{ flex: 1, marginBottom: 0 }}
                disabled={savingPhase || rankingPhase}
              />

              <button
                className="location-btn"
                onClick={searchLocation}
                disabled={savingPhase || rankingPhase}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: MAIN_ORANGE,
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Search
              </button>
            </div>

            {showSuggestions && locationSuggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: "140px",
                  background: "white",
                  border: `2px solid ${MAIN_ORANGE}`,
                  borderTop: "none",
                  borderRadius: "0 0 4px 4px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
              >
                {locationSuggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectSuggestion(s)}
                    style={{
                      padding: "0.75rem",
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      fontSize: "0.9rem",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fff5e6")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="location-btn"
            onClick={getCurrentLocation}
            disabled={savingPhase || rankingPhase}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: MAIN_ORANGE,
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "1rem",
              fontWeight: "bold",
            }}
          >
            📍 Use My Current Location
          </button>

          <div
            style={{
              height: "400px",
              marginTop: "1rem",
              border: `2px solid ${MAIN_ORANGE}`,
              borderRadius: "4px",
              overflow: "hidden",
              opacity: savingPhase || rankingPhase ? 0.7 : 1,
              pointerEvents: savingPhase || rankingPhase ? "none" : "auto",
            }}
          >
            <MapContainer
              key={mapKey}
              center={mapCenter}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <LocationMarker />
            </MapContainer>
          </div>

          <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
            Click anywhere on the map to pin your location
          </p>
        </div>
      );
    }

    // AMENITIES
    if (currentSection === "Amenities") {
      if (optionsLoading) return <p style={{ padding: 10 }}>Loading amenities…</p>;
      if (optionsError) return <p style={{ padding: 10, color: "red" }}>{optionsError}</p>;

      return (
        <div className="options-grid" style={{ opacity: savingPhase || rankingPhase ? 0.7 : 1 }}>
          {amenities.map((a) => {
            const key = `amenity:${a.amenity_id}`;
            const picked = isSelected(key);

            return (
              <div
                key={a.amenity_id}
                className="option"
                style={picked ? selectedStyle : undefined}
                onClick={() => !(savingPhase || rankingPhase) && addSelected(key)}
              >
                <strong>{a.name}</strong>
                {a.image_url ? <img src={absoluteUrl(a.image_url)} alt={a.name} /> : null}
              </div>
            );
          })}
          {amenities.length === 0 ? <p>No amenities found.</p> : null}
        </div>
      );
    }

    // MACHINES
    if (currentSection === "Machines") return renderEquipmentGroups(grouped.machines);

    // FREE WEIGHTS
    if (currentSection === "Free Weights") return renderEquipmentGroups(grouped.freeWeights);

    // DEFAULT: Budget + Gym Types
    const options = sectionData[currentSection] || [];
    return (
      <div className="options-grid" style={{ opacity: savingPhase || rankingPhase ? 0.7 : 1 }}>
        {options.map((option, index) => {
          const isObj = typeof option === "object";
          const text = isObj ? option.label : option;

          const key =
            currentSection === "Budget" && isObj
              ? `budget:${option.value}`
              : currentSection === "Gym Types"
              ? `gymtype:${text}`
              : text;

          const picked = isSelected(key);

          return (
            <div
              key={index}
              className="option"
              style={picked ? selectedStyle : undefined}
              onClick={() => !(savingPhase || rankingPhase) && addSelected(key)}
            >
              <strong>{text}</strong>
            </div>
          );
        })}
      </div>
    );
  };

  const isLastStep = currentStep === sections.length - 1;

  // -----------------------
  // Overlay Component
  // -----------------------
  const showOverlay = savingPhase || rankingPhase;
  const overlayTitle = savingPhase ? "Saving preferences…" : "Ranking gyms for you…";
  const overlaySub = savingPhase
    ? "Updating your selections. Please wait."
    : "Crunching data and matching gyms to your preferences.";

  return (
    <div className="find-gyms-page">
      <section className="section-hero">
        <div className="hero-overlay">
          <h1>FIND THE GYM THAT FITS YOUR LIFESTYLE</h1>
          <button onClick={openModal} className="hero-btn">
            Set Preference
          </button>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-bg" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{sections[currentStep]}</h2>
              <button className="modal-close" onClick={closeModal} disabled={showOverlay}>
                ✖
              </button>
            </div>

            <div className="modal-content">
              <div className="left-panel">{renderLeftPanel()}</div>

              <div className="right-panel">
                <h3>Selected Preferences</h3>

                <div className="selected-list">
                  {Object.keys(selectedItems).length === 0 ? (
                    <p className="empty-message">No items selected yet</p>
                  ) : (
                    Object.keys(selectedItems).map((key, index) => (
                      <div key={index} className="selected-item">
                        <span>{prettySelectedLabel(key)}</span>
                        <button
                          className="remove-btn"
                          onClick={() => !(savingPhase || rankingPhase) && removeSelected(key)}
                          disabled={showOverlay}
                        >
                          ✖
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="nav-btn"
                onClick={prevStep}
                disabled={currentStep === 0 || showOverlay}
              >
                <span className="arrow left"></span>
              </button>

              <div className="step-indicator">
                Step {currentStep + 1} of {sections.length}
              </div>

              {!isLastStep ? (
                <button className="nav-btn" onClick={nextStep} disabled={showOverlay}>
                  <span className="arrow right"></span>
                </button>
              ) : (
                <button
                  className="apply-btn apply-btn--compact"
                  onClick={handleApply}
                  disabled={showOverlay}
                >
                  {savingPhase ? "SAVING..." : rankingPhase ? "RANKING..." : "APPLY PREFERENCES"}
                </button>
              )}
            </div>

            {/* Equipment Preview Modal */}
            {previewEquip && !showOverlay && (
              <div className="equip-preview-bg" onClick={closeEquipPreview}>
                <div className="equip-preview" onClick={(e) => e.stopPropagation()}>
                  <div className="equip-preview-head">
                    <div className="equip-preview-title">{previewEquip.name}</div>
                    <button className="equip-preview-close" onClick={closeEquipPreview}>
                      ✖
                    </button>
                  </div>

                  {previewEquip.image_url ? (
                    <div className="equip-preview-imgWrap">
                      <img src={absoluteUrl(previewEquip.image_url)} alt={previewEquip.name} />
                    </div>
                  ) : null}

                  <div className="equip-preview-meta">
                    <div>
                      <strong>Type:</strong> {prettyCategory(previewEquip.category) || "-"}
                    </div>
                    <div>
                      <strong>Difficulty:</strong> {previewEquip.difficulty || "-"}
                    </div>
                    <div>
                      <strong>Target:</strong>{" "}
                      {parseTargets(previewEquip.target_muscle_group).join(", ") || "-"}
                    </div>
                  </div>

                  {previewEquip.description ? (
                    <div className="equip-preview-desc">
                      <strong>Description</strong>
                      <div>{previewEquip.description}</div>
                    </div>
                  ) : null}

                  <div className="equip-preview-actions">
                    <button
                      className="equip-preview-select"
                      onClick={() => {
                        addSelected(`equipment:${previewEquip.equipment_id}`);
                        closeEquipPreview();
                      }}
                    >
                      Select this equipment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ Saving / Ranking Overlay */}
            {showOverlay && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    width: "min(520px, 92%)",
                    background: "#111",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 16,
                    padding: 18,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                  }}
                >
                  <div style={{ fontWeight: 950, fontSize: 18 }}>{overlayTitle}</div>
                  <div style={{ opacity: 0.85, marginTop: 6, fontWeight: 700 }}>
                    {overlaySub}
                  </div>

                  {/* spinner */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "3px solid rgba(255,255,255,0.25)",
                        borderTopColor: MAIN_ORANGE,
                        animation: "spin 0.9s linear infinite",
                      }}
                    />
                    <div style={{ fontWeight: 900 }}>{progress}%</div>
                  </div>

                  {/* progress bar */}
                  <div
                    style={{
                      height: 10,
                      background: "rgba(255,255,255,0.12)",
                      borderRadius: 999,
                      overflow: "hidden",
                      marginTop: 10,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: MAIN_ORANGE,
                        borderRadius: 999,
                        transition: "width 180ms ease",
                      }}
                    />
                  </div>

                  <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8, fontWeight: 700 }}>
                    Please don’t close this window.
                  </div>
                </div>

                {/* keyframes */}
                <style>{`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
