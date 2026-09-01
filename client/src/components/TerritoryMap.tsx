import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Venue } from "@shared/schema";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const WEST_LA: [number, number] = [-118.45, 34.03];

// Venue-type colors + labels for the pins and legend.
const TYPE_COLORS: Record<string, string> = {
  coffee: "#E0A867", hiking: "#43C46B", run: "#F0607E", book: "#7C86EC", general: "#D4AF37",
};
const TYPE_LABELS: Record<string, string> = {
  coffee: "Coffee", hiking: "Hiking", run: "Running", book: "Book club", general: "General",
};

// Rough West LA / Westside outline (our served territory).
const TERRITORY = {
  type: "Feature" as const,
  properties: { name: "West LA" },
  geometry: {
    type: "Polygon" as const,
    coordinates: [[
      [-118.53, 34.06], [-118.42, 34.115], [-118.35, 34.085], [-118.355, 34.00],
      [-118.47, 33.975], [-118.535, 34.02], [-118.53, 34.06],
    ]],
  },
};

// Free, no-API-key dark basemap (Esri World Dark Gray) rendered on a globe.
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas";
const STYLE: any = {
  version: 8,
  sources: {
    base: { type: "raster", tiles: [`${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`], tileSize: 256, attribution: "Esri, HERE, Garmin, © OpenStreetMap contributors" },
    labels: { type: "raster", tiles: [`${ESRI}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`], tileSize: 256 },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#05070b" } },
    { id: "base", type: "raster", source: "base" },
    { id: "labels", type: "raster", source: "labels" },
  ],
  projection: { type: "globe" },
};

export function TerritoryMap() {
  const { data: venues = [] } = useQuery<Venue[]>({ queryKey: ["/api/admin/venues?area=westside"] });
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  // init once — start zoomed on West LA (its territory + pins are visible immediately);
  // zoom out and it becomes a globe.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: WEST_LA,
      zoom: 10.3,
      pitch: 40,
      bearing: -12,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      map.addSource("territory", { type: "geojson", data: TERRITORY as any });
      map.addLayer({ id: "territory-fill", type: "fill", source: "territory", paint: { "fill-color": "#D4AF37", "fill-opacity": 0.10 } });
      // glowing boundary: a soft wide underlay + a crisp bright border on top
      map.addLayer({ id: "territory-glow", type: "line", source: "territory", paint: { "line-color": "#D4AF37", "line-width": 9, "line-opacity": 0.22, "line-blur": 5 } });
      map.addLayer({ id: "territory-line", type: "line", source: "territory", paint: { "line-color": "#F4D577", "line-width": 3, "line-opacity": 1 } });
      map.on("click", "territory-fill", (e: any) => {
        new maplibregl.Popup({ offset: 8, className: "cc-pop" }).setLngLat(e.lngLat)
          .setHTML('<div style="font-weight:700;color:#D4AF37">West LA</div><div style="color:#aaa;font-size:11px">Serving now</div>').addTo(map);
      });
      map.on("mouseenter", "territory-fill", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "territory-fill", () => { map.getCanvas().style.cursor = ""; });
      setReady(true);
    });

    return () => { map.remove(); mapRef.current = null; markersRef.current = []; };
  }, []);

  // place/refresh venue pins once the map is loaded AND venues are in
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const used: Record<string, number> = {};
    for (const v of venues as any[]) {
      if (v.lat == null || v.lng == null) continue;
      const key = `${(+v.lat).toFixed(4)},${(+v.lng).toFixed(4)}`;
      const n = (used[key] = (used[key] || 0) + 1);
      const jx = n === 1 ? 0 : (Math.random() - 0.5) * 0.006;
      const jy = n === 1 ? 0 : (Math.random() - 0.5) * 0.006;
      const el = document.createElement("div");
      el.className = "cc-venue-pin";
      const color = TYPE_COLORS[v.activityType] || "#D4AF37";
      el.style.background = color;
      el.style.boxShadow = `0 0 0 2px ${color}66, 0 0 10px 2px ${color}99`;
      const img = v.imageUrl ? `<img src="${v.imageUrl}" referrerpolicy="no-referrer" style="width:100%;height:88px;object-fit:cover;border-radius:8px;margin-bottom:6px" onerror="this.style.display='none'"/>` : "";
      const popup = new maplibregl.Popup({ offset: 16, className: "cc-pop" }).setHTML(
        `<div style="width:184px">${img}<div style="font-weight:700;color:#fff;font-size:13px">${v.name}</div><div style="color:#9a9a9a;font-size:11px;margin-top:2px">${[v.neighborhood, v.status].filter(Boolean).join(" · ")}</div></div>`,
      );
      const marker = new maplibregl.Marker({ element: el }).setLngLat([+v.lng + jx, +v.lat + jy]).setPopup(popup).addTo(map);
      markersRef.current.push(marker);
    }
  }, [venues, ready]);

  const legendTypes = Array.from(new Set((venues as any[]).map((v) => v.activityType).filter(Boolean)))
    .sort((a, b) => (TYPE_LABELS[a] || a).localeCompare(TYPE_LABELS[b] || b));

  return (
    <div className="rounded-2xl border border-gray-800/60 bg-[#060606] overflow-hidden mb-5">
      <style>{`
        .cc-venue-pin{width:14px;height:14px;border-radius:50%;background:#F2D479;border:2px solid #0a0a0a;box-shadow:0 0 0 2px rgba(212,175,55,0.45),0 0 10px 2px rgba(212,175,55,0.55);cursor:pointer;transition:transform .15s}
        .cc-venue-pin:hover{transform:scale(1.25)}
        .cc-pop .maplibregl-popup-content{background:#0d0d0f;border:1px solid #2a2a2a;border-radius:12px;color:#fff;padding:10px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
        .cc-pop .maplibregl-popup-tip{border-top-color:#0d0d0f !important;border-bottom-color:#0d0d0f !important}
        .cc-pop .maplibregl-popup-close-button{color:#888;font-size:16px}
        .maplibregl-ctrl-attrib.maplibregl-compact{background:rgba(0,0,0,.55)}
        .maplibregl-ctrl-attrib a{color:#888}
      `}</style>
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide">Territory Map</h2>
          <p className="text-[11px] text-[#D4AF37]">Serving West LA · {venues.length} spots</p>
        </div>
      </div>
      <div className="relative w-full mt-3">
        <div ref={containerRef} className="w-full" style={{ height: 400 }} />
        {legendTypes.length > 0 && (
          <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-black/75 backdrop-blur border border-gray-800 px-3 py-2.5 space-y-1.5">
            {legendTypes.map((t) => (
              <div key={t} className="flex items-center gap-2 text-[11px] text-gray-200">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS[t] || "#D4AF37", boxShadow: `0 0 5px ${TYPE_COLORS[t] || "#D4AF37"}` }} />
                {TYPE_LABELS[t] || t}
              </div>
            ))}
            <div className="flex items-center gap-2 text-[11px] text-gray-200 pt-1.5 mt-0.5 border-t border-gray-800">
              <span className="w-3.5 h-2 rounded-sm border-2 border-[#F4D577] bg-[#D4AF37]/15" /> Served area
            </div>
          </div>
        )}
      </div>
      <div className="px-4 py-2 text-[11px] text-gray-500">Drag to rotate · scroll to zoom · ⛶ fullscreen. West LA is live; new territories light up as we expand.</div>
    </div>
  );
}
