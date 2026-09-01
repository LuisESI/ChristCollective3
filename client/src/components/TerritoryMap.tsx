import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Venue } from "@shared/schema";
import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from "d3-geo";

// Our served territory (West LA). More points light up as we expand.
const TERRITORY: [number, number] = [-118.24, 34.05];

export function TerritoryMap() {
  const { data: venues = [] } = useQuery<Venue[]>({ queryKey: ["/api/admin/venues?area=westside"] });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.min(wrap.clientWidth || 560, 560), h = 300;
    canvas.width = w * DPR; canvas.height = h * DPR;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.scale(DPR, DPR);

    const R = Math.min(w, h) / 2 - 16;
    const projection = geoOrthographic().translate([w / 2, h / 2]).scale(R);
    const path: any = geoPath(projection, ctx as any);
    const grat = geoGraticule10();

    let land: any = null;
    let lambda = 118, frame = 0, stopped = false, raf = 0;

    const draw = () => {
      if (stopped) return;
      projection.rotate([lambda, -25]);
      ctx.clearRect(0, 0, w, h);
      // ocean
      ctx.beginPath(); path({ type: "Sphere" }); ctx.fillStyle = "#0a1420"; ctx.fill();
      // graticule
      ctx.beginPath(); path(grat); ctx.strokeStyle = "rgba(212,175,55,0.12)"; ctx.lineWidth = 0.5; ctx.stroke();
      // land
      if (land) {
        ctx.beginPath(); path(land);
        ctx.fillStyle = "#1b1e25"; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.13)"; ctx.lineWidth = 0.4; ctx.stroke();
      }
      // rim glow
      ctx.beginPath(); path({ type: "Sphere" }); ctx.strokeStyle = "rgba(212,175,55,0.5)"; ctx.lineWidth = 1.1; ctx.stroke();
      // territory marker (only when on the near hemisphere)
      const center: [number, number] = [-lambda, 25];
      if (geoDistance(TERRITORY, center) < Math.PI / 2) {
        const p = projection(TERRITORY);
        if (p) {
          const pulse = 6 + 5 * (0.5 + 0.5 * Math.sin(frame / 22));
          ctx.beginPath(); ctx.arc(p[0], p[1], pulse, 0, 2 * Math.PI); ctx.fillStyle = "rgba(212,175,55,0.14)"; ctx.fill();
          ctx.shadowColor = "#D4AF37"; ctx.shadowBlur = 14;
          ctx.beginPath(); ctx.arc(p[0], p[1], 3.6, 0, 2 * Math.PI); ctx.fillStyle = "#F2D479"; ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#F2D479"; ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
          ctx.fillText("West LA", p[0] + 9, p[1] - 7);
        }
      }
      lambda -= 0.12; frame++;
      raf = requestAnimationFrame(draw);
    };

    fetch("/world-land.json").then((r) => r.json()).then((geo) => { land = geo; }).catch(() => {});
    draw();
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="rounded-2xl border border-gray-800/60 bg-[#060606] overflow-hidden mb-5">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide">Territory Map</h2>
          <p className="text-[11px] text-[#D4AF37]">Serving West LA · {venues.length} spots live</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37]" style={{ boxShadow: "0 0 6px #D4AF37" }} /> Serving now
        </span>
      </div>
      <div ref={wrapRef} className="relative w-full flex justify-center" style={{ height: 300 }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 45%, rgba(212,175,55,0.08), transparent 62%)" }} />
        <canvas ref={canvasRef} className="block" />
      </div>
      <div className="px-4 pb-3 text-[11px] text-gray-500">
        West LA is live. New territories light up as we expand (Valley → East → South → beyond).
      </div>
    </div>
  );
}
