import { emitLiveEvent } from "./socket.js";

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  "New Delhi": { lat: 28.6139, lng: 77.209 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Kanpur: { lat: 26.4499, lng: 80.3319 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Indore: { lat: 22.7196, lng: 75.8577 },
  Bhopal: { lat: 23.2599, lng: 77.4126 },
  Patna: { lat: 25.5941, lng: 85.1376 },
  Vadodara: { lat: 22.3072, lng: 73.1812 },
  Ludhiana: { lat: 30.9, lng: 75.8573 },
  Agra: { lat: 27.1767, lng: 78.0081 },
  Nashik: { lat: 19.9975, lng: 73.7898 },
  Faridabad: { lat: 28.4089, lng: 77.3178 },
  Meerut: { lat: 28.9845, lng: 77.7064 },
  Rajkot: { lat: 22.3039, lng: 70.8022 },
  Varanasi: { lat: 25.3176, lng: 82.9739 },
  Srinagar: { lat: 34.0837, lng: 74.7973 },
  Aurangabad: { lat: 19.8762, lng: 75.3433 },
  Amritsar: { lat: 31.634, lng: 74.8723 },
  "Navi Mumbai": { lat: 19.033, lng: 73.0297 },
  Allahabad: { lat: 25.4358, lng: 81.8463 },
  Prayagraj: { lat: 25.4358, lng: 81.8463 },
  Howrah: { lat: 22.5958, lng: 88.2636 },
  Ranchi: { lat: 23.3441, lng: 85.3096 },
  Gwalior: { lat: 26.2183, lng: 78.1828 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Vijayawada: { lat: 16.5062, lng: 80.648 },
  Jodhpur: { lat: 26.2389, lng: 73.0243 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Raipur: { lat: 21.2514, lng: 81.6296 },
  Kota: { lat: 25.2138, lng: 75.8648 },
  Chandigarh: { lat: 30.7333, lng: 76.7794 },
  Guwahati: { lat: 26.1445, lng: 91.7362 },
  Mysore: { lat: 12.2958, lng: 76.6394 },
  Mysuru: { lat: 12.2958, lng: 76.6394 },
  Thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  Gurgaon: { lat: 28.4595, lng: 77.0266 },
  Gurugram: { lat: 28.4595, lng: 77.0266 },
  Noida: { lat: 28.5355, lng: 77.391 },
  Goa: { lat: 15.2993, lng: 74.124 },
  Panaji: { lat: 15.4909, lng: 73.8278 },
  Dehradun: { lat: 30.3165, lng: 78.0322 },
  Shimla: { lat: 31.1048, lng: 77.1734 },
};

const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

function jitter(coord: { lat: number; lng: number }) {
  return {
    lat: coord.lat + (Math.random() * 0.05 - 0.025),
    lng: coord.lng + (Math.random() * 0.05 - 0.025),
  };
}

const nominatimCache = new Map<string, { lat: number; lng: number }>();

async function nominatimGeocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const cached = nominatimCache.get(query);
  if (cached) return cached;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const r = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "DVSK-Admin/1.0 (live-tracker)" },
    });
    clearTimeout(timeout);
    if (!r.ok) return null;
    const arr = (await r.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const top = arr[0]!;
    const coord = { lat: parseFloat(top.lat), lng: parseFloat(top.lon) };
    if (Number.isNaN(coord.lat) || Number.isNaN(coord.lng)) return null;
    nominatimCache.set(query, coord);
    return coord;
  } catch {
    return null;
  }
}

export async function geocodeCityAsync(
  city: string | null | undefined,
  state?: string | null,
  country?: string | null
): Promise<{ lat: number; lng: number }> {
  if (!city) return INDIA_CENTER;
  const key = city.trim();
  const exact = CITY_COORDS[key];
  if (exact) return jitter(exact);
  const lower = key.toLowerCase();
  for (const k of Object.keys(CITY_COORDS)) {
    if (k.toLowerCase() === lower) return jitter(CITY_COORDS[k]!);
  }

  const query = [city, state, country].filter(Boolean).join(", ");
  const remote = await nominatimGeocode(query);
  if (remote) return jitter(remote);

  return INDIA_CENTER;
}

// Synchronous version (legacy callers). Returns India center if not in static map.
export function geocodeCity(city: string | null | undefined): { lat: number; lng: number } {
  if (!city) return INDIA_CENTER;
  const key = city.trim();
  const exact = CITY_COORDS[key];
  if (exact) return jitter(exact);
  const lower = key.toLowerCase();
  for (const k of Object.keys(CITY_COORDS)) {
    if (k.toLowerCase() === lower) return jitter(CITY_COORDS[k]!);
  }
  return INDIA_CENTER;
}

export const LiveEvents = {
  async orderPlaced(payload: {
    orderNumber: string;
    city: string | null | undefined;
    state?: string | null;
    country?: string | null;
    total: number;
  }) {
    const coords = await geocodeCityAsync(payload.city, payload.state, payload.country);
    emitLiveEvent("order:placed", {
      id: payload.orderNumber,
      city: payload.city || "Unknown",
      amount: `₹${Math.round(payload.total).toLocaleString("en-IN")}`,
      time: "Just now",
      lat: coords.lat,
      lng: coords.lng,
      ts: Date.now(),
    });
  },

  orderPaid(payload: { orderId: string; orderNumber: string; total: number }) {
    emitLiveEvent("order:paid", { ...payload, ts: Date.now() });
  },

  inventoryLow(payload: { sku: string; productName: string; stock: number }) {
    emitLiveEvent("inventory:low", { ...payload, ts: Date.now() });
  },

  // Generic broadcast: tells admin pages "your data type changed, please re-fetch"
  // type names match the URL slug of the page that should listen
  // (campaigns, automations, gift-cards, markets, catalogs, companies,
  //  purchase-orders, products, drafts, segments, reports).
  dataChanged(type: string, action: "create" | "update" | "delete" = "update", id?: string) {
    emitLiveEvent("admin:data_changed", { type, action, id, ts: Date.now() });
  },
};
