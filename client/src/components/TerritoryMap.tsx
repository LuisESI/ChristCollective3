import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Venue } from "@shared/schema";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const WEST_LA: [number, number] = [-118.45, 34.03];

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

// Free, no-API-key dark basemap (CARTO) as a raster source, rendered on a globe.
const STYLE: any = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap · © CARTO',
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#05070b" } },
    { id: "carto", type: "raster", source: "carto" },
  ],
  projection: { type: "globe" },
};

export function TerritoryMap() {
  const { data: venues = [] } = useQuery<Venue[]>({ queryKey: ["/api/admin/venues?area=westside"] });
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // init once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [-98, 38],
      zoom: 2.1,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      map.addSource("territory", { type: "geojson", data: TERRITORY as any });
      map.addLayer({ id: "territory-fill", type: "fill", source: "territory", paint: { "fill-color": "#D4AF37", "fill-opacity": 0.12 } });
      map.addLayer({ id: "territory-line", type: "line", source: "territory", paint: { "line-color": "#D4AF37", "line-width": 2, "line-opacity": 0.85 } });
      map.on("click", "territory-fill", (e: any) => {
        new maplibregl.Popup({ offset: 8, className: "cc-pop" }).setLngLat(e.lngLat)
          .setHTML('<div style="font-weight:700;color:#D4AF37">West LA</div><div style="color:#aaa;font-size:11px">Serving now</div>').addTo(map);
      });
      map.on("mouseenter", "territory-fill", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "territory-fill", () => { map.getCanvas().style.cursor = ""; });
      placeMarkers();
      // intro: swoop from the globe into West LA
      window.setTimeout(() => map.flyTo({ center: WEST_LA, zoom: 11, pitch: 45, bearing: -12, duration: 4200, essential: true }), 900);
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  function placeMarkers() {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const used: Record<string, number> = {};
    for (const v of venues as any[]) {
      if (v.lat == null || v.lng == null) continue;
      const key = `${(+v.lat).toFixed(4)},${(+v.lng).toFixed(4)}`;
      const n = (used[key] = (used[key] || 0) + 1);
      const jx = n === 1 ? 0 : (Math.random() - 0.5) * 0.005;
      const jy = n === 1 ? 0 : (Math.random() - 0.5) * 0.005;
      const el = document.createElement("div");
      el.className = "cc-venue-pin";
      const img = v.imageUrl ? `<img src="${v.imageUrl}" referrerpolicy="no-referrer" style="width:100%;height:88px;object-fit:cover;border-radius:8px;margin-bottom:6px" onerror="this.style.display='none'"/>` : "";
      const popup = new maplibregl.Popup({ offset: 16, className: "cc-pop" }).setHTML(
        `<div style="width:184px">${img}<div style="font-weight:700;color:#fff;font-size:13px">${v.name}</div><div style="color:#9a9a9a;font-size:11px;margin-top:2px">${[v.neighborhood, v.status].filter(Boolean).join(" · ")}</div></div>`,
      );
      const marker = new maplibregl.Marker({ element: el }).setLngLat([+v.lng + jx, +v.lat + jy]).setPopup(popup).addTo(map);
      markersRef.current.push(marker);
    }
  }

  // refresh markers when venues load/change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded && map.isStyleLoaded()) placeMarkers();
  }, [venues]);

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
        <span className="flex items-center gap-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D4AF37]" style={{ boxShadow: "0 0 6px #D4AF37" }} /> Venue</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#D4AF37]/30 border border-[#D4AF37]" /> Territory</span>
        </span>
      </div>
      <div ref={containerRef} className="w-full mt-3" style={{ height: 400 }} />
      <div className="px-4 py-2 text-[11px] text-gray-500">Drag to rotate · scroll to zoom · ⛶ fullscreen. West LA is live; new territories light up as we expand.</div>
    </div>
  );
}
