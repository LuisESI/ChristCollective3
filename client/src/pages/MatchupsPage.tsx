import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ChevronLeft, Check } from "lucide-react";
import { Helmet } from "react-helmet";

const SLOTS = [
  { id: "sat", dow: "SAT", d: "09", title: "Saturday afternoon", sub: "Aug 9 · 4:00 PM · Eastside" },
  { id: "sun", dow: "SUN", d: "10", title: "Sunday coffee", sub: "Aug 10 · 3:00 PM · Mid-City" },
  { id: "tue", dow: "TUE", d: "12", title: "Tuesday evening", sub: "Aug 12 · 6:30 PM · Westside" },
];
const ACTIVITIES = [
  { id: "coffee", emoji: "☕", label: "Coffee" },
  { id: "hiking", emoji: "⛰️", label: "Hiking" },
  { id: "run", emoji: "🏃", label: "Run" },
  { id: "book", emoji: "📖", label: "Book" },
  { id: "open", emoji: "✦", label: "Open to anything" },
];

export default function MatchupsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [slot, setSlot] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: async () => apiRequest("/api/matchups/request", { method: "POST", data: { slot, activity } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "You're in the next Matchup! ☕", description: "We'll text you when your circle is ready." });
      navigate("/feed");
    },
    onError: () => toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" }),
  });

  const ready = !!slot && !!activity;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <Helmet><title>Your next Matchup — Christ Collective</title></Helmet>

      <div className="container mx-auto px-5 py-6 max-w-md">
        <button onClick={() => navigate("/feed")} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Your next Matchup</h1>
        <p className="text-gray-400 text-sm mb-6">
          We already have your profile — just pick a time and what you'd like to do. We'll group you with ~7 compatible LA creatives.
        </p>

        {/* how it works */}
        <div className="flex items-center justify-between gap-2 bg-[#0A0A0A] border border-gray-800 rounded-xl p-3 mb-6 text-xs text-gray-400 font-medium">
          <span className="flex items-center gap-1.5"><i className="w-5 h-5 rounded-full bg-gray-800 text-[#D4AF37] not-italic font-bold flex items-center justify-center text-[11px]">1</i>Pick a time</span>
          <span className="flex items-center gap-1.5"><i className="w-5 h-5 rounded-full bg-gray-800 text-[#D4AF37] not-italic font-bold flex items-center justify-center text-[11px]">2</i>Pick an activity</span>
          <span className="flex items-center gap-1.5"><i className="w-5 h-5 rounded-full bg-gray-800 text-[#D4AF37] not-italic font-bold flex items-center justify-center text-[11px]">3</i>Get matched</span>
        </div>

        {/* time */}
        <p className="text-[11px] font-bold tracking-widest uppercase text-[#D4AF37] mb-3">Pick a time</p>
        <div className="space-y-2.5 mb-7">
          {SLOTS.map((s) => {
            const on = slot === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSlot(s.id)}
                className={cn(
                  "w-full flex items-center gap-3.5 text-left rounded-xl border p-3 transition-colors",
                  on ? "bg-[#D4AF37]/10 border-[#D4AF37]" : "bg-[#0A0A0A] border-gray-800 hover:border-[#D4AF37]/50",
                )}
              >
                <div className="w-11 h-11 rounded-lg bg-gray-900 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-[#D4AF37] tracking-wide">{s.dow}</span>
                  <span className="text-lg font-extrabold leading-none">{s.d}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{s.title}</p>
                  <p className="text-xs text-gray-400">{s.sub}</p>
                </div>
                <span className={cn("w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0", on ? "bg-[#D4AF37] border-[#D4AF37]" : "border-gray-700")}>
                  {on && <Check className="w-3 h-3 text-black" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* activity */}
        <p className="text-[11px] font-bold tracking-widest uppercase text-[#D4AF37] mb-3">Pick an activity</p>
        <div className="flex flex-wrap gap-2.5">
          {ACTIVITIES.map((a) => {
            const on = activity === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setActivity(a.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors",
                  on ? "bg-[#D4AF37]/10 border-[#D4AF37]" : "bg-[#0A0A0A] border-gray-800 hover:border-[#D4AF37]/50",
                )}
              >
                <span className="text-base">{a.emoji}</span>
                <span className="text-white">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur border-t border-gray-900 px-5 py-4">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => submit.mutate()}
            disabled={!ready || submit.isPending}
            className="w-full h-12 bg-[#D4AF37] hover:bg-[#C4A030] text-black font-bold disabled:opacity-40"
          >
            {submit.isPending ? "Confirming…" : ready ? "Confirm my spot" : "Pick a time & activity"}
          </Button>
        </div>
      </div>
    </div>
  );
}
