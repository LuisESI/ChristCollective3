import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Heart, ExternalLink } from "lucide-react";

const ZEFFY_URL = "https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-through-christ";

export default function DonationCheckoutPage() {
  useEffect(() => {
    window.open(ZEFFY_URL, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <>
      <Helmet>
        <title>Donate - Christ Collective</title>
      </Helmet>
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mb-6">
          <Heart className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Opening Donation Page</h1>
        <p className="text-gray-400 mb-6 max-w-xs">
          You're being redirected to our secure giving page on Zeffy — 0% platform fees.
        </p>
        <a
          href={ZEFFY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C09B2A] text-black font-bold py-3 px-8 rounded-xl text-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open Donation Page
        </a>
      </div>
    </>
  );
}
