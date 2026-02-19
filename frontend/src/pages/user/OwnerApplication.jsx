import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import HeaderUser from "./Header-user";
import Footer from "./Footer";
import "./OwnerApplication.css";
import {
  FaArrowRight, FaArrowLeft, FaCheck, FaUser,
  FaFileAlt, FaCamera, FaUpload,
  FaTimes, FaMapMarkerAlt, FaDumbbell, FaCheckCircle,
} from "react-icons/fa";

const STEPS = [
  { id: 0, label: "Owner Info", icon: FaUser },
  { id: 1, label: "Gym Details", icon: FaDumbbell },
  { id: 2, label: "Location", icon: FaMapMarkerAlt },
  { id: 3, label: "Photos & Docs", icon: FaCamera },
  { id: 4, label: "Review", icon: FaCheckCircle },
];

const AMENITIES = [
  "Shower Rooms","Locker Rooms","Parking","Air Conditioning",
  "WiFi","Personal Training","Cardio Area","Free Weights",
  "Weight Machines","Boxing Area","Yoga/Stretching Area",
  "Juice Bar","CCTV Security","Open 24 Hours",
];

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const generateHours = () => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    const h = i % 12 || 12;
    const ampm = i < 12 ? 'AM' : 'PM';
    hours.push({ label: `${h}:00 ${ampm}`, value: `${String(i).padStart(2,'0')}:00` });
    hours.push({ label: `${h}:30 ${ampm}`, value: `${String(i).padStart(2,'0')}:30` });
  }
  return hours;
};
const HOURS = generateHours();

// Accurate Pasig City boundary polygon (simplified from OSM data)
// Coordinates: [lng, lat] pairs tracing the city outline
const PASIG_POLYGON_LATLNG = [
  [14.6100, 121.0430], [14.6140, 121.0500], [14.6160, 121.0580],
  [14.6130, 121.0660], [14.6090, 121.0740], [14.6050, 121.0820],
  [14.6010, 121.0890], [14.5970, 121.0960], [14.5920, 121.1020],
  [14.5870, 121.1080], [14.5810, 121.1130], [14.5750, 121.1160],
  [14.5690, 121.1150], [14.5630, 121.1120], [14.5570, 121.1080],
  [14.5520, 121.1030], [14.5480, 121.0970], [14.5450, 121.0900],
  [14.5430, 121.0830], [14.5420, 121.0760], [14.5430, 121.0690],
  [14.5460, 121.0620], [14.5500, 121.0560], [14.5550, 121.0510],
  [14.5610, 121.0470], [14.5670, 121.0440], [14.5740, 121.0420],
  [14.5810, 121.0415],[14.5880, 121.0425],[14.5950, 121.0430],
  [14.6020, 121.0430],[14.6100, 121.0430],
];

// Point-in-polygon ray casting
function pointInPolygon(lat, lng, polygon) {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

const PASIG_BOUNDS = [[14.5400, 121.0400], [14.6200, 121.1200]];
const PASIG_CENTER = [14.5764, 121.0851];

const INIT = {
  fullName:"", email:"", contactNumber:"", businessName:"", businessReg:null,
  gymName:"", description:"", amenities:[],
  address:"", city:"Pasig City", landmark:"", lat:14.5764, lng:121.0851,
  hours:{
    Monday:{open:"06:00",close:"22:00"},Tuesday:{open:"06:00",close:"22:00"},
    Wednesday:{open:"06:00",close:"22:00"},Thursday:{open:"06:00",close:"22:00"},
    Friday:{open:"06:00",close:"22:00"},Saturday:{open:"06:00",close:"22:00"},
    Sunday:{open:"06:00",close:"22:00"}
  },
  sameHours:true, commonOpen:"06:00", commonClose:"22:00",
  dayPass:"", monthly:"", quarterly:"",
  gymPhotos:[],
};

// Minimal time display helper
const fmtTime = (val) => {
  const found = HOURS.find(h => h.value === val);
  return found ? found.label : val;
};

/* ── Leaflet Map Component ── */
function LeafletMap({ lat, lng, onLocationChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [outsideWarning, setOutsideWarning] = useState(false);

  const loadLeaflet = () => new Promise((resolve) => {
    if (window.L) { resolve(window.L); return; }
    if (!document.querySelector('link[href*="leaflet.min.css"]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(css);
    }
    const existing = document.querySelector('script[src*="leaflet.min.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });

  const makeIcon = (L) => L.divIcon({
    className: '',
    html: `<div style="position:relative;width:32px;height:42px;">
      <div style="width:32px;height:32px;background:#d23f0b;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 14px rgba(210,63,11,0.45);"></div>
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:8px;height:8px;background:#d23f0b;border-radius:50%;opacity:0.3;"></div>
    </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });

  const handlePin = (newLat, newLng, L, map) => {
    const inside = pointInPolygon(newLat, newLng, PASIG_POLYGON_LATLNG);
    if (!inside) {
      setOutsideWarning(true);
      setTimeout(() => setOutsideWarning(false), 2500);
      // Snap marker back
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      return;
    }
    setOutsideWarning(false);
    if (markerRef.current) markerRef.current.setLatLng([newLat, newLng]);
    onLocationChange(newLat, newLng);
  };

  useEffect(() => {
    loadLeaflet().then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: PASIG_CENTER,
        zoom: 14,
        minZoom: 12,
        maxZoom: 18,
        maxBounds: [[14.50, 121.02], [14.64, 121.15]],
        maxBoundsViscosity: 0.9,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Draw Pasig polygon border (red)
      const polygonLatLngs = PASIG_POLYGON_LATLNG.map(([la, ln]) => [la, ln]);
      L.polygon(polygonLatLngs, {
        color: '#d23f0b',
        weight: 2.5,
        opacity: 0.85,
        fillColor: '#d23f0b',
        fillOpacity: 0.06,
        dashArray: null,
      }).addTo(map);

      // Initial marker
      const marker = L.marker(PASIG_CENTER, {
        icon: makeIcon(L),
        draggable: true,
        autoPan: true,
      }).addTo(map);
      markerRef.current = marker;

      // Click on map to pin
      map.on('click', (e) => {
        handlePin(e.latlng.lat, e.latlng.lng, L, map);
      });

      // Drag end
      marker.on('dragend', (e) => {
        const { lat: la, lng: ln } = e.target.getLatLng();
        handlePin(la, ln, L, map);
      });

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // eslint-disable-line

  // Sync marker position when parent state changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '360px', borderRadius: '14px', overflow: 'hidden', zIndex: 1 }} />
      {outsideWarning && (
        <div className="oa-map-warning">
          ⚠️ Please pin inside Pasig City only
        </div>
      )}
    </div>
  );
}

/* ── Stylish Time Picker ── */
function TimePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const display = fmtTime(value);

  return (
    <div className="tp-wrapper" ref={ref}>
      <button type="button" className="tp-trigger" onClick={() => setOpen(o => !o)}>
        <span className="tp-clock">⏱</span>
        <span className="tp-val">{display}</span>
        <span className={`tp-arrow ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="tp-dropdown">
          {HOURS.map(h => (
            <button key={h.value} type="button"
              className={`tp-option ${h.value === value ? 'selected' : ''}`}
              onClick={() => { onChange(h.value); setOpen(false); }}>
              {h.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OwnerApplication() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const regRef = useRef();
  const photoRef = useRef();

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: "" }));
  };

  const toggleAmenity = (a) => {
    const list = form.amenities.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...form.amenities, a];
    set("amenities", list);
  };

  const setHourDay = (day, type, val) => {
    setForm(f => ({ ...f, hours: { ...f.hours, [day]: { ...f.hours[day], [type]: val } } }));
  };

  const handleSameHours = (checked) => {
    if (checked) {
      const filled = {};
      DAYS.forEach(d => filled[d] = { open: form.commonOpen, close: form.commonClose });
      setForm(f => ({ ...f, hours: filled, sameHours: true }));
    } else {
      set("sameHours", false);
    }
  };

  const handleCommonHours = (type, val) => {
    const key = type === 'open' ? 'commonOpen' : 'commonClose';
    const filled = {};
    DAYS.forEach(d => filled[d] = {
      open: type === 'open' ? val : form.commonOpen,
      close: type === 'close' ? val : form.commonClose
    });
    setForm(f => ({ ...f, hours: filled, [key]: val }));
  };

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.fullName.trim()) e.fullName = "Required";
      if (!form.email.trim()) e.email = "Required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
      if (!form.contactNumber.trim()) e.contactNumber = "Required";
      if (!form.businessName.trim()) e.businessName = "Required";
    }
    if (step === 1) {
      if (!form.gymName.trim()) e.gymName = "Required";
      if (!form.description.trim()) e.description = "Required";
    }
    if (step === 2) {
      if (!form.address.trim()) e.address = "Required";
      if (!form.city.trim()) e.city = "Required";
    }
    if (step === 3) {
      if (!form.businessReg) e.businessReg = "Upload required";
      if (form.gymPhotos.length < 2) e.gymPhotos = "Minimum 2 photos required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);
  const goTo = (i) => { if (i < step) setStep(i); };

  const handleRegUpload = (e) => { const f = e.target.files[0]; if (f) set("businessReg", f); };
  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    const merged = [...form.gymPhotos, ...files].slice(0, 8);
    set("gymPhotos", merged);
  };
  const removePhoto = (i) => set("gymPhotos", form.gymPhotos.filter((_, idx) => idx !== i));
  const photoURLs = form.gymPhotos.map(f => URL.createObjectURL(f));

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;

  /* ── SUCCESS ── */
  if (submitted) return (
    <div className="oa-app">
      <HeaderUser />
      <div className="oa-success">
        <div className="oa-success-card">
          <div className="oa-success-icon"><FaCheckCircle /></div>
          <h1>Application Submitted!</h1>
          <p>Thank you, <strong>{form.fullName}</strong>. We'll review your application within 1–3 business days.</p>
          <div className="oa-summary">
            {[["Owner", form.fullName],["Business", form.businessName],["Gym", form.gymName],["City", form.city]].map(([k,v]) => (
              <div key={k} className="oa-summary-row">
                <span>{k}</span><strong>{v}</strong>
              </div>
            ))}
            <div className="oa-summary-row"><span>Status</span><span className="oa-badge">⏳ Pending</span></div>
          </div>
          <Link to="/home" className="oa-btn-primary">Back to Home <FaArrowRight /></Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  /* ── MAIN FORM ── */
  return (
    <div className="oa-app">
      <HeaderUser />

      {/* Top Stepper */}
      <div className="oa-stepper-bar">
        <div className="oa-stepper">
          {STEPS.map((s, i) => {
            const SIcon = s.icon;
            return (
              <React.Fragment key={i}>
                <div className={`oa-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                  onClick={() => goTo(i)} style={{ cursor: i < step ? 'pointer' : 'default' }}>
                  <div className="oa-step-bubble">
                    {i < step ? <FaCheck size={11} /> : <SIcon size={13} />}
                  </div>
                  <span>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`oa-step-line ${i < step ? 'done' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Layout */}
      <div className="oa-layout">

        {/* Sidebar */}
        <aside className="oa-sidebar">
          <div className="oa-sidebar-inner">
            <div className="oa-sidebar-icon"><StepIcon /></div>
            <h2>{currentStep.label}</h2>
            <p>
              {step === 0 && "Tell us about yourself — the gym owner behind the brand."}
              {step === 1 && "What makes your gym stand out? Share every detail."}
              {step === 2 && "Drop a pin on your exact location in Pasig City."}
              {step === 3 && "Upload your business docs and showcase your gym."}
              {step === 4 && "Almost there! Review everything before we send it."}
            </p>
            <div className="oa-sidebar-progress">
              <div className="oa-sidebar-progress-track">
                <div className="oa-sidebar-progress-fill" style={{ height: `${(step / (STEPS.length - 1)) * 100}%` }} />
              </div>
              <div className="oa-sidebar-progress-labels">
                {STEPS.map((s, i) => (
                  <span key={i} className={i <= step ? 'done' : ''}>{s.label}</span>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Form */}
        <main className="oa-main">
          <div className="oa-card" key={step}>

            {/* ── STEP 0: Owner Info ── */}
            {step === 0 && (
              <div className="oa-fields">
                <div className="oa-grid-2">
                  <div className={`oa-field ${errors.fullName ? 'has-error' : ''}`}>
                    <label>Full Name <span className="req">*</span></label>
                    <input type="text" placeholder="Juan Dela Cruz"
                      value={form.fullName} onChange={e => set("fullName", e.target.value)} />
                    {errors.fullName && <p className="oa-err-msg">{errors.fullName}</p>}
                  </div>
                  <div className={`oa-field ${errors.contactNumber ? 'has-error' : ''}`}>
                    <label>Contact Number <span className="req">*</span></label>
                    <input type="text" placeholder="09171234567"
                      value={form.contactNumber} onChange={e => set("contactNumber", e.target.value)} />
                    {errors.contactNumber && <p className="oa-err-msg">{errors.contactNumber}</p>}
                  </div>
                </div>
                <div className={`oa-field ${errors.email ? 'has-error' : ''}`}>
                  <label>Email Address <span className="req">*</span></label>
                  <input type="email" placeholder="juan@email.com"
                    value={form.email} onChange={e => set("email", e.target.value)} />
                  {errors.email && <p className="oa-err-msg">{errors.email}</p>}
                </div>
                <div className={`oa-field ${errors.businessName ? 'has-error' : ''}`}>
                  <label>Business Name <span className="req">*</span></label>
                  <input type="text" placeholder="IronForge Fitness Inc."
                    value={form.businessName} onChange={e => set("businessName", e.target.value)} />
                  {errors.businessName && <p className="oa-err-msg">{errors.businessName}</p>}
                </div>
              </div>
            )}

            {/* ── STEP 1: Gym Details ── */}
            {step === 1 && (
              <div className="oa-fields">
                <div className={`oa-field ${errors.gymName ? 'has-error' : ''}`}>
                  <label>Gym Name <span className="req">*</span></label>
                  <input type="text" placeholder="IronForge Gym"
                    value={form.gymName} onChange={e => set("gymName", e.target.value)} />
                  {errors.gymName && <p className="oa-err-msg">{errors.gymName}</p>}
                </div>
                <div className={`oa-field ${errors.description ? 'has-error' : ''}`}>
                  <label>Description <span className="req">*</span></label>
                  <textarea placeholder="Describe your gym — equipment, vibe, community..." rows={4}
                    value={form.description} onChange={e => set("description", e.target.value)} />
                  {errors.description && <p className="oa-err-msg">{errors.description}</p>}
                </div>

                <div className="oa-field">
                  <label>Amenities <span className="label-hint">Select all that apply</span></label>
                  <div className="oa-amenity-grid">
                    {AMENITIES.map(a => (
                      <button key={a} type="button"
                        className={`oa-amenity-btn ${form.amenities.includes(a) ? 'on' : ''}`}
                        onClick={() => toggleAmenity(a)}>
                        {form.amenities.includes(a) && <FaCheck size={9} />}
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="oa-field">
                  <label>Pricing <span className="label-hint">in Philippine Peso (₱)</span></label>
                  <div className="oa-pricing-row">
                    {[["dayPass","Day Pass"],["monthly","Monthly"],["quarterly","Quarterly"]].map(([k,l]) => (
                      <div key={k} className="oa-price-card">
                        <span>{l}</span>
                        <div className="oa-price-input">
                          <span className="peso">₱</span>
                          <input type="number" placeholder="0" min="0"
                            value={form[k]} onChange={e => set(k, e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="oa-field">
                  <label>Operating Hours</label>
                  <div className="oa-hours-section">
                    <label className="oa-toggle-label">
                      <div className={`oa-toggle-switch ${form.sameHours ? 'on' : ''}`}
                        onClick={() => handleSameHours(!form.sameHours)}>
                        <div className="oa-toggle-knob" />
                      </div>
                      <span>Same hours every day</span>
                    </label>

                    {form.sameHours ? (
                      <div className="oa-time-single">
                        <TimePicker value={form.commonOpen} onChange={v => handleCommonHours('open', v)} label="Opens" />
                        <div className="oa-time-dash">—</div>
                        <TimePicker value={form.commonClose} onChange={v => handleCommonHours('close', v)} label="Closes" />
                      </div>
                    ) : (
                      <div className="oa-time-grid">
                        {DAYS.map(d => (
                          <div className="oa-day-row" key={d}>
                            <span className="oa-day-label">{d.slice(0,3).toUpperCase()}</span>
                            <TimePicker value={form.hours[d].open} onChange={v => setHourDay(d,'open',v)} />
                            <div className="oa-time-dash">—</div>
                            <TimePicker value={form.hours[d].close} onChange={v => setHourDay(d,'close',v)} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Location ── */}
            {step === 2 && (
              <>
                <div className="oa-fields">
                  <div className={`oa-field ${errors.address ? 'has-error' : ''}`}>
                    <label>Street Address <span className="req">*</span></label>
                    <input type="text" placeholder="123 Kapitolyo St."
                      value={form.address} onChange={e => set("address", e.target.value)} />
                    {errors.address && <p className="oa-err-msg">{errors.address}</p>}
                  </div>
                  <div className="oa-grid-2">
                    <div className={`oa-field ${errors.city ? 'has-error' : ''}`}>
                      <label>City <span className="req">*</span></label>
                      <input type="text" placeholder="Pasig City"
                        value={form.city} onChange={e => set("city", e.target.value)} />
                      {errors.city && <p className="oa-err-msg">{errors.city}</p>}
                    </div>
                    <div className="oa-field">
                      <label>Landmark</label>
                      <input type="text" placeholder="Near SM Pasig"
                        value={form.landmark} onChange={e => set("landmark", e.target.value)} />
                    </div>
                  </div>
                  <div className="oa-field">
                    <label>
                      Pin Location
                      <span className="label-hint">Click anywhere inside the red border (Pasig City only)</span>
                    </label>
                    <div className="oa-map-wrapper">
                      <LeafletMap
                        lat={form.lat}
                        lng={form.lng}
                        onLocationChange={(newLat, newLng) => {
                          setForm(f => ({ ...f, lat: newLat, lng: newLng }));
                          // Reverse geocode using Nominatim to fill address fields
                          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&addressdetails=1`)
                            .then(r => r.json())
                            .then(data => {
                              const addr = data.address || {};
                              const road = addr.road || addr.pedestrian || addr.path || '';
                              const houseNum = addr.house_number || '';
                              const suburb = addr.suburb || addr.village || addr.neighbourhood || '';
                              const city = addr.city || addr.town || addr.municipality || 'Pasig City';
                              const street = [houseNum, road, suburb].filter(Boolean).join(' ');
                              setForm(f => ({
                                ...f,
                                lat: newLat,
                                lng: newLng,
                                address: street || f.address,
                                city: city,
                              }));
                              setErrors(e => ({ ...e, address: '', city: '' }));
                            })
                            .catch(() => {
                              // Silently fail — user can still type manually
                              setForm(f => ({ ...f, lat: newLat, lng: newLng }));
                            });
                        }}
                      />
                      <div className="oa-coords-badge">
                        📍 {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                      </div>
                    </div>
                    <p className="oa-map-hint">💡 Dropping the pin will auto-fill your address. You can still edit it manually.</p>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 3: Docs & Photos ── */}
            {step === 3 && (
              <div className="oa-fields">
                <div className={`oa-field ${errors.businessReg ? 'has-error' : ''}`}>
                  <label>Business Registration <span className="req">*</span></label>
                  <input ref={regRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={handleRegUpload} />
                  {!form.businessReg ? (
                    <div className="oa-dropzone" onClick={() => regRef.current.click()}>
                      <div className="oa-dropzone-icon"><FaUpload /></div>
                      <p>Click to upload <strong>PDF, JPG, or PNG</strong></p>
                      <span>Business permit, DTI/SEC registration</span>
                    </div>
                  ) : (
                    <div className="oa-file-chip">
                      <FaFileAlt />
                      <span>{form.businessReg.name}</span>
                      <button type="button" onClick={() => set("businessReg", null)}><FaTimes /></button>
                    </div>
                  )}
                  {errors.businessReg && <p className="oa-err-msg">{errors.businessReg}</p>}
                </div>

                <div className={`oa-field ${errors.gymPhotos ? 'has-error' : ''}`}>
                  <label>Gym Photos <span className="req">*</span>
                    <span className="label-hint">{form.gymPhotos.length}/8 — min. 2</span>
                  </label>
                  <input ref={photoRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handlePhotos} />
                  <div className="oa-photo-grid">
                    {photoURLs.map((url, i) => (
                      <div key={i} className="oa-photo-tile">
                        <img src={url} alt="" />
                        <button type="button" className="oa-photo-remove" onClick={() => removePhoto(i)}>
                          <FaTimes size={9} />
                        </button>
                      </div>
                    ))}
                    {form.gymPhotos.length < 8 && (
                      <button type="button" className="oa-photo-add" onClick={() => photoRef.current.click()}>
                        <FaCamera />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                  {errors.gymPhotos && <p className="oa-err-msg">{errors.gymPhotos}</p>}
                </div>
              </div>
            )}

            {/* ── STEP 4: Review ── */}
            {step === 4 && (
              <div className="oa-review">
                {[
                  {
                    icon: <FaUser />, title: "Owner Info", editStep: 0,
                    rows: [["Name", form.fullName], ["Email", form.email], ["Contact", form.contactNumber], ["Business", form.businessName]]
                  },
                  {
                    icon: <FaDumbbell />, title: "Gym Details", editStep: 1,
                    rows: [["Gym Name", form.gymName], ["Description", form.description], ["Amenities", form.amenities.join(', ') || 'None']]
                  },
                  {
                    icon: <FaMapMarkerAlt />, title: "Location", editStep: 2,
                    rows: [["Address", `${form.address}, ${form.city}`], ["Landmark", form.landmark || '—'], ["Coordinates", `${form.lat.toFixed(4)}, ${form.lng.toFixed(4)}`]]
                  },
                  {
                    icon: <FaCamera />, title: "Files", editStep: 3,
                    rows: [["Document", form.businessReg?.name || '—'], ["Photos", `${form.gymPhotos.length} uploaded`]]
                  }
                ].map(({ icon, title, editStep, rows }) => (
                  <div key={title} className="oa-review-card">
                    <div className="oa-review-header">
                      <div className="oa-review-title">{icon} {title}</div>
                      <button type="button" className="oa-review-edit" onClick={() => setStep(editStep)}>Edit</button>
                    </div>
                    <div className="oa-review-rows">
                      {rows.map(([k, v]) => (
                        <div key={k} className="oa-review-row">
                          <span>{k}</span>
                          <strong>{v}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="oa-confirm-banner">
                  <FaCheckCircle />
                  <p>By submitting, you confirm that all information provided is accurate and complete.</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="oa-nav">
              {step > 0 ? (
                <button className="oa-btn-back" type="button" onClick={back}>
                  <FaArrowLeft size={12} /> Back
                </button>
              ) : (
                <Link to="/become-an-owner" className="oa-btn-back">
                  <FaArrowLeft size={12} /> Cancel
                </Link>
              )}
              {step < STEPS.length - 1 ? (
                <button className="oa-btn-next" type="button" onClick={next}>
                  Continue <FaArrowRight size={12} />
                </button>
              ) : (
                <button className="oa-btn-submit" type="button" onClick={() => setSubmitted(true)}>
                  Submit Application <FaCheck size={12} />
                </button>
              )}
            </div>

          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}