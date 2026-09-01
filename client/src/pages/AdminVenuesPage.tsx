import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Plus, Trash2, ExternalLink, ArrowLeft, Coffee, Mountain, Footprints, BookOpen, Users, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import type { Venue } from "@shared/schema";
import { TerritoryMap } from "@/components/TerritoryMap";

const ACTIVITIES: Record<string, { label: string; icon: any }> = {
  hiking: { label: "Hiking spots", icon: Mountain },
  run: { label: "Run routes", icon: Footprints },
  coffee: { label: "Coffee shops", icon: Coffee },
  book: { label: "Book club (churches / rooms)", icon: BookOpen },
  general: { label: "General", icon: Users },
};
const AREAS = [
  { value: "westside", label: "West Side" },
  { value: "valley", label: "Valley" },
  { value: "eastside", label: "East Side" },
  { value: "southside", label: "South Side" },
];
const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-400 border-green-500/30",
  candidate: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30",
  outreach: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  rejected: "bg-gray-700 text-gray-400 border-gray-600",
};

export default function AdminVenuesPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [area, setArea] = useState("westside");
  const [editing, setEditing] = useState<Partial<Venue> | null>(null);

  const { data: venues = [], isLoading: loading } = useQuery<Venue[]>({
    queryKey: [`/api/admin/venues?area=${area}`],
    enabled: user?.isAdmin === true,
  });

  const save = useMutation({
    mutationFn: async (v: Partial<Venue>) =>
      v.id ? apiRequest(`/api/admin/venues/${v.id}`, { method: "PATCH", data: v })
           : apiRequest(`/api/admin/venues`, { method: "POST", data: v }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/admin/venues?area=${area}`] }); setEditing(null); toast({ title: "Saved" }); },
    onError: () => toast({ title: "Couldn't save", variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/admin/venues/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/admin/venues?area=${area}`] }); toast({ title: "Removed" }); },
  });

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" /></div>;
  if (!user?.isAdmin) return <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center"><Shield className="h-10 w-10 text-[#D4AF37] mb-3" /><p className="text-gray-400">Admin access required.</p></div>;

  const grouped = (venues || []).reduce((acc: Record<string, Venue[]>, v) => { (acc[v.activityType] ||= []).push(v); return acc; }, {});

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur border-b border-gray-800/60 px-5 py-4 flex items-center gap-3">
        <Link href="/admin"><button className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button></Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Venue Directory</h1>
          <p className="text-xs text-gray-500">Free / public places to send clubs & matchups — candidates to confirm.</p>
        </div>
        <Button onClick={() => setEditing({ activityType: "coffee", area, status: "candidate", cost: "free" })} className="bg-[#D4AF37] text-black hover:bg-[#C4A030] h-9"><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </header>

      <div className="px-5 py-4">
        <TerritoryMap />
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
          {AREAS.map((a) => (
            <button key={a.value} onClick={() => setArea(a.value)} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border ${area === a.value ? "bg-[#D4AF37] text-black border-transparent" : "bg-transparent border-gray-700 text-gray-300"}`}>{a.label}</button>
          ))}
        </div>

        {loading ? <p className="text-gray-500 text-sm">Loading…</p> :
         venues.length === 0 ? <p className="text-gray-500 text-sm">No venues in this area yet. Add candidates as you scout them.</p> :
         Object.entries(ACTIVITIES).map(([key, meta]) => {
           const list = grouped[key];
           if (!list || list.length === 0) return null;
           const Icon = meta.icon;
           return (
             <div key={key} className="mb-7">
               <div className="flex items-center gap-2 mb-3"><Icon className="w-4 h-4 text-[#D4AF37]" /><h2 className="font-bold">{meta.label}</h2><span className="text-xs text-gray-600">{list.length}</span></div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                 {list.map((v) => (
                   <div key={v.id} className="rounded-xl border border-gray-800/60 bg-[#0A0A0A] p-4">
                     <VenueCarousel images={(v.images && v.images.length ? v.images : (v.imageUrl ? [v.imageUrl] : []))} name={v.name} />
                     <div className="flex items-start justify-between gap-2">
                       <div className="min-w-0">
                         <h3 className="font-semibold text-white">{v.name}</h3>
                         <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{v.neighborhood || "—"}{v.capacity ? ` · fits ~${v.capacity}` : ""}</p>
                       </div>
                       <Badge className={`text-[10px] border ${STATUS_COLORS[v.status] || STATUS_COLORS.candidate}`}>{v.status}</Badge>
                     </div>
                     {v.notes && <p className="text-xs text-gray-400 mt-2 leading-relaxed">{v.notes}</p>}
                     <div className="flex items-center gap-3 mt-3 text-xs">
                       {v.mapUrl && <a href={v.mapUrl} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3" /> Map</a>}
                       <button onClick={() => setEditing(v)} className="text-gray-400 hover:text-white">Edit</button>
                       <button onClick={() => { if (confirm(`Remove ${v.name}?`)) del.mutate(v.id); }} className="text-red-400 hover:text-red-300 flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3" /></button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           );
         })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-[#0A0A0A] border-gray-800 text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit venue" : "Add venue"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Field label="Name"><Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="bg-gray-900 border-gray-800 text-white" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Activity">
                  <select value={editing.activityType} onChange={(e) => setEditing({ ...editing, activityType: e.target.value })} className="w-full bg-gray-900 border border-gray-800 rounded-md h-10 px-3 text-sm">
                    {Object.entries(ACTIVITIES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                  </select>
                </Field>
                <Field label="Area">
                  <select value={editing.area} onChange={(e) => setEditing({ ...editing, area: e.target.value })} className="w-full bg-gray-900 border border-gray-800 rounded-md h-10 px-3 text-sm">
                    {AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Neighborhood"><Input value={editing.neighborhood || ""} onChange={(e) => setEditing({ ...editing, neighborhood: e.target.value })} className="bg-gray-900 border-gray-800 text-white" /></Field>
                <Field label="Capacity"><Input type="number" value={editing.capacity ?? ""} onChange={(e) => setEditing({ ...editing, capacity: e.target.value ? parseInt(e.target.value) : null })} className="bg-gray-900 border-gray-800 text-white" /></Field>
              </div>
              <Field label="Status">
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full bg-gray-900 border border-gray-800 rounded-md h-10 px-3 text-sm">
                  {["candidate", "outreach", "confirmed", "rejected"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Photos (one URL per line)">
                <Textarea
                  value={(editing.images && editing.images.length ? editing.images : (editing.imageUrl ? [editing.imageUrl] : [])).join("\n")}
                  onChange={(e) => { const arr = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean); setEditing({ ...editing, images: arr, imageUrl: arr[0] || null }); }}
                  rows={4}
                  placeholder="Paste image links, one per line (venue site / Google photo)"
                  className="bg-gray-900 border-gray-800 text-white font-mono text-xs"
                />
              </Field>
              {(editing.images && editing.images.length > 0) && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {editing.images.map((u, k) => (
                    <img key={k} src={u} referrerPolicy="no-referrer" className="w-20 h-16 object-cover rounded-md border border-gray-800 shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }} />
                  ))}
                </div>
              )}
              <Field label="Address / map URL"><Input value={editing.mapUrl || ""} onChange={(e) => setEditing({ ...editing, mapUrl: e.target.value })} placeholder="https://maps.google.com/…" className="bg-gray-900 border-gray-800 text-white" /></Field>
              <Field label="Notes"><Textarea value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={3} className="bg-gray-900 border-gray-800 text-white" /></Field>
              <Button onClick={() => save.mutate(editing)} disabled={!editing.name || save.isPending} className="w-full bg-[#D4AF37] text-black hover:bg-[#C4A030] font-bold">{save.isPending ? "Saving…" : "Save"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-gray-400 mb-1 block">{label}</label>{children}</div>;
}

function VenueCarousel({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  if (!images.length) {
    return (
      <div className="w-full h-52 rounded-lg mb-3 bg-gray-900/60 border border-dashed border-gray-800 flex items-center justify-center">
        <span className="text-[11px] text-gray-600">No photo — add one below</span>
      </div>
    );
  }
  const idx = ((i % images.length) + images.length) % images.length;
  return (
    <div className="relative w-full h-52 rounded-lg mb-3 overflow-hidden bg-gray-900">
      <img src={images[idx]} alt={name} referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setI(idx - 1); }} className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setI(idx + 1); }} className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="absolute top-1.5 right-1.5 text-[10px] bg-black/55 text-white rounded-full px-1.5 py-0.5">{idx + 1}/{images.length}</span>
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
            {images.map((_, k) => <span key={k} className={`w-1.5 h-1.5 rounded-full ${k === idx ? "bg-white" : "bg-white/40"}`} />)}
          </div>
        </>
      )}
    </div>
  );
}
