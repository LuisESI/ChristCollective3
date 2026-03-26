import { useState, useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { isNativeApp } from "@/lib/platform";
import logoPath from "@assets/db059a4689b94fbb9a3d0a81e9ae8f52-32bits-32_1750620933253.png";

const APP_STORE_URL = "https://apps.apple.com/app/id6758560029";
const DISMISSED_KEY = "app_banner_dismissed";

export default function AppInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on mobile web browsers, not inside the native app
    if (isNativeApp()) return;

    const isMobileBrowser = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobileBrowser) return;

    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] pb-safe px-3 py-3 pointer-events-none">
      <div className="pointer-events-auto glass-dark border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl max-w-lg mx-auto">
        {/* App icon */}
        <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src="/favicon.png" alt="Christ Collective" className="w-10 h-10 object-contain" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight">Christ Collective</p>
          <p className="text-gray-400 text-xs mt-0.5">Get the full experience on iOS</p>
        </div>

        {/* CTA */}
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 bg-[#D4AF37] text-black text-xs font-bold px-4 py-2 rounded-full"
        >
          Download
        </a>

        {/* Dismiss */}
        <button onClick={dismiss} className="flex-shrink-0 text-gray-500 hover:text-white p-1">
          <X size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
