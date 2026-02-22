import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, Loader2, Crown, HeartHandshake, ArrowRight, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const tierDetails: Record<string, { name: string; price: string; icon: any; benefits: string[]; emoji: string }> = {
  collective: {
    name: "The Collective",
    price: "$30/month",
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
    ]
  },
  guild: {
    name: "The Guild",
    price: "$60/month",
    icon: Crown,
    emoji: "✨",
    benefits: [
      "Everything in The Collective",
      "Priority access to private events",
      "Early access to programs & collabs",
      "Pitch & co-lead collective projects",
      "Private member events — priority access",
      "Featured Guild member recognition"
    ]
  }
};

export default function MembershipCheckoutPage() {
  const { tierId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) {
      const u = user as any;
      const name = u.displayName || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName || u.username || "");
      if (name && !fullName) setFullName(name);
      if (u.email && !email) setEmail(u.email);
      if (u.phone && !phone) setPhone(u.phone);
    }
  }, [user]);

  const tier = tierId ? tierDetails[tierId] : null;

  const subscribeMutation = useMutation({
    mutationFn: async (data: { tier: string; fullName: string; email: string; phone: string }) => {
      const res = await apiRequest("/api/membership-subscriptions", {
        method: "POST",
        data,
      });
      return res.json();
    },
    onSuccess: (data: { checkoutUrl: string; subscriptionId: number }) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Error",
          description: "Unable to start checkout. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create membership. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in your full name and email.",
        variant: "destructive",
      });
      return;
    }
    subscribeMutation.mutate({
      tier: tierId || "",
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!user) {
    navigate(`/auth?redirect=/membership/checkout/${tierId}`);
    return null;
  }

  if (!tier || !tierId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Membership tier not found</h2>
          <p className="text-gray-400 mb-6">The membership tier you selected doesn't exist.</p>
          <Button className="bg-[#D4AF37] text-black" onClick={() => navigate("/memberships")}>
            View Memberships
          </Button>
        </div>
      </div>
    );
  }

  const TierIcon = tier.icon;

  return (
    <>
      <Helmet>
        <title>Join {tier.name} | Christ Collective</title>
        <meta name="description" content={`Subscribe to ${tier.name} and unlock exclusive membership benefits at Christ Collective.`} />
      </Helmet>

      <div className="min-h-screen bg-black text-white pb-24">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white mb-6"
            onClick={() => navigate("/memberships")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Memberships
          </Button>

          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-b from-[#D4AF37]/15 via-[#0A0A0A] to-[#0A0A0A] border-[#D4AF37]/40 sticky top-8">
                <CardHeader className="text-center pb-4">
                  <div className="inline-flex p-3 rounded-2xl bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/30 mx-auto mb-3">
                    <TierIcon className="w-7 h-7 text-[#D4AF37]" />
                  </div>
                  <CardTitle className="text-xl text-[#D4AF37] flex items-center justify-center gap-2">
                    <span>{tier.emoji}</span> {tier.name}
                  </CardTitle>
                  <p className="text-3xl font-bold text-white mt-2">{tier.price}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Separator className="bg-[#D4AF37]/20 mb-4" />
                  <ul className="space-y-3">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <div className="mt-0.5 rounded-full p-0.5 bg-[#D4AF37]/20 flex-shrink-0">
                          <Check className="w-3 h-3 text-[#D4AF37]" />
                        </div>
                        <span className="text-gray-300 leading-tight">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500 w-full justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cancel anytime</span>
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Card className="bg-[#0A0A0A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Your Information</CardTitle>
                  <p className="text-gray-500 text-sm">
                    Please provide your details to complete your membership registration.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-gray-300">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="bg-black border-gray-700 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="bg-black border-gray-700 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number (optional)"
                        className="bg-black border-gray-700 text-white placeholder:text-gray-600 focus:border-[#D4AF37]"
                      />
                    </div>

                    <Separator className="bg-gray-800" />

                    <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-300 mb-2">Order Summary</h3>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">{tier.name} membership</span>
                        <span className="text-white">{tier.price}</span>
                      </div>
                      <Separator className="bg-gray-800 my-2" />
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-gray-300">Total</span>
                        <span className="text-[#D4AF37]">{tier.price}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full py-6 text-base font-bold bg-[#D4AF37] hover:bg-[#C4A030] text-black"
                      disabled={subscribeMutation.isPending}
                    >
                      {subscribeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Purchase Membership
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-gray-600 mt-2">
                      By joining, you agree to our terms of service. Your membership will renew automatically each month.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
