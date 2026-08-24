import { useState } from "react";
import { useParams, useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/api-config";
import { Helmet } from "react-helmet";
import {
  ChevronLeft, Crown, Calendar, MapPin, Share2, Plus, Check, Users, Pencil,
  Coffee, Library, Mountain, Footprints, HeartHandshake, BookOpen, Music, Megaphone,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const INTENTIONS: Record<string, { label: string; icon: any }> = {
  coffee: { label: "Coffee Club", icon: Coffee },
  book: { label: "Book Club", icon: Library },
  hiking: { label: "Hiking Club", icon: Mountain },
  run: { label: "Run Club", icon: Footprints },
  fellowship: { label: "Fellowship", icon: Users },
  prayer: { label: "Prayer", icon: HeartHandshake },
  bible_study: { label: "Bible Study", icon: BookOpen },
  worship: { label: "Worship", icon: Music },
  evangelizing: { label: "Evangelizing", icon: Megaphone },
};

const FREQUENCIES = ["weekly", "biweekly", "monthly"];

function memberName(m: any): string {
  return m?.displayName || [m?.firstName, m?.lastName].filter(Boolean).join(" ") || m?.username || "Member";
}
function memberSubtitle(m: any): string {
  if (Array.isArray(m?.disciplines) && m.disciplines.length) return m.disciplines.slice(0, 2).join(", ");
  return m?.bio ? String(m.bio).slice(0, 40) : "";
}
function frequencyLabel(f?: string | null): string {
  if (!f) return "";
  const known = f.toLowerCase();
  if (known === "weekly") return "Meets weekly";
  if (known === "biweekly") return "Meets every two weeks";
  if (known === "monthly") return "Meets monthly";
  return `Meets ${f}`;
}
function fmtEventDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function ClubProfilePage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const [isQueueRoute] = useRoute("/club/queue/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const id = params.id;
  const kind = isQueueRoute ? "queue" : "chat";
  const endpoint = kind === "queue" ? `/api/group-chat-queues/${id}` : `/api/group-chats/${id}`;

  const [eventOpen, setEventOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const { data: club, isLoading } = useQuery<any>({ queryKey: [endpoint] });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [endpoint] });

  const joinMutation = useMutation({
    mutationFn: async () => apiRequest(`/api/group-chat-queues/${queueId}/join`, { method: "POST" }),
    onSuccess: () => { toast({ title: "You're in!", description: "We'll let you know when the club is ready." }); invalidate(); queryClient.invalidateQueries({ queryKey: ["/api/group-chat-queues"] }); },
    onError: () => toast({ title: "Couldn't join", description: "Please try again.", variant: "destructive" }),
  });
  const leaveMutation = useMutation({
    mutationFn: async () => apiRequest(`/api/group-chat-queues/${queueId}/leave`, { method: "POST" }),
    onSuccess: () => { toast({ title: "Left the club" }); invalidate(); },
    onError: () => toast({ title: "Couldn't leave", variant: "destructive" }),
  });
  const rsvpMutation = useMutation({
    mutationFn: async (eventId: number) => apiRequest(`/api/club-events/${eventId}/rsvp`, { method: "POST", data: { status: "going" } }),
    onSuccess: () => { toast({ title: "You're going 🎉" }); invalidate(); },
    onError: () => toast({ title: "Couldn't RSVP", variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" /></div>;
  }
  if (!club || club.message) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-bold mb-2">Club not found</h1>
        <p className="text-gray-400 mb-6 text-sm">This club may have been cancelled or moved.</p>
        <Button onClick={() => navigate("/connect")} className="bg-[#D4AF37] text-black hover:bg-[#C4A030]">Back to Clubs</Button>
      </div>
    );
  }

  const queueId = kind === "queue" ? club.id : club.queueId;
  const intent = INTENTIONS[club.intention] || { label: club.intention, icon: Users };
  const IntentIcon = intent.icon;
  const memberCount = club.memberCount ?? club.currentCount ?? (club.members?.length || 0);
  const maxPeople = club.maxPeople;
  const spotsLeft = typeof maxPeople === "number" ? Math.max(0, maxPeople - memberCount) : null;
  const isCreator = !!club.isCreator;
  const isMember = !!club.isMember;
  const events: any[] = Array.isArray(club.events) ? club.events : [];
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.eventDate).getTime() >= now).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  const past = events.filter((e) => new Date(e.eventDate).getTime() < now).sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: club.title, url });
      else { await navigator.clipboard.writeText(url); toast({ title: "Link copied" }); }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      <Helmet><title>{club.title} - Christ Collective</title></Helmet>

      {/* ── Hero ── */}
      <div className="relative h-[42vh] min-h-[300px] w-full overflow-hidden">
        {club.bannerImage ? (
          <img src={getImageUrl(club.bannerImage)} alt={club.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/40 via-gray-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        <button onClick={() => navigate("/connect")} className="absolute top-5 left-4 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <h1 className="text-[34px] leading-[1.05] font-extrabold tracking-tight text-white drop-shadow">{club.title}</h1>
          <div className="flex items-center gap-1.5 mt-1.5 text-gray-200">
            <span className="text-sm">Only for</span>
            <IntentIcon className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-semibold">{intent.label}</span>
          </div>
        </div>
      </div>

      <div className="px-5">
        {/* ── Meta rows ── */}
        <div className="space-y-3 mt-5">
          {club.host && (
            <button
              onClick={() => club.host.username && navigate(`/profile/${club.host.username}`)}
              className="flex items-center gap-3 text-left"
            >
              <Crown className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <span className="text-gray-400 text-[15px]">Hosted by</span>
              <Avatar className="w-6 h-6"><AvatarImage src={getImageUrl(club.host.profileImageUrl)} /><AvatarFallback className="bg-gray-800 text-[10px]">{memberName(club.host)[0]}</AvatarFallback></Avatar>
              <span className="text-white font-semibold text-[15px]">{memberName(club.host)}</span>
            </button>
          )}
          {club.meetingFrequency && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <span className="text-white text-[15px]">{frequencyLabel(club.meetingFrequency)}</span>
            </div>
          )}
          {club.location && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <span className="text-white text-[15px]">{club.location}</span>
            </div>
          )}
        </div>

        {/* ── Host tools ── */}
        {isCreator && (
          <div className="flex gap-2 mt-4">
            <button onClick={() => setDetailsOpen(true)} className="flex items-center gap-1.5 text-xs font-medium text-gray-300 border border-gray-700 rounded-full px-3 py-1.5 hover:border-[#D4AF37]">
              <Pencil className="w-3.5 h-3.5" /> Edit details
            </button>
            <button onClick={() => setEventOpen(true)} className="flex items-center gap-1.5 text-xs font-medium text-black bg-[#D4AF37] rounded-full px-3 py-1.5 hover:bg-[#C4A030]">
              <Plus className="w-3.5 h-3.5" /> Add event
            </button>
          </div>
        )}

        {/* ── Members ── */}
        {Array.isArray(club.members) && club.members.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">The Members</h2>
              {club.members.length > 3 && (
                <button onClick={() => setMembersOpen(true)} className="text-sm text-[#D4AF37] flex items-center gap-1">See all <ChevronLeft className="w-4 h-4 rotate-180" /></button>
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
              {club.members.map((m: any) => (
                <button key={m.id} onClick={() => m.username && navigate(`/profile/${m.username}`)} className="flex flex-col items-center w-[110px] shrink-0">
                  <div className="relative">
                    <Avatar className="w-[92px] h-[92px] border border-gray-800">
                      <AvatarImage src={getImageUrl(m.profileImageUrl)} className="object-cover" />
                      <AvatarFallback className="bg-gray-800 text-white text-2xl">{memberName(m)[0]}</AvatarFallback>
                    </Avatar>
                    {m.role === "creator" && (
                      <span className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center border-2 border-black">
                        <Crown className="w-3 h-3 text-black" />
                      </span>
                    )}
                  </div>
                  <span className="text-white font-semibold text-sm mt-2 text-center truncate w-full">{memberName(m)}</span>
                  {memberSubtitle(m) && <span className="text-gray-500 text-xs text-center leading-tight line-clamp-2">{memberSubtitle(m)}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── The Details ── */}
        {club.description && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-2">The Details</h2>
            <p className="text-gray-300 text-[15px] leading-relaxed whitespace-pre-line">{club.description}</p>
          </div>
        )}

        {/* ── Events ── */}
        {upcoming.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-3">Upcoming</h2>
            <div className="space-y-4">{upcoming.map((e) => <EventCard key={e.id} e={e} isPast={false} onRsvp={() => rsvpMutation.mutate(e.id)} rsvpPending={rsvpMutation.isPending} />)}</div>
          </div>
        )}
        {past.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-3">{past.length > 1 ? "Past Meetups" : "Past Kickoff"}</h2>
            <div className="space-y-4">{past.map((e) => <EventCard key={e.id} e={e} isPast onRsvp={() => {}} rsvpPending={false} />)}</div>
          </div>
        )}
        {events.length === 0 && isCreator && (
          <div className="mt-8 rounded-xl border border-dashed border-gray-800 p-6 text-center">
            <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm mb-3">No events yet. Add your club's first kickoff.</p>
            <Button onClick={() => setEventOpen(true)} className="bg-[#D4AF37] text-black hover:bg-[#C4A030] h-9"><Plus className="w-4 h-4 mr-1.5" /> Add event</Button>
          </div>
        )}
      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur border-t border-gray-900 px-5 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="text-white font-bold text-sm leading-tight">
            {spotsLeft !== null ? (spotsLeft > 0 ? "Limited Spots" : "Club Full") : `${memberCount} member${memberCount === 1 ? "" : "s"}`}
            {spotsLeft !== null && spotsLeft > 0 && <div className="text-gray-500 text-xs font-normal">{spotsLeft} left</div>}
          </div>
          <button onClick={handleShare} className="ml-auto w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5 text-black" />
          </button>
          {kind === "chat" && isMember ? (
            <Button onClick={() => navigate(`/chat/${club.id}`)} className="h-12 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F5E6A3] text-black font-bold hover:opacity-90">Club chat</Button>
          ) : isMember ? (
            <Button onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending} variant="outline" className="h-12 px-6 rounded-xl border-gray-700 text-white font-bold">{leaveMutation.isPending ? "…" : "Leave"}</Button>
          ) : kind === "queue" ? (
            <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending || (spotsLeft !== null && spotsLeft <= 0)} className="h-12 px-6 rounded-xl border border-[#D4AF37] bg-black text-white font-bold hover:bg-[#D4AF37]/10">{joinMutation.isPending ? "…" : "JOIN 👉"}</Button>
          ) : (
            <Button disabled className="h-12 px-6 rounded-xl bg-gray-800 text-gray-400 font-bold">Members only</Button>
          )}
        </div>
      </div>

      {/* ── All members dialog ── */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="bg-[#0A0A0A] border-gray-800 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Members</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(club.members || []).map((m: any) => (
              <button key={m.id} onClick={() => { setMembersOpen(false); m.username && navigate(`/profile/${m.username}`); }} className="w-full flex items-center gap-3 text-left">
                <Avatar className="w-11 h-11"><AvatarImage src={getImageUrl(m.profileImageUrl)} /><AvatarFallback className="bg-gray-800">{memberName(m)[0]}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5"><span className="font-semibold text-sm truncate">{memberName(m)}</span>{m.role === "creator" && <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />}</div>
                  {memberSubtitle(m) && <p className="text-gray-500 text-xs truncate">{memberSubtitle(m)}</p>}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {isCreator && <AddEventDialog open={eventOpen} onOpenChange={setEventOpen} queueId={queueId} onSaved={invalidate} />}
      {isCreator && <EditDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} queueId={queueId} club={club} onSaved={invalidate} />}
    </div>
  );
}

function EventCard({ e, isPast, onRsvp, rsvpPending }: { e: any; isPast: boolean; onRsvp: () => void; rsvpPending: boolean }) {
  const attendees: any[] = Array.isArray(e.attendees) ? e.attendees : [];
  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-900">
      <div className="relative h-56 w-full">
        {e.coverImage ? (
          <img src={getImageUrl(e.coverImage)} alt={e.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/30 via-gray-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <span className={`absolute top-3 right-3 text-xs font-semibold rounded-full px-3 py-1 ${isPast ? "bg-black/70 text-[#D4AF37]" : "bg-[#D4AF37] text-black"}`}>{isPast ? "Past" : "Upcoming"}</span>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-gray-200 text-sm font-medium">{fmtEventDate(e.eventDate)}</p>
          <h3 className="text-2xl font-bold text-white leading-tight">{e.title}</h3>
          {e.location && <p className="text-gray-300 text-xs mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</p>}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex -space-x-2">
              {attendees.slice(0, 4).map((a) => (
                <Avatar key={a.id} className="w-7 h-7 border-2 border-black"><AvatarImage src={getImageUrl(a.profileImageUrl)} /><AvatarFallback className="bg-gray-700 text-[10px]">{(a.displayName || a.firstName || a.username || "?")[0]}</AvatarFallback></Avatar>
              ))}
              {attendees.length > 4 && <span className="w-7 h-7 rounded-full bg-gray-800 border-2 border-black flex items-center justify-center text-[10px] text-white">+{attendees.length - 4}</span>}
            </div>
            {!isPast && (
              <button onClick={onRsvp} disabled={rsvpPending} className="ml-auto text-xs font-semibold bg-white text-black rounded-full px-3 py-1.5">{rsvpPending ? "…" : "I'm going"}</button>
            )}
          </div>
        </div>
      </div>
      {e.description && <p className="text-gray-300 text-sm p-4 leading-relaxed">{e.description}</p>}
    </div>
  );
}

function AddEventDialog({ open, onOpenChange, queueId, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; queueId: number; onSaved: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("Club Kickoff");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const save = useMutation({
    mutationFn: async () => apiRequest(`/api/clubs/${queueId}/events`, { method: "POST", data: { title, eventDate: new Date(date).toISOString(), location, description } }),
    onSuccess: () => { toast({ title: "Event added" }); onOpenChange(false); setDate(""); setLocation(""); setDescription(""); onSaved(); },
    onError: () => toast({ title: "Couldn't add event", description: "Check the date and try again.", variant: "destructive" }),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A] border-gray-800 text-white">
        <DialogHeader><DialogTitle>Add an event</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-xs text-gray-400">Title</label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-gray-900 border-gray-800 text-white mt-1" /></div>
          <div><label className="text-xs text-gray-400">Date & time</label><Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="bg-gray-900 border-gray-800 text-white mt-1" /></div>
          <div><label className="text-xs text-gray-400">Location</label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Blue Bottle, Arts District" className="bg-gray-900 border-gray-800 text-white mt-1" /></div>
          <div><label className="text-xs text-gray-400">Description</label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-gray-900 border-gray-800 text-white mt-1" rows={3} /></div>
          <Button onClick={() => save.mutate()} disabled={!title.trim() || !date || save.isPending} className="w-full bg-[#D4AF37] text-black hover:bg-[#C4A030] font-bold">{save.isPending ? "Saving…" : "Add event"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditDetailsDialog({ open, onOpenChange, queueId, club, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; queueId: number; club: any; onSaved: () => void }) {
  const { toast } = useToast();
  const [location, setLocation] = useState(club.location || "");
  const [frequency, setFrequency] = useState(club.meetingFrequency || "");
  const [description, setDescription] = useState(club.description || "");
  const save = useMutation({
    mutationFn: async () => apiRequest(`/api/group-chat-queues/${queueId}/details`, { method: "PATCH", data: { location, meetingFrequency: frequency, description } }),
    onSuccess: () => { toast({ title: "Club updated" }); onOpenChange(false); onSaved(); },
    onError: () => toast({ title: "Couldn't update", variant: "destructive" }),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A] border-gray-800 text-white">
        <DialogHeader><DialogTitle>Edit club details</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-xs text-gray-400">Location</label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Los Angeles, CA" className="bg-gray-900 border-gray-800 text-white mt-1" /></div>
          <div>
            <label className="text-xs text-gray-400">How often do you meet?</label>
            <div className="flex gap-2 mt-1">
              {FREQUENCIES.map((f) => (
                <button key={f} onClick={() => setFrequency(f)} className={`flex-1 rounded-lg py-2 text-sm capitalize border ${frequency === f ? "bg-[#D4AF37] text-black border-transparent" : "bg-gray-900 border-gray-800 text-gray-300"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div><label className="text-xs text-gray-400">Description</label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-gray-900 border-gray-800 text-white mt-1" rows={4} /></div>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full bg-[#D4AF37] text-black hover:bg-[#C4A030] font-bold">{save.isPending ? "Saving…" : "Save"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
