import { useQuery } from "@tanstack/react-query";
import type { Venue } from "@shared/schema";
import { MapPin } from "lucide-react";

// Stylized (not geographic) LA regions arranged roughly by direction. Ocean is to the lower-left.
const REGIONS: { name: string; pts: string; served?: boolean; lx: number; ly: number }[] = [
  { name: "THE VALLEY", pts: "30,8 114,8 114,26 33,26", lx: 72, ly: 18 },
  { name: "CENTRAL", pts: "53,26 84,26 84,51 53,51", lx: 68, ly: 40 },
  { name: "EAST LA", pts: "84,26 116,30 114,56 84,51", lx: 99, ly: 43 },
  { name: "WEST LA", pts: "14,31 53,26 53,52 31,58 14,50", served: true, lx: 24, ly: 33 },
  { name: "SOUTH LA", pts: "53,52 88,55 84,77 55,75", lx: 69, ly: 66 },
  { name: "SOUTH BAY", pts: "31,58 53,52 55,75 35,79 21,68", lx: 37, ly: 69 },
];

// Approximate positions for the neighborhoods we've scouted (viewBox units).
const NB: Record<string, [number, number]> = {
  "Pacific Palisades": [18, 41], "Santa Monica": [20, 49], "Brentwood": [29, 43],
  "Westwood": [37, 46], "Bel Air": [38, 35], "Beverly Hills": [47, 41],
  "West Hollywood": [54, 36], "Hollywood": [62, 33],
};

export function TerritoryMap() {
  const { data: venues = [] } = useQuery<Venue[]>({ queryKey: ["/api/admin/venues?area=westside"] });

  const markers: { x: number; y: number; name: string }[] = [];
  const seen: Record<string, number> = {};
  for (const v of venues) {
    const base = v.neighborhood ? NB[v.neighborhood] : undefined;
    if (!base) continue;
    const n = (seen[v.neighborhood!] = (seen[v.neighborhood!] || 0) + 1);
    const ang = n * 2.399, r = n === 1 ? 0 : 1.5 + n * 0.5; // golden-angle jitter for clusters
    markers.push({ x: base[0] + Math.cos(ang) * r, y: base[1] + Math.sin(ang) * r, name: v.name });
  }

  return (
    <div className="rounded-2xl border border-gray-800/60 bg-[#060606] overflow-hidden mb-5">
      <style>{`@keyframes tmpulse{0%{r:1.6;opacity:.7}70%{r:5;opacity:0}100%{opacity:0}}`}</style>
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide">Territory Map</h2>
          <p className="text-[11px] text-[#D4AF37]">Serving West LA · {markers.length} spots live</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#D4AF37]/40 border border-[#D4AF37]" /> Serving</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D4AF37]" style={{ boxShadow: "0 0 6px #D4AF37" }} /> Venue</span>
        </div>
      </div>

      <div className="relative mx-auto max-w-xl rounded-xl overflow-hidden my-2" style={{ perspective: "1200px" }}>
        {/* horizon glow */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#D4AF37]/12 to-transparent pointer-events-none z-10" />
        <svg
          viewBox="0 0 128 84"
          preserveAspectRatio="xMidYMid meet"
          className="w-full block drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)]"
          style={{ height: "300px", transform: "rotateX(15deg)", transformOrigin: "center 55%" }}
        >
          <defs>
            <filter id="tmGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="1.3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <pattern id="tmGrid" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M6 0H0V6" fill="none" stroke="rgba(212,175,55,0.07)" strokeWidth="0.25" />
            </pattern>
            <linearGradient id="tmOcean" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#0a1420" /><stop offset="1" stopColor="#060a10" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="128" height="84" fill="#060606" />
          <rect x="0" y="0" width="128" height="84" fill="url(#tmGrid)" />
          {/* ocean (lower-left) */}
          <polygon points="0,44 14,50 14,84 0,84" fill="url(#tmOcean)" />
          <polygon points="14,50 31,58 21,68 0,84 14,84 14,50" fill="url(#tmOcean)" opacity="0.9" />

          {/* regions */}
          {REGIONS.map((rg) => (
            <g key={rg.name}>
              <polygon
                points={rg.pts}
                fill={rg.served ? "rgba(212,175,55,0.13)" : "rgba(255,255,255,0.02)"}
                stroke={rg.served ? "#D4AF37" : "rgba(255,255,255,0.10)"}
                strokeWidth={rg.served ? 0.8 : 0.4}
                filter={rg.served ? "url(#tmGlow)" : undefined}
              />
              <text
                x={rg.lx} y={rg.ly}
                textAnchor="middle"
                fontSize="3"
                letterSpacing="0.4"
                fontWeight="700"
                fill={rg.served ? "#D4AF37" : "rgba(255,255,255,0.28)"}
              >{rg.name}</text>
            </g>
          ))}

          {/* venue nodes */}
          {markers.map((m, i) => (
            <g key={i}>
              <title>{m.name}</title>
              <circle cx={m.x} cy={m.y} r="1.6" fill="#D4AF37" style={{ transformBox: "fill-box", transformOrigin: "center", animation: "tmpulse 2.6s ease-out infinite" }} opacity="0.5" />
              <circle cx={m.x} cy={m.y} r="1.5" fill="#F2D479" filter="url(#tmGlow)" />
            </g>
          ))}
        </svg>
      </div>

      <div className="px-4 pb-3 -mt-2 flex items-center gap-1.5 text-[11px] text-gray-500">
        <MapPin className="w-3 h-3 text-[#D4AF37]" />
        West LA is live. Other regions unlock as you expand (Valley → East → South).
      </div>
    </div>
  );
}
