import { useLocation } from "wouter";
import { Check, ArrowLeft, Shield, Users, Star, Zap, Globe, MessageSquare, Calendar, Share2, Library, Users2, Mic2, Compass, HeartHandshake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
      "Post content on Christ collective",
      "Exclusive access to pre-released CC content"
    ],
    icon: <Globe className="w-6 h-6 text-gray-400" />,
    buttonText: "Get Started",
    popular: false
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
    icon: <HeartHandshake className="w-6 h-6 text-[#D4AF37]" />,
    buttonText: "Join The Collective",
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
    icon: <Sparkles className="w-6 h-6 text-[#D4AF37]" />,
    buttonText: "Join The Guild",
    popular: false,
    emoji: "✨"
  }
];

export default function MembershipsPage() {
  const [, setLocation] = useLocation();

  const handleSelectTier = (tierId: string) => {
    if (tierId === "free") {
      setLocation("/auth");
    } else {
      setLocation(`/membership/checkout/${tierId}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <Badge className="bg-[#D4AF37] text-black mb-4">MEMBERSHIPS</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Unite with the <span className="text-[#D4AF37]">Collective</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Choose the tier that best fits your journey and help us build a global community of faith.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative bg-[#0A0A0A] border-gray-800 flex flex-col h-full transition-all duration-300 hover:border-[#D4AF37]/50 ${
                tier.popular ? "ring-2 ring-[#D4AF37] scale-105 md:scale-110 z-10" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#D4AF37] text-black px-4 py-1">MOST POPULAR</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-gray-900/50">
                    {tier.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  {tier.emoji && <span>{tier.emoji}</span>}
                  {tier.name}
                </CardTitle>
                <div className="mt-4 flex items-baseline justify-center">
                  <span className="text-4xl font-extrabold text-[#D4AF37]">{tier.price}</span>
                  {tier.period && <span className="text-gray-500 ml-1">{tier.period}</span>}
                </div>
                <CardDescription className="text-gray-400 mt-2">
                  {tier.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow pt-6">
                <Separator className="bg-gray-800 mb-6" />
                <ul className="space-y-4">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 bg-[#D4AF37]/20 rounded-full p-0.5">
                        <Check className="w-3 h-3 text-[#D4AF37]" />
                      </div>
                      <span className="text-gray-300 leading-tight">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6 pb-8">
                <Button 
                  className={`w-full py-6 text-lg font-bold transition-all ${
                    tier.popular 
                      ? "bg-[#D4AF37] hover:bg-[#C4A030] text-black" 
                      : "bg-transparent border-2 border-gray-800 hover:border-[#D4AF37] text-white hover:bg-[#D4AF37] hover:text-black"
                  }`}
                  onClick={() => handleSelectTier(tier.id)}
                >
                  {tier.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
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
