import { House, Compass, Plus, UsersThree, User, PencilSimple, CalendarBlank, X } from "@phosphor-icons/react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// 4 tabs + a center action button. The Connect tab is now "Clubs".
const tabs = [
  { icon: House, label: "Feed", href: "/feed" },
  { icon: Compass, label: "Explore", href: "/explore" },
  { icon: UsersThree, label: "Clubs", href: "/connect" },
  { icon: User, label: "Profile", href: "/profile" },
];

// Center button label cycles between these two — one aspect at a time.
const CENTER_LABELS = ["Create", "Connect"];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [centerIdx, setCenterIdx] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Cycle the center label so members find both aspects (posting + connecting).
  useEffect(() => {
    const t = setInterval(() => setCenterIdx((i) => (i === 0 ? 1 : 0)), 2400);
    return () => clearInterval(t);
  }, []);

  const goTo = (href: string) => {
    setSheetOpen(false);
    setLocation(href);
  };

  const renderTab = (item: (typeof tabs)[number]) => {
    const isActive = location === item.href;
    const Icon = item.icon;
    return (
      <Link key={item.href} href={item.href} className="flex-1">
        <div
          className={cn(
            "flex flex-col items-center justify-center h-full px-2 py-1 transition-all duration-200 press-effect",
            isActive ? "text-[#D4AF37]" : "text-gray-500 hover:text-gray-300",
          )}
        >
          <Icon size={23} weight={isActive ? "fill" : "regular"} className="transition-transform duration-200" />
          <span
            className={cn(
              "text-[9px] mt-1 font-semibold tracking-wide uppercase transition-colors duration-200",
              isActive ? "text-[#D4AF37]" : "text-gray-500",
            )}
          >
            {item.label}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Create / Connect action sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => setSheetOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 glass-dark rounded-t-3xl border-t border-white/10 p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-slide-up">
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-white font-semibold text-base">Create or Connect</h3>
              <button onClick={() => setSheetOpen(false)} className="text-gray-400 hover:text-white" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => goTo("/create")}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.06] press-effect text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-[#D4AF37] flex items-center justify-center flex-shrink-0">
                  <PencilSimple size={20} weight="bold" color="black" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">New post</p>
                  <p className="text-gray-400 text-xs">Share your work with the community</p>
                </div>
              </button>
              <button
                onClick={() => goTo("/matchups")}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.06] press-effect text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
                  <CalendarBlank size={20} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Set up a meetup</p>
                  <p className="text-gray-400 text-xs">Pick a time &amp; connect with your circle</p>
                </div>
              </button>
              <button
                onClick={() => goTo("/connect")}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.06] press-effect text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
                  <UsersThree size={20} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Start a club</p>
                  <p className="text-gray-400 text-xs">Gather people around a shared interest</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="glass-dark border-t-0 mx-0">
          <div className="flex justify-around items-center h-16 px-1">
            {renderTab(tabs[0])}
            {renderTab(tabs[1])}

            {/* Center: cycling Create / Connect */}
            <button className="flex-1" onClick={() => setSheetOpen(true)} aria-label="Create or connect">
              <div className="flex flex-col items-center justify-center h-full px-2 py-1 press-effect">
                <div className="w-11 h-11 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 -mt-1">
                  <Plus size={20} weight="bold" color="black" />
                </div>
                <span
                  key={centerIdx}
                  className="text-[9px] mt-0.5 font-semibold text-[#D4AF37] tracking-wide uppercase animate-fade-in"
                >
                  {CENTER_LABELS[centerIdx]}
                </span>
              </div>
            </button>

            {renderTab(tabs[2])}
            {renderTab(tabs[3])}
          </div>
        </div>
      </nav>
    </>
  );
}
