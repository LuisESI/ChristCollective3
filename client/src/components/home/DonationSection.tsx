import { Heart } from "lucide-react";
import donationBanner from "@assets/37b13fba-30b6-4eee-b6cf-85c1045fafa3_1773430362625.webp";

export default function DonationSection() {
  return (
    <section id="donate" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">Make a Difference</h2>
          <div className="w-16 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Support our community and help change lives through Christ. Every gift makes an impact.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-lg bg-black">
            <div className="relative w-full h-48 overflow-hidden">
              <img src={donationBanner} alt="Donate" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Heart className="w-14 h-14 text-[#D4AF37] drop-shadow-lg" strokeWidth={1.5} />
              </div>
            </div>
            <div className="p-6 text-center">
              <h4 className="text-xl font-bold text-white mb-2">Donate to Change Lives Through Christ</h4>
              <p className="text-gray-400 text-sm mb-6">
                100% of your donation goes directly to supporting our mission — powered by Zeffy with 0% platform fees.
              </p>
              <a
                href="https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-through-christ"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-[#D4AF37] text-black hover:bg-[#B8941F] h-11 px-6 transition-colors"
              >
                <Heart className="w-4 h-4" />
                Donate Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
