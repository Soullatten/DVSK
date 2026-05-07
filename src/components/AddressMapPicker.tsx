import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Loader2, Search, Crosshair, Map as MapIcon, Satellite, Moon } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Tile providers — all free, no API key required ─────────────────────────
const TILE_LAYERS = {
  standard: {
    label: "Detail",
    icon: MapIcon,
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
    overlay: null as string | null,
  },
  voyager: {
    label: "Map",
    icon: MapIcon,
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
    maxZoom: 20,
    overlay: null as string | null,
  },
  hybrid: {
    label: "Satellite",
    icon: Satellite,
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri · Labels © CARTO",
    maxZoom: 19,
    overlay:
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png" as
        | string
        | null,
  },
  dark: {
    label: "Dark",
    icon: Moon,
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
    maxZoom: 20,
    overlay: null as string | null,
  },
} as const;
type TileKey = keyof typeof TILE_LAYERS;

const pinIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface ResolvedAddress {
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  lat: number;
  lng: number;
}

interface AddressMapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: ResolvedAddress) => void;
  initialQuery?: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  address?: any;
}

/**
 * Modal with an interactive Leaflet map (OpenStreetMap tiles, free).
 *
 * Honest scope: OSM doesn't index private Indian apartment societies, so
 * customers won't get "Goyal Intercity" by typing it. They search by
 * road/area/pincode, see their building visually (Detail or Satellite
 * layer at zoom 18+), then drag the pin onto the exact entrance. Reverse
 * geocoding still extracts city/state/pincode reliably from the coords.
 */
export default function AddressMapPicker({
  isOpen,
  onClose,
  onConfirm,
  initialQuery,
}: AddressMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayLayerRef = useRef<L.TileLayer | null>(null);
  const searchTimerRef = useRef<number | null>(null);
  const poiLayerRef = useRef<L.LayerGroup | null>(null);
  const poiTimerRef = useRef<number | null>(null);
  const poiCacheRef = useRef<Set<string>>(new Set());

  const [searchInput, setSearchInput] = useState(initialQuery || "");
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [previewAddress, setPreviewAddress] = useState<string>("");
  const [tileKey, setTileKey] = useState<TileKey>("standard");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [poiLoading, setPoiLoading] = useState(false);

  // ── Layer-switcher effect ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) mapRef.current.removeLayer(tileLayerRef.current);
    if (overlayLayerRef.current) mapRef.current.removeLayer(overlayLayerRef.current);

    const cfg = TILE_LAYERS[tileKey];
    const base = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    });
    base.addTo(mapRef.current);
    tileLayerRef.current = base;

    if (cfg.overlay) {
      const labels = L.tileLayer(cfg.overlay, {
        maxZoom: cfg.maxZoom,
        opacity: 1,
        pane: "shadowPane",
      });
      labels.addTo(mapRef.current);
      overlayLayerRef.current = labels;
    } else {
      overlayLayerRef.current = null;
    }
  }, [tileKey]);

  // ── Map init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = [20.5937, 78.9629];
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
      preferCanvas: true,
    });

    const initialCfg = TILE_LAYERS[tileKey];
    const initialLayer = L.tileLayer(initialCfg.url, {
      attribution: initialCfg.attribution,
      maxZoom: initialCfg.maxZoom,
    });
    initialLayer.addTo(map);
    tileLayerRef.current = initialLayer;

    if (initialCfg.overlay) {
      const labels = L.tileLayer(initialCfg.overlay, {
        maxZoom: initialCfg.maxZoom,
        opacity: 1,
        pane: "shadowPane",
      });
      labels.addTo(map);
      overlayLayerRef.current = labels;
    }

    const marker = L.marker(defaultCenter, { draggable: true, icon: pinIcon }).addTo(map);
    markerRef.current = marker;
    mapRef.current = map;
    setPin({ lat: defaultCenter[0], lng: defaultCenter[1] });

    // POI label overlay layer — populated from Overpass API at high zoom.
    // Sits above tiles but below the user's pin so it's clearly secondary.
    const poiLayer = L.layerGroup().addTo(map);
    poiLayerRef.current = poiLayer;

    marker.on("dragend", () => {
      const p = marker.getLatLng();
      setPin({ lat: p.lat, lng: p.lng });
      reverseGeocode(p.lat, p.lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setPin({ lat: e.latlng.lat, lng: e.latlng.lng });
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    // Trigger POI fetch after pan/zoom settles (debounced 800ms).
    const refreshPOIs = () => {
      if (poiTimerRef.current) window.clearTimeout(poiTimerRef.current);
      poiTimerRef.current = window.setTimeout(() => fetchPOIs(map), 800);
    };
    map.on("moveend", refreshPOIs);
    map.on("zoomend", refreshPOIs);

    if (initialQuery && initialQuery.trim()) {
      forwardGeocode(initialQuery.trim());
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          if (mapRef.current && markerRef.current) {
            mapRef.current.setView([lat, lng], 17);
            markerRef.current.setLatLng([lat, lng]);
            setPin({ lat, lng });
            reverseGeocode(lat, lng);
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    setTimeout(() => map.invalidateSize(), 350);

    return () => {
      if (poiTimerRef.current) window.clearTimeout(poiTimerRef.current);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      tileLayerRef.current = null;
      overlayLayerRef.current = null;
      poiLayerRef.current = null;
      poiCacheRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── POI label overlay — pulls building/shop/apartment names from
  // OpenStreetMap's public Overpass API and renders them as floating
  // labels on the map. This is what makes the map feel "info-dense"
  // like Google Maps when you zoom in. Free, no API key, no signup.
  // Only fires at zoom >= 16 so we don't get a thousand overlapping
  // labels at city zoom.
  const fetchPOIs = async (map: L.Map) => {
    const layer = poiLayerRef.current;
    if (!layer) return;
    const zoom = map.getZoom();
    if (zoom < 16) {
      layer.clearLayers();
      return;
    }

    const b = map.getBounds();
    const bbox = `${b.getSouth().toFixed(5)},${b.getWest().toFixed(5)},${b.getNorth().toFixed(5)},${b.getEast().toFixed(5)}`;

    // Skip if we already loaded this exact bbox at this zoom
    const cacheKey = `${bbox}@${zoom}`;
    if (poiCacheRef.current.has(cacheKey)) return;
    poiCacheRef.current.add(cacheKey);

    // Overpass query: every named building, apartment, shop, school,
    // restaurant, mall, and POI in the current viewport. The "out center"
    // returns a single coordinate per feature so we can drop a label.
    const query = `[out:json][timeout:8];
(
  node["name"]["amenity"](${bbox});
  node["name"]["shop"](${bbox});
  node["name"]["tourism"](${bbox});
  node["name"]["leisure"](${bbox});
  node["name"]["office"](${bbox});
  way["name"]["building"~"^(apartments|residential|commercial|retail|hotel|school)$"](${bbox});
  way["name"]["amenity"](${bbox});
  way["name"]["shop"](${bbox});
  way["name"]["tourism"](${bbox});
  way["name"]["leisure"](${bbox});
);
out center 80;`;

    setPoiLoading(true);
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
      });
      if (!res.ok) return;
      const data = await res.json();
      const elements: any[] = data?.elements || [];

      layer.clearLayers();

      // De-duplicate by name (same building can appear as multiple ways)
      const seen = new Set<string>();
      for (const el of elements) {
        const name: string | undefined = el.tags?.name;
        if (!name) continue;
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        const dedupKey = `${name}@${lat.toFixed(4)},${lng.toFixed(4)}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        // Pick an icon based on the POI type
        const tags = el.tags || {};
        let emoji = "📍";
        if (tags.amenity === "school" || tags.amenity === "college" || tags.amenity === "university") emoji = "🎓";
        else if (tags.amenity === "hospital" || tags.amenity === "clinic" || tags.amenity === "pharmacy") emoji = "🏥";
        else if (tags.amenity === "restaurant" || tags.amenity === "cafe" || tags.amenity === "fast_food") emoji = "🍽️";
        else if (tags.amenity === "bank" || tags.amenity === "atm") emoji = "🏦";
        else if (tags.amenity === "place_of_worship") emoji = "🛕";
        else if (tags.amenity === "fuel") emoji = "⛽";
        else if (tags.shop) emoji = "🛍️";
        else if (tags.tourism === "hotel" || tags.tourism === "guest_house") emoji = "🏨";
        else if (tags.leisure === "park" || tags.leisure === "garden") emoji = "🌳";
        else if (tags.building === "apartments" || tags.building === "residential") emoji = "🏢";

        const iconHtml = `<div class="poi-label">${emoji} <span>${escapeHtml(name)}</span></div>`;
        const labelIcon = L.divIcon({
          html: iconHtml,
          className: "poi-divicon",
          iconSize: undefined as any,
          iconAnchor: [0, 0],
        });
        L.marker([lat, lng], { icon: labelIcon, interactive: false, keyboard: false }).addTo(layer);
      }
    } catch {
      // Overpass occasionally times out — just skip; user can still drag pin
    } finally {
      setPoiLoading(false);
    }
  };

  // Tiny helper to keep POI names safe inside HTML strings
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  // ── Live autocomplete (Nominatim, debounced) ──────────────────────────────
  useEffect(() => {
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    if (!searchInput.trim() || searchInput.trim().length < 3) {
      setResults([]);
      return;
    }
    searchTimerRef.current = window.setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput.trim())}&limit=6&countrycodes=in&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = (await res.json()) as SearchResult[];
        setResults(Array.isArray(data) ? data : []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [searchInput]);

  const forwardGeocode = async (query: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0] && mapRef.current && markerRef.current) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        mapRef.current.setView([lat, lng], 16);
        markerRef.current.setLatLng([lat, lng]);
        setPin({ lat, lng });
        reverseGeocode(lat, lng);
      }
    } catch { /* ignore */ }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setResolving(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data && data.display_name) setPreviewAddress(data.display_name);
    } catch { /* ignore */ } finally {
      setResolving(false);
    }
  };

  const pickResult = (r: SearchResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lng], 17);
      markerRef.current.setLatLng([lat, lng]);
    }
    setPin({ lat, lng });
    setPreviewAddress(r.display_name);
    setSearchInput(r.display_name);
    setShowDropdown(false);
    setResults([]);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lng], 17);
          markerRef.current.setLatLng([lat, lng]);
        }
        setPin({ lat, lng });
        reverseGeocode(lat, lng);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = async () => {
    if (!pin) return;
    setResolving(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pin.lat}&lon=${pin.lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const a = (data && data.address) || {};

      const streetParts = [
        a.house_number,
        a.road || a.pedestrian || a.residential,
        a.neighbourhood || a.suburb || a.quarter,
      ].filter(Boolean);
      const addressLine1 =
        streetParts.join(", ") ||
        (data?.display_name?.split(",").slice(0, 2).join(", ") ?? "");

      const resolved: ResolvedAddress = {
        addressLine1,
        city: a.city || a.town || a.village || a.county || "",
        state: a.state || "",
        pincode: a.postcode || "",
        country: a.country || "India",
        lat: pin.lat,
        lng: pin.lng,
      };
      onConfirm(resolved);
      onClose();
    } catch {
      onClose();
    } finally {
      setResolving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* POI label styling — these float over the map showing
              apartment/shop/school names pulled from OpenStreetMap. */}
          <style>{`
            .poi-divicon { background: transparent !important; border: 0 !important; }
            .poi-label {
              display: inline-flex;
              align-items: center;
              gap: 3px;
              white-space: nowrap;
              font-size: 10px;
              font-weight: 700;
              line-height: 1;
              color: #fff;
              background: rgba(0,0,0,0.72);
              border: 1px solid rgba(255,235,171,0.25);
              padding: 3px 6px 3px 4px;
              border-radius: 4px;
              transform: translate(-50%, -120%);
              pointer-events: none;
              text-shadow: 0 1px 2px rgba(0,0,0,0.8);
              max-width: 160px;
              overflow: hidden;
              text-overflow: ellipsis;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            }
            .poi-label span { overflow: hidden; text-overflow: ellipsis; }
          `}</style>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            style={{ zIndex: 99998 }}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
            style={{ zIndex: 99999 }}
          >
            <div
              className="relative w-full max-w-[920px] h-[88vh] rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)] pointer-events-auto flex flex-col"
              style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10" style={{ background: "#111" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,235,171,0.12)", border: "1px solid rgba(255,235,171,0.3)" }}>
                    <MapPin className="w-4 h-4" style={{ color: "#ffebab" }} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-white">Pin your address</h2>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Search a road / area, switch to Satellite, drag the pin onto your building.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative" style={{ background: "#0d0d0d" }}>
                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onFocus={() => results.length > 0 && setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      placeholder="Search a road, area, landmark, or pincode…"
                      className="w-full pl-10 pr-9 py-2.5 text-[13px] rounded-xl outline-none"
                      style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin" style={{ color: "#ffebab" }} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={useMyLocation}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-colors"
                    style={{ background: "rgba(255,235,171,0.08)", border: "1px solid rgba(255,235,171,0.25)", color: "#ffebab" }}
                    title="Use my GPS location"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    My location
                  </button>
                </div>

                {showDropdown && results.length > 0 && (
                  <div
                    className="absolute left-5 right-5 mt-0 rounded-xl overflow-hidden shadow-2xl"
                    style={{
                      background: "#0d0d0d",
                      border: "1px solid rgba(255,255,255,0.1)",
                      zIndex: 50,
                      maxHeight: 280,
                      overflowY: "auto",
                    }}
                  >
                    {results.map((r, i) => (
                      <button
                        key={`${r.lat}-${r.lon}-${i}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickResult(r)}
                        className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors"
                        style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,235,171,0.06)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#ffebab" }} />
                        <span className="text-[12px] leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>
                          {r.display_name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 relative" style={{ minHeight: 0 }}>
                <div ref={mapContainerRef} className="absolute inset-0" style={{ background: "#181818" }} />

                <div
                  className="absolute top-3 right-3 flex items-center gap-1 p-1 rounded-xl"
                  style={{
                    background: "rgba(13,13,13,0.85)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    zIndex: 1000,
                  }}
                >
                  {(Object.keys(TILE_LAYERS) as TileKey[]).map((key) => {
                    const cfg = TILE_LAYERS[key];
                    const Icon = cfg.icon;
                    const active = tileKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setTileKey(key)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-[0.1em] uppercase transition-all"
                        style={{
                          background: active ? "#ffebab" : "transparent",
                          color: active ? "#000" : "rgba(255,255,255,0.65)",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="absolute bottom-3 left-3 px-3 py-2 rounded-lg text-[10px] tracking-[0.18em] uppercase font-bold"
                  style={{
                    background: "rgba(13,13,13,0.85)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.6)",
                    zIndex: 1000,
                    pointerEvents: "none",
                  }}
                >
                  Drag the pin · Click to set
                </div>

                {/* POI loading indicator — shows while we're pulling
                    apartment/shop names from OpenStreetMap */}
                {poiLoading && (
                  <div
                    className="absolute bottom-3 right-3 px-3 py-2 rounded-lg text-[10px] tracking-[0.18em] uppercase font-bold flex items-center gap-2"
                    style={{
                      background: "rgba(13,13,13,0.85)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,235,171,0.25)",
                      color: "#ffebab",
                      zIndex: 1000,
                      pointerEvents: "none",
                    }}
                  >
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading place names…
                  </div>
                )}
              </div>

              <div
                className="px-5 py-4 border-t border-white/10 flex items-center gap-4"
                style={{ background: "#0d0d0d" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Selected location
                  </div>
                  <div className="text-[13px] text-white truncate mt-1 flex items-center gap-2">
                    {resolving && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" style={{ color: "#ffebab" }} />}
                    <span className="truncate">{previewAddress || "Search above or drag the pin to set a location."}</span>
                  </div>
                </div>
                <button
                  onClick={handleConfirm}
                  disabled={!pin || resolving}
                  className="px-6 py-3 rounded-xl text-[12px] font-bold tracking-[0.18em] uppercase transition-colors flex-shrink-0"
                  style={{
                    background: !pin || resolving ? "rgba(255,255,255,0.1)" : "#ffebab",
                    color: !pin || resolving ? "rgba(255,255,255,0.4)" : "#000",
                    cursor: !pin || resolving ? "not-allowed" : "pointer",
                  }}
                >
                  Use this address
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
