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
  { id: "sun", dow: "SUN", d: "10", title: "Sunday afternoon", sub: "Aug 10 · 3:00 PM · Mid-City" },
  { id: "tue", dow: "TUE", d: "12", title: "Tuesday evening", sub: "Aug 12 · 6:30 PM · Westside" },
];

// `img` loads from /assets/activities/*.jpg; falls back to the gradient if missing.
const ACTIVITIES = [
  { id: "coffee", label: "Coffee", emoji: "☕", img: "/assets/activities/coffee.jpg", grad: "from-amber-700 to-amber-950" },
  { id: "hiking", label: "Hiking", emoji: "⛰️", img: "/assets/activities/hiking.jpg", grad: "from-emerald-700 to-emerald-950" },
  { id: "run", label: "Run", emoji: "🏃", img: "/assets/activities/run.jpg", grad: "from-rose-700 to-rose-950" },
  { id: "book", label: "Book", emoji: "📖", img: "/assets/activities/book.jpg", grad: "from-indigo-700 to-indigo-950" },
  { id: "open", label: "Open to anything", emoji: "✦", img: "/assets/activities/open.jpg", grad: "from-yellow-600 to-yellow-900" },
];

export default function MatchupsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0); // 0 = time, 1 = activity, 2 = thank you
  const [slot, setSlot] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: async () => apiRequest("/api/matchups/request", { method: "POST", data: { slot, activity } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setStep(2);
    },
    onError: () => toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" }),
  });

  const pct = Math.round((step / 2) * 100);

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-gray-900 flex flex-col">
      <Helmet><title>Your next Matchup — Christ Collective</title></Helmet>

      {/* progress + back */}
      <div className="px-5 pt-6 pb-2 max-w-md w-full mx-auto">
        {step > 0 && step < 2 ? (
          <button onClick={() => setStep((s) => s - 1)} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm mb-4">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <button onClick={() => navigate("/feed")} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm mb-4">
            <ChevronLeft className="w-4 h-4" /> {step === 2 ? "Home" : "Back"}
          </button>
        )}
        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full bg-[#D4AF37] transition-all duration-300" style={{ width: `${Math.max(6, pct)}%` }} />
        </div>
      </div>

      <div className="flex-1 px-5 py-6 pb-28 max-w-md w-full mx-auto">
        {/* STEP 1 — pick a time */}
        {step === 0 && (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">Pick a time</h1>
            <p className="text-gray-500 text-sm mb-6">
              We already have your profile — choose a time and we'll group you with ~7 compatible LA creatives.
            </p>
            <div className="space-y-2.5">
              {SLOTS.map((s) => {
                const on = slot === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSlot(s.id)}
                    className={cn(
                      "w-full flex items-center gap-3.5 text-left rounded-xl border p-3 transition-colors shadow-sm",
                      on ? "bg-[#D4AF37]/10 border-[#D4AF37]" : "bg-white border-gray-200 hover:border-[#D4AF37]/60",
                    )}
                  >
                    <div className="w-11 h-11 rounded-lg bg-gray-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-[#B8941F] tracking-wide">{s.dow}</span>
                      <span className="text-lg font-extrabold leading-none">{s.d}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{s.title}</p>
                      <p className="text-xs text-gray-500">{s.sub}</p>
                    </div>
                    <span className={cn("w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0", on ? "bg-[#D4AF37] border-[#D4AF37]" : "border-gray-300")}>
                      {on && <Check className="w-3 h-3 text-black" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* STEP 2 — pick an activity (picture cards) */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">Pick an activity</h1>
            <p className="text-gray-500 text-sm mb-6">What would you like to do with your circle?</p>
            <div className="grid grid-cols-2 gap-3">
              {ACTIVITIES.map((a) => {
                const on = activity === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setActivity(a.id)}
                    className={cn(
                      "relative rounded-2xl overflow-hidden aspect-[4/3] border-2 transition-all shadow-sm",
                      on ? "border-[#D4AF37] scale-[0.98]" : "border-gray-200 hover:border-[#D4AF37]/50",
                    )}
                  >
                    <div className={cn("absolute inset-0 bg-gradient-to-br", a.grad)} />
                    <img
                      src={a.img}
                      alt={a.label}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2">
                      <span className="text-lg">{a.emoji}</span>
                      <span className="text-white font-bold text-sm">{a.label}</span>
                    </div>
                    {on && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center shadow">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* STEP 3 — thank you */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center pt-10">
            <div className="w-20 h-20 rounded-3xl bg-[#D4AF37] flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">Thank you!</h1>
            <p className="text-gray-600 text-[15px] leading-relaxed max-w-xs">
              We'll contact you soon to confirm your circle and the details of your meetup.
            </p>
            <Button onClick={() => navigate("/feed")} className="mt-8 h-12 px-8 bg-[#D4AF37] hover:bg-[#C4A030] text-black font-bold">
              Back to home
            </Button>
          </div>
        )}
      </div>

      {/* footer (hidden on thank-you) */}
      {step < 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-200 px-5 py-4">
          <div className="max-w-md mx-auto">
            {step === 0 ? (
              <Button
                onClick={() => setStep(1)}
                disabled={!slot}
                className="w-full h-12 bg-[#D4AF37] hover:bg-[#C4A030] text-black font-bold disabled:opacity-40"
              >
                {slot ? "Next" : "Pick a time"}
              </Button>
            ) : (
              <Button
                onClick={() => submit.mutate()}
                disabled={!activity || submit.isPending}
                className="w-full h-12 bg-[#D4AF37] hover:bg-[#C4A030] text-black font-bold disabled:opacity-40"
              >
                {submit.isPending ? "Confirming…" : activity ? "Confirm my spot" : "Pick an activity"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
