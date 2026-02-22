import { Link } from "wouter";
import { Check, Globe, HeartHandshake, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const tiers = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    description: "Access to Christ Collective App",
    benefits: [
      "Connect with other christians",
      "Explore communities near you",
      "RSVP for public events",
      "Post content on Christ Collective",
      "Exclusive access to pre-released CC content"
    ],
    icon: Globe,
    iconColor: "text-gray-400",
    buttonText: "Get Started",
    paid: false,
    popular: false,
    elite: false,
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
    icon: HeartHandshake,
    iconColor: "text-[#D4AF37]",
    buttonText: "Join The Collective",
    paid: true,
    popular: true,
    elite: false,
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
    icon: Crown,
    iconColor: "text-[#D4AF37]",
    buttonText: "Join The Guild",
    paid: true,
    popular: false,
    elite: true,
  }
];

export default function MembershipSection() {
  const { user } = useAuth();

  return (
    <section className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Become a Member</h2>
          <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-6"></div>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Join our community and unlock exclusive benefits designed to help you grow in faith, connect with fellow believers, and make a lasting impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`relative rounded-xl border p-6 flex flex-col transition-all duration-300 hover:scale-[1.02] ${
                  tier.popular
                    ? "border-[#D4AF37] bg-gradient-to-b from-[#D4AF37]/10 to-[#0A0A0A] shadow-lg shadow-[#D4AF37]/10"
                    : tier.elite
                    ? "border-[#D4AF37]/50 bg-[#0A0A0A]"
                    : "border-gray-700 bg-[#0A0A0A]"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#D4AF37] text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}
                {tier.elite && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#D4AF37] to-[#F5E6A3] text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                      Premium
                    </span>
                  </div>
                )}

                <div className="text-center mb-6 pt-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-800/50 mb-4">
                    <Icon className={`w-7 h-7 ${tier.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{tier.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                    {tier.period && (
                      <span className="text-gray-400 text-sm">{tier.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Link href={
                  tier.paid
                    ? user
                      ? `/membership/checkout/${tier.id}`
                      : `/auth?redirect=/membership/checkout/${tier.id}`
                    : user
                      ? "/feed"
                      : "/auth"
                }>
                  <Button
                    className={`w-full font-semibold ${
                      tier.popular
                        ? "bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black"
                        : tier.elite
                        ? "bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        : "bg-gray-800 hover:bg-gray-700 text-white"
                    }`}
                  >
                    {tier.buttonText}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/membership">
            <span className="text-[#D4AF37] hover:text-[#D4AF37]/80 font-medium transition-colors cursor-pointer">
              Learn more about memberships <span className="ml-1">→</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
