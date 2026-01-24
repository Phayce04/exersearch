import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Polygon } from "react-leaflet";
import L from "leaflet";

// ✅ Fix marker icons (bundler-safe)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ===============================
// 📍 PASIG CONFIG
// ===============================
const PASIG_BOUNDS = L.latLngBounds(
  L.latLng(14.525, 121.040), // SW
  L.latLng(14.625, 121.125)  // NE
);

const PASIG_CENTER = [14.5764, 121.0851];

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clampToBounds(lat, lng, bounds) {
  const south = bounds.getSouth();
  const north = bounds.getNorth();
  const west = bounds.getWest();
  const east = bounds.getEast();
  return {
    lat: Math.min(Math.max(lat, south), north),
    lng: Math.min(Math.max(lng, west), east),
  };
}

function isInsidePasig(lat, lng) {
  return PASIG_BOUNDS.contains(L.latLng(lat, lng));
}

// ===============================
// Click handler (clamped to Pasig)
// ===============================
function ClickToPick({ onPick }) {
  useMapEvents({
    click(e) {
      const ll = e.latlng;
      const clamped = clampToBounds(ll.lat, ll.lng, PASIG_BOUNDS);
      onPick({ lat: clamped.lat, lng: clamped.lng });
    },
  });
  return null;
}

// ===============================
// Map helper: fly to point
// ===============================
function FlyTo({ lat, lng, zoom = 17 }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null) return;
    map.flyTo([lat, lng], zoom, { duration: 0.7 });
  }, [lat, lng, zoom, map]);
  return null;
}

/**
 * ✅ Nominatim search (OSM)
 * - bounded to Pasig-ish area
 * - filtered to bounds
 */
async function nominatimSearch(query) {
  const q = String(query || "").trim();
  if (!q) return [];

  const left = PASIG_BOUNDS.getWest();
  const right = PASIG_BOUNDS.getEast();
  const top = PASIG_BOUNDS.getNorth();
  const bottom = PASIG_BOUNDS.getSouth();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("bounded", "1");
  url.searchParams.set("viewbox", `${left},${top},${right},${bottom}`);

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();

  return (Array.isArray(data) ? data : [])
    .map((r) => ({
      place_id: r.place_id,
      display_name: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
    .filter((r) => isInsidePasig(r.lat, r.lng));
}

/**
 * ✅ Reverse geocode
 * - given lat/lng -> returns display_name (address string)
 */
async function nominatimReverse(lat, lng, signal) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, signal });
  if (!res.ok) return "";
  const data = await res.json();

  // Prefer display_name
  return String(data?.display_name || "").trim();
}

export default function MapPickerModal({
  open,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
}) {
  const [pending, setPending] = useState(null);
  const [pendingAddress, setPendingAddress] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // search state
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);

  // where to fly
  const [fly, setFly] = useState(null);

  // reverse geocode abort
  const reverseAbortRef = useRef(null);

  // Default center: existing coords OR Pasig center
  const center = useMemo(() => {
    const lat = toNum(initialLat);
    const lng = toNum(initialLng);
    if (lat !== null && lng !== null) {
      const clamped = clampToBounds(lat, lng, PASIG_BOUNDS);
      return [clamped.lat, clamped.lng];
    }
    return PASIG_CENTER;
  }, [initialLat, initialLng]);

  // Reset modal-only states when opening
  useEffect(() => {
    if (!open) return;
    setPending(null);
    setPendingAddress("");
    setConfirmOpen(false);
    setFly(null);
    setSearch("");
    setResults([]);
    setSearchErr("");
    setSearching(false);
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Debounced search
  useEffect(() => {
    if (!open) return;

    setSearchErr("");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = String(search || "").trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchErr("");
      try {
        const list = await nominatimSearch(q);
        setResults(list);
        if (!list.length) setSearchErr("No results in Pasig. Try a more specific place name.");
      } catch {
        setSearchErr("Search failed. Try again.");
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, open]);

  // ✅ on map pick: reverse-geocode to get address
  const handlePick = async ({ lat, lng }) => {
    setPending({ lat, lng });
    setPendingAddress("Resolving address…");
    setConfirmOpen(true);

    // cancel previous reverse
    if (reverseAbortRef.current) reverseAbortRef.current.abort();
    const ac = new AbortController();
    reverseAbortRef.current = ac;

    try {
      const addr = await nominatimReverse(lat, lng, ac.signal);
      setPendingAddress(addr || "Unknown address (still OK)");
    } catch {
      setPendingAddress("Unknown address (still OK)");
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="ae-backdrop ae-backdropTop"
        onClick={onClose}
        style={{ overflow: "auto", padding: "24px 12px" }}
      >
        {/* Modal */}
        <div
          className="ae-formModal"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(980px, 96vw)",
            maxHeight: "calc(100vh - 64px)",
            overflow: "hidden",
          }}
        >
          <div className="ae-modalTopRow">
            <div className="ae-modalTitle">Pick location (Pasig only)</div>
            <button className="ae-btn ae-btnSecondary" onClick={onClose}>
              Close
            </button>
          </div>

          {/* ✅ Search UI */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <input
              className="ae-fieldInput"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search in Pasig (e.g. "Capitol Commons", "The 30th")'
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="ae-btn ae-btnSecondary"
              onClick={() => {
                setSearch("");
                setResults([]);
                setSearchErr("");
              }}
            >
              Clear
            </button>
          </div>

          {searching ? (
            <div className="ae-mutedTiny" style={{ marginBottom: 10 }}>
              Searching…
            </div>
          ) : searchErr ? (
            <div className="ae-mutedTiny" style={{ marginBottom: 10 }}>
              {searchErr}
            </div>
          ) : results.length ? (
            <div
              style={{
                display: "grid",
                gap: 8,
                marginBottom: 10,
                maxHeight: 160,
                overflow: "auto",
                paddingRight: 6,
              }}
            >
              {results.map((r) => (
                <button
                  key={r.place_id}
                  type="button"
                  className="ae-btn ae-btnSecondary"
                  style={{
                    textAlign: "left",
                    justifyContent: "flex-start",
                    whiteSpace: "normal",
                    lineHeight: 1.2,
                    padding: "10px 12px",
                  }}
                  onClick={() => {
                    setFly({ lat: r.lat, lng: r.lng });
                    setPending({ lat: r.lat, lng: r.lng });
                    setPendingAddress(r.display_name || "");
                    setConfirmOpen(true);
                  }}
                >
                  <span style={{ fontSize: 13 }}>{r.display_name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="ae-mutedTiny" style={{ marginBottom: 10 }}>
              Tip: Search a landmark/mall/street/barangay then click it. Or click directly on the map.
            </div>
          )}

          <div
            style={{
              height: "58vh",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid var(--border)",
            }}
          >
            <MapContainer
              center={center}
              zoom={15}
              minZoom={14}
              maxZoom={18}
              maxBounds={PASIG_BOUNDS}
              maxBoundsViscosity={1.0}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Darken outside Pasig */}
              {(() => {
                const b = PASIG_BOUNDS;
                const outer = [
                  [90, -180],
                  [90, 180],
                  [-90, 180],
                  [-90, -180],
                ];
                const inner = [
                  [b.getSouth(), b.getWest()],
                  [b.getSouth(), b.getEast()],
                  [b.getNorth(), b.getEast()],
                  [b.getNorth(), b.getWest()],
                ];
                return <Polygon positions={[outer, inner]} pathOptions={{ fillOpacity: 0.35, weight: 0 }} />;
              })()}

              <ClickToPick onPick={handlePick} />

              {/* Fly on search select */}
              {fly ? <FlyTo lat={fly.lat} lng={fly.lng} zoom={17} /> : null}

              {/* Existing marker */}
              {toNum(initialLat) !== null && toNum(initialLng) !== null ? (
                (() => {
                  const clamped = clampToBounds(Number(initialLat), Number(initialLng), PASIG_BOUNDS);
                  return <Marker position={[clamped.lat, clamped.lng]} />;
                })()
              ) : null}

              {/* Pending marker */}
              {pending ? <Marker position={[pending.lat, pending.lng]} /> : null}
            </MapContainer>
          </div>

          <div className="ae-mutedTiny" style={{ marginTop: 10 }}>
            Current selection:{" "}
            <b className="ae-strongText">
              {pending ? `${pending.lat.toFixed(6)}, ${pending.lng.toFixed(6)}` : "—"}
            </b>
            {pendingAddress ? (
              <>
                {" "}
                • <span style={{ opacity: 0.9 }}>{pendingAddress}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Confirm overlay */}
      {confirmOpen && pending && (
        <div className="ae-backdrop ae-backdropTop" onClick={() => setConfirmOpen(false)}>
          <div className="ae-confirmModalFancy" onClick={(e) => e.stopPropagation()}>
            <div className="ae-confirmHeader">
              <div className="ae-confirmIconWrap" aria-hidden="true">
                📍
              </div>

              <div className="ae-confirmHeaderText">
                <div className="ae-confirmTitle">Use this location?</div>
                <div className="ae-mutedTiny">
                  <b className="ae-strongText">{pending.lat.toFixed(6)}</b>,{" "}
                  <b className="ae-strongText">{pending.lng.toFixed(6)}</b>
                </div>
                {pendingAddress ? (
                  <div className="ae-mutedTiny" style={{ marginTop: 6, opacity: 0.95 }}>
                    {pendingAddress}
                  </div>
                ) : null}
              </div>

              <button className="ae-modalClose" onClick={() => setConfirmOpen(false)}>
                ✕
              </button>
            </div>

            <div className="ae-confirmActions">
              <button className="ae-btn ae-btnSecondary" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>

              <button
                className="ae-btn ae-btnPrimary"
                onClick={() => {
                  const payload = {
                    latitude: pending.lat.toFixed(6),
                    longitude: pending.lng.toFixed(6),
                    address: String(pendingAddress || ""), // ✅ now always included
                  };

                  // close UI first
                  setConfirmOpen(false);
                  setPending(null);
                  setPendingAddress("");
                  setFly(null);
                  onClose?.();

                  // apply
                  onConfirm?.(payload);
                }}
              >
                Yes, apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
