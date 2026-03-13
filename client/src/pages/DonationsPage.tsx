import { ExternalLink, Heart } from "lucide-react";
import { Helmet } from "react-helmet";
import donationBanner from "@assets/37b13fba-30b6-4eee-b6cf-85c1045fafa3_1773430362625.webp";

const ZEFFY_URL = "https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-through-christ";

export default function DonationsPage() {
  return (
    <>
      <Helmet>
        <title>Help fund our mission! - Christ Collective</title>
        <meta name="description" content="Help fund our mission to change lives through Christ. Make a donation through our secure giving portal." />
      </Helmet>

      <div className="min-h-screen bg-black flex flex-col items-center justify-start py-10 px-4">
        <div className="w-full max-w-lg">
          {/* Preview Card */}
          <div className="bg-[#0A0A0A] border border-[#D4AF37]/20 rounded-2xl overflow-hidden mb-6">
            {/* Preview image */}
            <img
              src={donationBanner}
              alt="Help fund our mission"
              className="w-full object-cover"
            />

            <div className="p-6">
              <h2 className="text-white font-semibold text-xl mb-2">Help fund our mission!</h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                100% of your donation goes directly to our mission. Zeffy charges zero platform fees, so every dollar you give counts.
              </p>

              {/* CTA Button */}
              <a
                href={ZEFFY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#D4AF37] hover:bg-[#C09B2A] text-black font-bold py-4 px-6 rounded-xl text-base transition-colors"
              >
                <Heart className="w-5 h-5" />
                Give Now
                <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
              </a>

              <p className="text-center text-gray-600 text-xs mt-4">
                You'll be taken to our secure giving page on Zeffy.com
              </p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "0% Fees", sub: "All to mission" },
              { label: "Secure", sub: "SSL encrypted" },
              { label: "Tax Receipt", sub: "Sent via email" },
            ].map((item) => (
              <div key={item.label} className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-3">
                <p className="text-[#D4AF37] font-bold text-sm">{item.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
