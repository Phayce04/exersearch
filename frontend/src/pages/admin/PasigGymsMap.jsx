// src/pages/admin/AdminPasigGymsMap.jsx
import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAIN = "#d23f0b";
const MATCH_GREEN = "#22c55e";
const DB_ONLY_ORANGE = "#ff9f1a";
const APP_BLUE = "#3b82f6"; // owner applications
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// Matching tolerance
const MATCH_RADIUS_METERS = 180; // allow some errors
const NAME_SIM_THRESHOLD = 0.35; // loose

async function fetchPasigBoundaryGeoJSON() {
  const q = encodeURIComponent("Pasig City, National Capital Region, Philippines");
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${q}&format=geojson&polygon_geojson=1&limit=1`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Failed to fetch Pasig boundary.");
  const geo = await res.json();
  if (!geo?.features?.length) throw new Error("No boundary found.");
  return geo.features[0];
}

function flattenCoords(geometry) {
  const out = [];
  if (!geometry) return out;

  const { type, coordinates } = geometry;
  if (type === "Polygon") {
    for (const ring of coordinates) for (const pt of ring) out.push(pt);
  } else if (type === "MultiPolygon") {
    for (const poly of coordinates)
      for (const ring of poly)
        for (const pt of ring) out.push(pt);
  }
  return out;
}

function getBboxFromFeature(feature) {
  if (Array.isArray(feature?.bbox) && feature.bbox.length === 4) {
    const [west, south, east, north] = feature.bbox;
    return { west, south, east, north };
  }

  const coords = flattenCoords(feature.geometry);
  let west = Infinity,
    south = Infinity,
    east = -Infinity,
    north = -Infinity;

  for (const [lng, lat] of coords) {
    if (lng < west) west = lng;
    if (lat < south) south = lat;
    if (lng > east) east = lng;
    if (lat > north) north = lat;
  }

  return { west, south, east, north };
}

function buildOutsideMaskFeature(pasigFeature) {
  const worldRing = [
    [-180, -90],
    [180, -90],
    [180, 90],
    [-180, 90],
    [-180, -90],
  ];

  const geom = pasigFeature.geometry;
  const holes =
    geom.type === "Polygon"
      ? [geom.coordinates[0]]
      : geom.type === "MultiPolygon"
      ? geom.coordinates.map((p) => p[0])
      : [];

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [worldRing, ...holes],
    },
  };
}

function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0],
      yi = ring[i][1];
    const xj = ring[j][0],
      yj = ring[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

function pointInPolygon(point, geometry) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") {
    return pointInRing(point, geometry.coordinates[0]);
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((p) => pointInRing(point, p[0]));
  }
  return false;
}

async function fetchGymsOverpass({ south, west, north, east }) {
  const query = `
[out:json][timeout:25];
(
  node["leisure"="fitness_centre"](${south},${west},${north},${east});
  way["leisure"="fitness_centre"](${south},${west},${north},${east});
  relation["leisure"="fitness_centre"](${south},${west},${north},${east});

  node["amenity"="fitness_centre"](${south},${west},${north},${east});
  way["amenity"="fitness_centre"](${south},${west},${north},${east});
  relation["amenity"="fitness_centre"](${south},${west},${north},${east});

  node["amenity"="gym"](${south},${west},${north},${east});
  way["amenity"="gym"](${south},${west},${north},${east});
  relation["amenity"="gym"](${south},${west},${north},${east});
);
out center tags;
`.trim();

  console.log("[OSM] Overpass bbox:", { south, west, north, east });

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: query,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  console.log("[OSM] Overpass response:", {
    status: res.status,
    ok: res.ok,
    elements: data?.elements?.length ?? null,
    sample: data?.elements?.[0] ?? null,
  });

  if (!res.ok) throw new Error("Failed to fetch gyms from Overpass.");

  const features = (data.elements || [])
    .map((el) => {
      const lng = el.type === "node" ? el.lon : el.center?.lon;
      const lat = el.type === "node" ? el.lat : el.center?.lat;
      if (typeof lng !== "number" || typeof lat !== "number") return null;

      return {
        type: "Feature",
        properties: {
          osm_id: `${el.type}/${el.id}`,
          name: el.tags?.name || "Fitness Center",
          ...el.tags,
        },
        geometry: { type: "Point", coordinates: [lng, lat] },
      };
    })
    .filter(Boolean);

  console.log("[OSM] Parsed OSM features:", features.length);
  return { type: "FeatureCollection", features };
}

// DB gyms
async function fetchDbGymsInBbox(bbox) {
  const params = new URLSearchParams({
    south: String(bbox.south),
    west: String(bbox.west),
    north: String(bbox.north),
    east: String(bbox.east),
  });

  const url = `/api/v1/gyms/map?${params.toString()}`;
  console.log("[DB] Requesting:", url);

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  console.log("[DB] Response:", { status: res.status, ok: res.ok, body: json ?? text });

  if (!res.ok) {
    const msg =
      (json && (json.message || json.error)) || `Failed to fetch DB gyms (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const rows = json?.data || json?.rows || (Array.isArray(json) ? json : []);
  console.log("[DB] Raw rows count:", Array.isArray(rows) ? rows.length : "not-array");

  const features = (Array.isArray(rows) ? rows : [])
    .map((g) => {
      const lngRaw = g.longitude ?? g.lng ?? g.long;
      const latRaw = g.latitude ?? g.lat;

      const lng = parseFloat(lngRaw);
      const lat = parseFloat(latRaw);

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        console.log("[DB] Skipping row (bad coords):", {
          gym_id: g.gym_id ?? g.id,
          name: g.name,
          latitude: g.latitude,
          longitude: g.longitude,
          latRaw,
          lngRaw,
        });
        return null;
      }

      return {
        type: "Feature",
        properties: {
          gym_id: g.gym_id ?? g.id,
          name: g.name || "Gym",
          address: g.address || "",
        },
        geometry: { type: "Point", coordinates: [lng, lat] },
      };
    })
    .filter(Boolean);

  console.log("[DB] Parsed DB features:", features.length);
  return { type: "FeatureCollection", features };
}

// Owner applications (admin)
async function fetchOwnerAppsInBbox(bbox) {
  const params = new URLSearchParams({
    south: String(bbox.south),
    west: String(bbox.west),
    north: String(bbox.north),
    east: String(bbox.east),
  });

  const url = `/api/v1/owner-applications/map?${params.toString()}`;
  console.log("[APPS] Requesting:", url);

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  console.log("[APPS] Response:", { status: res.status, ok: res.ok, body: json ?? text });

  if (!res.ok) {
    const msg =
      (json && (json.message || json.error)) ||
      `Failed to fetch owner applications (HTTP ${res.status})`;
    throw new Error(msg);
  }

  const rows = json?.data || (Array.isArray(json) ? json : []);
  console.log("[APPS] Raw rows count:", Array.isArray(rows) ? rows.length : "not-array");

  const features = (Array.isArray(rows) ? rows : [])
    .map((a) => {
      const lng = parseFloat(a.longitude);
      const lat = parseFloat(a.latitude);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        console.log("[APPS] Skipping row (bad coords):", {
          id: a.id,
          gym_name: a.gym_name,
          latitude: a.latitude,
          longitude: a.longitude,
        });
        return null;
      }

      return {
        type: "Feature",
        properties: {
          app_id: a.id,
          user_id: a.user_id,
          gym_name: a.gym_name || "Gym Application",
          address: a.address || "",
          status: a.status || "pending",
          created_at: a.created_at || null,
        },
        geometry: { type: "Point", coordinates: [lng, lat] },
      };
    })
    .filter(Boolean);

  console.log("[APPS] Parsed features:", features.length);
  return { type: "FeatureCollection", features };
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Matching helpers
function toRad(d) {
  return (d * Math.PI) / 180;
}

function haversineMeters([lng1, lat1], [lng2, lat2]) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(gym|fitness|center|centre|inc|ltd|corp|co|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(s) {
  const n = normName(s);
  if (!n) return new Set();
  return new Set(n.split(" ").filter(Boolean));
}

function nameSimilarity(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

function matchOsmToDb(osmFC, dbFC) {
  const db = dbFC.features || [];
  const usedDbIds = new Set();

  console.log("[MATCH] OSM features:", osmFC.features?.length ?? 0);
  console.log("[MATCH] DB features:", db.length);

  const osmMatched = (osmFC.features || []).map((f) => {
    let best = null;

    for (const d of db) {
      const dbId = d.properties?.gym_id;
      if (usedDbIds.has(dbId)) continue;

      const dist = haversineMeters(f.geometry.coordinates, d.geometry.coordinates);
      if (dist > MATCH_RADIUS_METERS) continue;

      const sim = nameSimilarity(f.properties?.name, d.properties?.name);
      const ok = sim >= NAME_SIM_THRESHOLD || dist <= 70;

      if (!ok) continue;
      if (!best || dist < best.dist) best = { dbId, dist, sim };
    }

    if (best) {
      usedDbIds.add(best.dbId);
      return {
        ...f,
        properties: {
          ...f.properties,
          in_db: true,
          matched_gym_id: best.dbId,
          match_dist_m: Math.round(best.dist),
        },
      };
    }

    return { ...f, properties: { ...f.properties, in_db: false } };
  });

  const dbOnly = db.filter((d) => !usedDbIds.has(d.properties?.gym_id));
  console.log("[MATCH] Matched DB gyms:", usedDbIds.size);
  console.log("[MATCH] DB-only gyms:", dbOnly.length);

  return {
    osm: { type: "FeatureCollection", features: osmMatched },
    dbOnly: { type: "FeatureCollection", features: dbOnly },
    matchedCount: usedDbIds.size,
  };
}

export default function AdminPasigGymsMap() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [status, setStatus] = useState("Loading Pasig boundary…");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const pasigFeature = await fetchPasigBoundaryGeoJSON();
        if (cancelled) return;

        const bbox = getBboxFromFeature(pasigFeature);
        console.log("[INIT] Pasig bbox:", bbox);

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: STYLE_URL,
          bounds: [
            [bbox.west, bbox.south],
            [bbox.east, bbox.north],
          ],
          fitBoundsOptions: { padding: 70, maxZoom: 14 },
        });

        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl(), "top-right");

        map.setMaxBounds([
          [bbox.west, bbox.south],
          [bbox.east, bbox.north],
        ]);

        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();

        map.on("load", async () => {
          if (cancelled) return;

          const mask = buildOutsideMaskFeature(pasigFeature);

          map.addSource("pasig-boundary", { type: "geojson", data: pasigFeature });
          map.addSource("pasig-mask", { type: "geojson", data: mask });

          map.addLayer({
            id: "mask-fill",
            type: "fill",
            source: "pasig-mask",
            paint: { "fill-color": MAIN, "fill-opacity": 0.22 },
          });

          map.addLayer({
            id: "pasig-outline",
            type: "line",
            source: "pasig-boundary",
            paint: { "line-color": MAIN, "line-width": 3 },
          });

          setStatus("Fetching OSM gyms + DB gyms + applications…");

          const [gymsFC, dbFC, appsFC] = await Promise.all([
            fetchGymsOverpass(bbox),
            fetchDbGymsInBbox(bbox),
            fetchOwnerAppsInBbox(bbox),
          ]);
          if (cancelled) return;

          setStatus(
            `Fetched OSM: ${gymsFC.features.length} • DB: ${dbFC.features.length} • Apps: ${appsFC.features.length}`
          );

          const osmInside = {
            type: "FeatureCollection",
            features: gymsFC.features.filter((f) =>
              pointInPolygon(f.geometry.coordinates, pasigFeature.geometry)
            ),
          };

          console.log("[OSM] Inside Pasig:", osmInside.features.length);

          const { osm, dbOnly, matchedCount } = matchOsmToDb(osmInside, dbFC);

          map.addSource("gyms-osm", { type: "geojson", data: osm });
          map.addSource("gyms-db-only", { type: "geojson", data: dbOnly });
          map.addSource("owner-apps", { type: "geojson", data: appsFC });

          // OSM circles (GREEN if matched)
          map.addLayer({
            id: "gyms-osm-circles",
            type: "circle",
            source: "gyms-osm",
            paint: {
              "circle-radius": 7,
              "circle-color": ["case", ["==", ["get", "in_db"], true], MATCH_GREEN, MAIN],
              "circle-opacity": 0.95,
              "circle-stroke-width": 3,
              "circle-stroke-color": "#ffffff",
            },
          });

          // DB-only circles
          map.addLayer({
            id: "gyms-db-only-circles",
            type: "circle",
            source: "gyms-db-only",
            paint: {
              "circle-radius": 7,
              "circle-color": DB_ONLY_ORANGE,
              "circle-opacity": 0.95,
              "circle-stroke-width": 3,
              "circle-stroke-color": "#ffffff",
            },
          });

          // Applications circles
          map.addLayer({
            id: "owner-apps-circles",
            type: "circle",
            source: "owner-apps",
            paint: {
              "circle-radius": 7,
              "circle-color": APP_BLUE,
              "circle-opacity": 0.95,
              "circle-stroke-width": 3,
              "circle-stroke-color": "#ffffff",
            },
          });

          function popupHtml(title, lines = []) {
            const items = lines
              .filter(Boolean)
              .map((l) => `<div style="margin-top:4px;opacity:.9">${escapeHtml(l)}</div>`)
              .join("");
            return `<strong>${escapeHtml(title)}</strong>${items}`;
          }

          map.on("click", "gyms-osm-circles", (e) => {
            const f = e.features?.[0];
            if (!f) return;

            const [lng, lat] = f.geometry.coordinates;
            const name = f.properties?.name || "Fitness Center";
            const inDb = !!f.properties?.in_db;
            const dist = f.properties?.match_dist_m;

            map.easeTo({
              center: [lng, lat],
              zoom: Math.max(map.getZoom(), 16),
              duration: 800,
            });

            new maplibregl.Popup({ closeButton: true })
              .setLngLat([lng, lat])
              .setHTML(
                popupHtml(name, [
                  inDb ? "✅ In database (matched)" : "❌ Not in database",
                  inDb && dist != null ? `Match distance: ${dist}m` : "",
                ])
              )
              .addTo(map);
          });

          map.on("click", "gyms-db-only-circles", (e) => {
            const f = e.features?.[0];
            if (!f) return;

            const [lng, lat] = f.geometry.coordinates;
            const name = f.properties?.name || "Gym";
            const address = f.properties?.address || "";

            map.easeTo({
              center: [lng, lat],
              zoom: Math.max(map.getZoom(), 16),
              duration: 800,
            });

            new maplibregl.Popup({ closeButton: true })
              .setLngLat([lng, lat])
              .setHTML(
                popupHtml(name, [
                  "🟧 In DB but not found/tagged as gym on OSM (or too far to match)",
                  address ? `Address: ${address}` : "",
                ])
              )
              .addTo(map);
          });

          map.on("click", "owner-apps-circles", (e) => {
            const f = e.features?.[0];
            if (!f) return;

            const [lng, lat] = f.geometry.coordinates;
            const gymName = f.properties?.gym_name || "Gym Application";
            const address = f.properties?.address || "";
            const statusVal = f.properties?.status || "pending";
            const appId = f.properties?.app_id;

            map.easeTo({
              center: [lng, lat],
              zoom: Math.max(map.getZoom(), 16),
              duration: 800,
            });

            new maplibregl.Popup({ closeButton: true })
              .setLngLat([lng, lat])
              .setHTML(
                popupHtml(gymName, [
                  `📄 Application #${appId ?? "-"}`,
                  `Status: ${statusVal}`,
                  address ? `Address: ${address}` : "",
                ])
              )
              .addTo(map);
          });

          map.on("mouseenter", "gyms-osm-circles", () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", "gyms-osm-circles", () => (map.getCanvas().style.cursor = ""));
          map.on("mouseenter", "gyms-db-only-circles", () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", "gyms-db-only-circles", () => (map.getCanvas().style.cursor = ""));
          map.on("mouseenter", "owner-apps-circles", () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", "owner-apps-circles", () => (map.getCanvas().style.cursor = ""));

          const allCoords = [
            ...(osm.features || []).map((f) => f.geometry.coordinates),
            ...(dbOnly.features || []).map((f) => f.geometry.coordinates),
            ...(appsFC.features || []).map((f) => f.geometry.coordinates),
          ];

          if (allCoords.length) {
            const b = new maplibregl.LngLatBounds();
            allCoords.forEach((c) => b.extend(c));
            map.fitBounds(b, { padding: 90, maxZoom: 14 });

            setStatus(
              `OSM inside Pasig: ${osmInside.features.length} • Matched: ${matchedCount} • DB-only: ${dbOnly.features.length} • Apps: ${appsFC.features.length}`
            );
          } else {
            setStatus("No gyms found inside Pasig (0).");
          }
        });
      } catch (err) {
        console.error(err);
        setStatus(`Error: ${err.message}`);
      }
    }

    init();
    return () => mapRef.current?.remove();
  }, []);

  const Legend = () => (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: MATCH_GREEN,
            display: "inline-block",
          }}
        />
        <span>OSM gym + in DB (matched)</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: MAIN,
            display: "inline-block",
          }}
        />
        <span>OSM gym (not in DB)</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: DB_ONLY_ORANGE,
            display: "inline-block",
          }}
        />
        <span>DB gym (not tagged/found on OSM)</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: APP_BLUE,
            display: "inline-block",
          }}
        />
        <span>Owner application</span>
      </div>
    </div>
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      <div
        style={{
          position: "absolute",
          left: 12,
          top: 12,
          padding: "10px 12px",
          borderRadius: 12,
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          fontSize: 13,
          maxWidth: 500,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Pasig Gyms Map</div>
        <div style={{ opacity: 0.9, marginBottom: 10 }}>{status}</div>
        <Legend />

      </div>
    </div>
  );
}
