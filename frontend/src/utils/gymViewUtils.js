const API_BASE = "https://exersearch.test";

export function absUrl(u) {
  if (!u) return null;
  const s = String(u).trim();
  if (!s) return null;

  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
}

export function parseGalleryUrls(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;

  const s = String(v).trim();
  if (!s) return [];

  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [s];
}

export function toTimeLabel(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  const m = raw.match(/(\d{1,2}):(\d{2})/);
  if (!m) return raw;

  let h = Number(m[1]);
  const min = m[2];

  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;

  return `${h}:${min} ${ampm}`;
}

export function normalizeGymResponse(payload) {
  const g = payload?.data ?? payload;

  const gallery = parseGalleryUrls(g?.gallery_urls).map(absUrl).filter(Boolean);
  const main = absUrl(g?.main_image_url);
  const photos = [main, ...gallery].filter(Boolean);

  const openingLabel = toTimeLabel(g?.opening_time);
  const closingLabel = toTimeLabel(g?.closing_time);

  const hours = {
    Monday: { open: openingLabel, close: closingLabel },
    Tuesday: { open: openingLabel, close: closingLabel },
    Wednesday: { open: openingLabel, close: closingLabel },
    Thursday: { open: openingLabel, close: closingLabel },
    Friday: { open: openingLabel, close: closingLabel },
    Saturday: { open: openingLabel, close: closingLabel },
    Sunday: { open: openingLabel, close: closingLabel },
  };

  const equipments = Array.isArray(g?.equipments)
    ? g.equipments.map((e) => ({
        equipment_id: e?.equipment_id ?? e?.id,
        name: e?.name ?? "",
        image_url: e?.image_url ? absUrl(e.image_url) : "",
        pivot: {
          id: e?.pivot?.id ?? null,
          quantity: e?.pivot?.quantity ?? 1,
          status: e?.pivot?.status ?? "available",
          date_purchased: e?.pivot?.date_purchased ?? null,
          last_maintenance: e?.pivot?.last_maintenance ?? null,
          next_maintenance: e?.pivot?.next_maintenance ?? null,
        },
      }))
    : [];

  const amenities = Array.isArray(g?.amenities)
    ? g.amenities.map((a) => ({
        amenity_id: a?.amenity_id ?? a?.id,
        name: a?.name ?? "",
        pivot: {
          id: a?.pivot?.id ?? null,
          availability_status: a?.pivot?.availability_status ?? null,
          notes: a?.pivot?.notes ?? null,
          image_url: a?.pivot?.image_url ? absUrl(a.pivot.image_url) : null,
        },
      }))
    : [];

  return {
    gym_id: g?.gym_id ?? g?.id,
    name: g?.name ?? "",
    owner_id: g?.owner_id ?? null,
    status: "active",
    verified: true,

    description: g?.description ?? "",
    address: g?.address ?? "",
    city: g?.city ?? "",
    landmark: g?.landmark ?? "",
    latitude: g?.latitude ?? null,
    longitude: g?.longitude ?? null,

    contact_number: g?.contact_number ?? "",
    email: g?.email ?? "",
    website: g?.website ?? "",

    photos,
    hours,

    pricing: {
      day_pass: g?.daily_price ?? null,
      monthly: g?.monthly_price ?? null,
      quarterly: null,
    },

    amenities,
    equipments,

    analytics: {
      total_views: 0,
      views_this_week: 0,
      views_change: 0,
      total_members: 0,
      new_members_this_month: 0,
      members_change: 0,
      revenue_this_month: 0,
      revenue_change: 0,
      avg_rating: 0,
      total_reviews: 0,
      reviews_change: 0,
    },

    recent_members: Array.isArray(g?.recent_members) ? g.recent_members : [],
    pending_reviews: 0,
    visibility: true,
    featured: false,
  };
}