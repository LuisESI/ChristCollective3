import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft } from "lucide-react";
import { Helmet } from "react-helmet";

const DISCIPLINES = [
  "Founder", "Design + Illustration", "Music / Audio", "Writing", "Photography",
  "Film + Production", "Content Creation", "Fashion", "Worship + Ministry Arts",
  "Research", "Jack of all trades",
];
const INTERESTS = [
  "God", "Creating", "Coffee", "Helping people", "Books", "Hiking",
  "Running", "Worship", "Deep talks", "Community", "Sunrises",
];
const CITIES = ["Los Angeles", "New York", "San Francisco", "Chicago", "Seattle", "Austin", "Other"];
const GENDERS = ["Male", "Female", "Prefer not to say"];
const MATCH = [
  { v: "same_field", l: "People in the same or similar field" },
  { v: "different_fields", l: "People in different fields" },
  { v: "open", l: "Open to anyone!" },
];

type Form = {
  phone: string; smsOptIn: boolean; instagram: string; gender: string; birthdate: string;
  disciplines: string[]; interests: string[]; bio: string; creativeGoals: string;
  faithNote: string; city: string; matchPreference: string;
};

type Step = { id: keyof Form | "review"; title: string; optional?: boolean; valid: (f: Form) => boolean };

const STEPS: Step[] = [
  { id: "phone", title: "What's your phone number?", valid: (f) => f.phone.trim().length >= 7 && f.smsOptIn },
  { id: "instagram", title: "What's your Instagram or portfolio?", optional: true, valid: () => true },
  { id: "gender", title: "How do you identify?", valid: (f) => !!f.gender },
  { id: "birthdate", title: "When's your birthday?", valid: (f) => !!f.birthdate },
  { id: "disciplines", title: "What creative field(s) do you work in?", valid: (f) => f.disciplines.length > 0 },
  { id: "interests", title: "What do you love?", optional: true, valid: () => true },
  { id: "bio", title: "How would you describe your work?", valid: (f) => f.bio.trim().length > 0 },
  { id: "creativeGoals", title: "What are your creative goals or dreams?", optional: true, valid: () => true },
  { id: "faithNote", title: "Where are you in your faith?", optional: true, valid: () => true },
  { id: "city", title: "What city are you in?", valid: (f) => !!f.city },
  { id: "matchPreference", title: "Who do you want to meet?", valid: (f) => !!f.matchPreference },
  { id: "review", title: "You're all set!", valid: () => true },
];

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 rounded-full text-sm font-medium border transition-colors",
        on ? "bg-[#D4AF37] text-black border-transparent" : "bg-transparent border-gray-700 text-gray-300 hover:border-[#D4AF37]",
      )}
    >
      {label}
    </button>
  );
}

function OptionRow({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-3 text-left px-4 py-4 rounded-xl border transition-colors",
        on ? "bg-[#D4AF37]/10 border-[#D4AF37]" : "bg-[#0A0A0A] border-gray-800 hover:border-[#D4AF37]/50",
      )}
    >
      <span className="text-white text-[15px] font-medium">{label}</span>
      <span className={cn("w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0", on ? "bg-[#D4AF37] border-[#D4AF37]" : "border-gray-700")}>
        {on && <Check className="w-3 h-3 text-black" />}
      </span>
    </button>
  );
}

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({
    phone: "", smsOptIn: true, instagram: "", gender: "", birthdate: "",
    disciplines: [], interests: [], bio: "", creativeGoals: "", faithNote: "",
    city: "", matchPreference: "",
  });

  // Prefill phone if already on the account
  useEffect(() => {
    if (user?.phone) setForm((f) => (f.phone ? f : { ...f, phone: user.phone }));
  }, [user]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleArr = (k: "disciplines" | "interests", v: string) =>
    setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));

  const save = useMutation({
    mutationFn: async () => apiRequest("/api/user/onboarding", { method: "POST", data: form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Welcome to Christ Collective! ☕", description: "We'll text you when your first Matchup is ready." });
      navigate("/feed");
    },
    onError: () => toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" }),
  });

  const current = STEPS[step];
  const canAdvance = current.valid(form);
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) { save.mutate(); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const pct = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Helmet><title>Join Christ Collective</title></Helmet>

      {/* progress */}
      <div className="px-5 pt-6 pb-2">
        {step > 0 ? (
          <button onClick={back} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm mb-4">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : <div className="h-9" />}
        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div className="h-full bg-[#D4AF37] transition-all duration-300" style={{ width: `${Math.max(6, pct)}%` }} />
        </div>
      </div>

      <div className="flex-1 px-5 py-6 max-w-md w-full mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-extrabold tracking-tight">{current.title}</h1>
        </div>
        {current.optional && <span className="inline-block text-[11px] font-semibold text-gray-500 bg-gray-900 rounded-full px-3 py-0.5 mb-4">optional</span>}
        {!current.optional && <div className="mb-4" />}

        <div className="mt-2">
          {current.id === "phone" && (
            <>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(661) 349-3968" type="tel"
                className="bg-[#0A0A0A] border-gray-800 text-white h-12" />
              <label className="flex items-start gap-3 mt-4 p-3 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/[0.04] cursor-pointer"
                onClick={() => set("smsOptIn", !form.smsOptIn)}>
                <span className={cn("w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5", form.smsOptIn ? "bg-[#D4AF37] border-[#D4AF37]" : "border-gray-600")}>
                  {form.smsOptIn && <Check className="w-3 h-3 text-black" />}
                </span>
                <span className="text-xs text-gray-400 leading-relaxed">
                  I opt in to receive SMS about group pairings, invitations, and member events (~4–6/cycle). Reply STOP to cancel.
                </span>
              </label>
            </>
          )}

          {current.id === "instagram" && (
            <Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@handle or a link to your work"
              className="bg-[#0A0A0A] border-gray-800 text-white h-12" />
          )}

          {current.id === "gender" && (
            <div className="space-y-3">
              {GENDERS.map((g) => <OptionRow key={g} label={g} on={form.gender === g} onClick={() => set("gender", g)} />)}
            </div>
          )}

          {current.id === "birthdate" && (
            <Input value={form.birthdate} onChange={(e) => set("birthdate", e.target.value)} type="date"
              className="bg-[#0A0A0A] border-gray-800 text-white h-12" />
          )}

          {current.id === "disciplines" && (
            <div className="flex flex-wrap gap-2.5">
              {DISCIPLINES.map((d) => <Chip key={d} label={d} on={form.disciplines.includes(d)} onClick={() => toggleArr("disciplines", d)} />)}
            </div>
          )}

          {current.id === "interests" && (
            <div className="flex flex-wrap gap-2.5">
              {INTERESTS.map((d) => <Chip key={d} label={d} on={form.interests.includes(d)} onClick={() => toggleArr("interests", d)} />)}
            </div>
          )}

          {current.id === "bio" && (
            <Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Imagine you just met someone — what would you tell them?"
              className="bg-[#0A0A0A] border-gray-800 text-white min-h-[120px]" />
          )}

          {current.id === "creativeGoals" && (
            <Textarea value={form.creativeGoals} onChange={(e) => set("creativeGoals", e.target.value)} placeholder="Where you'd like to go with your work"
              className="bg-[#0A0A0A] border-gray-800 text-white min-h-[120px]" />
          )}

          {current.id === "faithNote" && (
            <Textarea value={form.faithNote} onChange={(e) => set("faithNote", e.target.value)} placeholder="Your faith journey, church, or denomination — as much or as little as you like"
              className="bg-[#0A0A0A] border-gray-800 text-white min-h-[120px]" />
          )}

          {current.id === "city" && (
            <div className="space-y-3">
              {CITIES.map((c) => (
                <OptionRow key={c} label={c === "Los Angeles" ? "Los Angeles · live now" : c} on={form.city === c} onClick={() => set("city", c)} />
              ))}
              <p className="text-xs text-gray-500 pt-1">Matchups are live in LA — more cities coming soon.</p>
            </div>
          )}

          {current.id === "matchPreference" && (
            <div className="space-y-3">
              {MATCH.map((m) => <OptionRow key={m.v} label={m.l} on={form.matchPreference === m.v} onClick={() => set("matchPreference", m.v)} />)}
            </div>
          )}

          {current.id === "review" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37] mx-auto mb-4 flex items-center justify-center">
                <Check className="w-8 h-8 text-black" />
              </div>
              <p className="text-gray-300 text-[15px] leading-relaxed">
                That's everything. Tap below and you're in — we'll match you with a circle of LA creatives every two weeks.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* footer */}
      <div className="sticky bottom-0 bg-black/90 backdrop-blur border-t border-gray-900 px-5 py-4">
        <div className="max-w-md mx-auto">
          <Button
            onClick={next}
            disabled={(!canAdvance && !current.optional) || save.isPending}
            className="w-full h-12 bg-[#D4AF37] hover:bg-[#C4A030] text-black font-bold disabled:opacity-40"
          >
            {save.isPending ? "Finishing…" : isLast ? "Enter Christ Collective" : current.optional && !canAdvanceHasValue(current, form) ? "Skip" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Show "Skip" only when an optional step has no value entered yet.
function canAdvanceHasValue(step: Step, f: Form): boolean {
  const v = f[step.id as keyof Form];
  if (Array.isArray(v)) return v.length > 0;
  return typeof v === "string" ? v.trim().length > 0 : !!v;
}
