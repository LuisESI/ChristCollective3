import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, Globe, HeartHandshake, Crown, ArrowRight, CreditCard, ArrowUpCircle, XCircle, Receipt, User, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const tierInfo: Record<string, { name: string; price: string; period: string; icon: any; emoji: string; benefits: string[] }> = {
  collective: {
    name: "The Collective",
    price: "$30",
    period: "/month",
    icon: HeartHandshake,
    emoji: "🕊️",
    benefits: [
      "Access to the Christ Collective private community & member directory",
      "Weekly team leader program calls",
      "Bi-weekly networking calls",
      "Spiritual counsel access",
      "Public outreach & ministry events",
      "Private member events — standard access",
      "Shared resource library & newsletter"
    ],
  },
  guild: {
    name: "The Guild",
    price: "$60",
    period: "/month",
    icon: Crown,
    emoji: "✨",
    benefits: [
      "Everything in The Collective",
      "Priority access to private events — first to register, reserved spots, front-row seat",
      "Early access to programs & collabs",
      "Pitch & co-lead collective projects",
      "Private member events — priority access",
      "Featured Guild member recognition"
    ],
  },
};

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
    benefits: tierInfo.collective.benefits,
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
    benefits: tierInfo.guild.benefits,
    icon: <Crown className="w-7 h-7 text-[#D4AF37]" />,
    buttonText: "Join The Guild",
    paid: true,
    elite: true,
    emoji: "✨"
  }
];

function MembershipManagement({ membership }: { membership: any }) {
  const { toast } = useToast();

  const currentTier = tierInfo[membership.tier];
  const TierIcon = currentTier?.icon || Crown;
  const canUpgrade = membership.tier === "collective";

  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('/api/membership-subscriptions/billing-portal', { method: 'POST' });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "Unable to open billing portal", description: "Please try again later.", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('/api/membership-subscriptions/billing-portal', { method: 'POST' });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) window.location.href = data.url;
    },
    onError: () => {
      toast({ title: "Unable to open billing portal", description: "Please try again or contact support.", variant: "destructive" });
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('/api/membership-subscriptions/upgrade', { method: 'POST' });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: () => {
      toast({ title: "Failed to start upgrade", description: "Please try again.", variant: "destructive" });
    },
  });

  const memberSince = membership.startDate ? new Date(membership.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "N/A";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative rounded-2xl bg-gradient-to-b from-[#D4AF37]/15 via-[#0A0A0A] to-[#0A0A0A] border-2 border-[#D4AF37]/40 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37] to-[#F5E6A3]" />

        <div className="p-8 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/30 mb-4">
            <TierIcon className="w-10 h-10 text-[#D4AF37]" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg">{currentTier?.emoji}</span>
            <h2 className="text-2xl font-bold text-[#D4AF37]">{currentTier?.name || membership.tier}</h2>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-2">
            Active Member
          </Badge>
        </div>

        <Separator className="bg-gray-800" />

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-xl p-4 flex items-start gap-3">
              <User className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Name</p>
                <p className="text-white text-sm font-medium">{membership.fullName}</p>
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 flex items-start gap-3">
              <Receipt className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Billing</p>
                <p className="text-white text-sm font-medium">{currentTier?.price}{currentTier?.period}</p>
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Member Since</p>
                <p className="text-white text-sm font-medium">{memberSince}</p>
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                <p className="text-white text-sm font-medium truncate">{membership.email}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-800" />

          <div>
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3">Your Benefits</h3>
            <ul className="space-y-2.5">
              {currentTier?.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 rounded-full p-0.5 flex-shrink-0 bg-[#D4AF37]/20">
                    <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </div>
                  <span className="text-gray-200 leading-tight">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator className="bg-gray-800" />

          <div className="space-y-3">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3">Manage Membership</h3>

            {canUpgrade && (
              <Button
                className="w-full py-5 bg-gradient-to-r from-[#D4AF37] to-[#F5E6A3] hover:from-[#C4A030] hover:to-[#E5D693] text-black font-bold shadow-lg shadow-[#D4AF37]/20"
                onClick={() => upgradeMutation.mutate()}
                disabled={upgradeMutation.isPending}
              >
                {upgradeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                )}
                Upgrade to The Guild ($60/mo)
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full py-5 border-gray-700 text-white hover:bg-gray-900 hover:border-[#D4AF37]"
              onClick={() => billingPortalMutation.mutate()}
              disabled={billingPortalMutation.isPending}
            >
              {billingPortalMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Manage Billing & Payment Method
            </Button>

            <Button
              variant="ghost"
              className="w-full text-gray-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Cancel Membership
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MembershipsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ["/api/membership-subscriptions/me"],
    enabled: !!user,
  });

  const hasActiveMembership = membership && (membership as any).status === "active";

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
        <title>{hasActiveMembership ? "My Membership" : "Membership Tiers"} | Christ Collective</title>
        <meta name="description" content="Join the Christ Collective membership - connect, grow, and serve with fellow Christians worldwide." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <Badge className="bg-[#D4AF37] text-black mb-4 text-xs tracking-widest">
            {hasActiveMembership ? "MY MEMBERSHIP" : "MEMBERSHIPS"}
          </Badge>
          <img src="/assets/logo.png" alt="Christ Collective" className="h-20 md:h-28 mx-auto mb-4 object-contain" />
          <p className="text-gray-400 max-w-2xl mx-auto text-sm">
            {hasActiveMembership
              ? "Manage your membership, billing, and benefits below."
              : "Choose the tier that best fits your journey and help us build a global community of faith."}
          </p>
        </div>

        {membershipLoading && user ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </div>
        ) : hasActiveMembership ? (
          <MembershipManagement membership={membership} />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
