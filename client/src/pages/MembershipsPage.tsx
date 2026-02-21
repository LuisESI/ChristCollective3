import { useLocation } from "wouter";
import { Check, Globe, HeartHandshake, Sparkles, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/useAuth";

const tiers = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Access to Christ Collective App",
    benefits: [
      "Connect with other christians",
      "Explore communities near you",
      "RSVP for public events",
      "Post content on Christ Collective",
      "Exclusive access to pre-released CC content"
    ],
    icon: <Globe className="w-7 h-7 text-gray-400" />,
    buttonText: "Get Started",
    paid: false
  },
  {
    id: "collective",
    name: "The Collective",
    price: "$30",
    period: "/month",
    description: "Private community & member directory",
    benefits: [
      "Access to the Christ Collective private community & member directory",
      "Weekly team leader program calls",
      "Bi-weekly networking calls",
      "Spiritual counsel access",
      "Public outreach & ministry events",
      "Private member events — standard access",
      "Shared resource library & newsletter"
    ],
    icon: <HeartHandshake className="w-7 h-7 text-[#D4AF37]" />,
    buttonText: "Join The Collective",
    paid: true,
    popular: true,
    emoji: "🕊️"
  },
  {
    id: "guild",
    name: "The Guild",
    price: "$60",
    period: "/month",
    description: "Everything in The Collective plus more",
    benefits: [
      "Everything in The Collective",
      "Priority access to private events — first to register, reserved spots, front-row seat",
      "Early access to programs & collabs",
      "Pitch & co-lead collective projects",
      "Private member events — priority access",
      "Featured Guild member recognition"
    ],
    icon: <Crown className="w-7 h-7 text-[#D4AF37]" />,
    buttonText: "Join The Guild",
    paid: true,
    elite: true,
    emoji: "✨"
  }
];

export default function MembershipsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleSelectTier = (tierId: string) => {
    if (tierId === "free") {
      setLocation("/auth");
    } else {
      if (!user) {
        setLocation(`/auth?redirect=/membership/checkout/${tierId}`);
      } else {
        setLocation(`/membership/checkout/${tierId}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <Helmet>
        <title>Membership Tiers | Christ Collective</title>
        <meta name="description" content="Join the Christ Collective membership - connect, grow, and serve with fellow Christians worldwide." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <Badge className="bg-[#D4AF37] text-black mb-4 text-xs tracking-widest">MEMBERSHIPS</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Unite with the <span className="text-[#D4AF37]">Collective</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Choose the tier that best fits your journey and help us build a global community of faith.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto items-stretch">
          {tiers.map((tier) => {
            const isPaid = tier.paid;
            const isElite = (tier as any).elite;
            const isPopular = (tier as any).popular;

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl flex flex-col h-full transition-all duration-300 ${
                  isElite
                    ? "bg-gradient-to-b from-[#D4AF37]/20 via-[#0A0A0A] to-[#0A0A0A] border-2 border-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.15)]"
                    : isPopular
                    ? "bg-gradient-to-b from-[#D4AF37]/10 via-[#0A0A0A] to-[#0A0A0A] border-2 border-[#D4AF37]/60 shadow-[0_0_25px_rgba(212,175,55,0.1)]"
                    : "bg-[#0A0A0A] border border-gray-800 hover:border-gray-700"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-[#D4AF37] text-black px-5 py-1.5 text-xs font-bold tracking-wider shadow-lg">
                      MOST POPULAR
                    </Badge>
                  </div>
                )}
                {isElite && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-[#D4AF37] to-[#F5E6A3] text-black px-5 py-1.5 text-xs font-bold tracking-wider shadow-lg">
                      PREMIUM
                    </Badge>
                  </div>
                )}

                <div className="p-6 pt-8 text-center">
                  <div className={`inline-flex p-4 rounded-2xl mb-4 ${
                    isPaid 
                      ? "bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/30" 
                      : "bg-gray-900/50"
                  }`}>
                    {tier.icon}
                  </div>

                  <h3 className="text-2xl font-bold flex items-center justify-center gap-2 mb-1">
                    {tier.emoji && <span>{tier.emoji}</span>}
                    <span className={isPaid ? "text-[#D4AF37]" : "text-white"}>{tier.name}</span>
                  </h3>
                  
                  <div className="mt-3 flex items-baseline justify-center">
                    <span className={`text-5xl font-extrabold ${isPaid ? "text-[#D4AF37]" : "text-white"}`}>
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-gray-500 ml-1 text-lg">{tier.period}</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-2">{tier.description}</p>
                </div>

                <div className="px-6 flex-grow">
                  <Separator className={isPaid ? "bg-[#D4AF37]/20" : "bg-gray-800"} />
                  <ul className="space-y-3.5 py-6">
                    {tier.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <div className={`mt-0.5 rounded-full p-0.5 flex-shrink-0 ${
                          isPaid ? "bg-[#D4AF37]/20" : "bg-gray-700"
                        }`}>
                          <Check className={`w-3.5 h-3.5 ${isPaid ? "text-[#D4AF37]" : "text-gray-400"}`} />
                        </div>
                        <span className={`leading-tight ${isPaid ? "text-gray-200" : "text-gray-400"}`}>
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 pt-2">
                  <Button
                    className={`w-full py-6 text-base font-bold transition-all ${
                      isElite
                        ? "bg-gradient-to-r from-[#D4AF37] to-[#F5E6A3] hover:from-[#C4A030] hover:to-[#E5D693] text-black shadow-lg shadow-[#D4AF37]/20"
                        : isPopular
                        ? "bg-[#D4AF37] hover:bg-[#C4A030] text-black shadow-md"
                        : "bg-transparent border-2 border-gray-700 hover:border-[#D4AF37] text-white hover:bg-[#D4AF37]/10"
                    }`}
                    onClick={() => handleSelectTier(tier.id)}
                  >
                    {tier.buttonText}
                    {isPaid && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                  {isPaid && (
                    <p className="text-center text-gray-600 text-xs mt-3">
                      Cancel anytime. Secure payment via Stripe.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-20 text-center max-w-3xl mx-auto bg-[#0A0A0A] p-8 rounded-2xl border border-gray-800">
          <h2 className="text-2xl font-bold mb-4">Need help choosing?</h2>
          <p className="text-gray-400 mb-6">
            Our team is here to help you find the right membership for your spiritual and professional growth.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" className="border-gray-800 text-white" onClick={() => setLocation("/about")}>
              Learn More About Us
            </Button>
            <Button variant="ghost" className="text-[#D4AF37]" onClick={() => window.location.href = "mailto:support@christcollective.app"}>
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
