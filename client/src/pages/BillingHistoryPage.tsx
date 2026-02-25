import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Heart, Download, ExternalLink, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet";

interface DonationRecord {
  id: number;
  campaignId: string;
  amount: string;
  stripePaymentId: string;
  isAnonymous: boolean;
  message: string | null;
  createdAt: string;
}

export default function BillingHistoryPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: donations = [], isLoading } = useQuery<DonationRecord[]>({
    queryKey: ["/api/user/donations"],
    enabled: !!user,
  });

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const downloadReceipt = (donation: DonationRecord) => {
    const receiptContent = `DONATION RECEIPT - Christ Collective

Transaction ID: ${donation.stripePaymentId}
Date: ${formatDate(donation.createdAt)}
Amount: ${formatAmount(donation.amount)}
${donation.message ? `Message: ${donation.message}` : ""}

This serves as your official receipt for tax purposes.
Christ Collective is a registered 501(c)(3) nonprofit organization.

For questions, contact: contact@christcollective.info
`.trim();

    const blob = new Blob([receiptContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${donation.stripePaymentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Please log in to view your donation history.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>Donation History - Christ Collective</title>
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/settings")}
            className="text-[#D4AF37] hover:text-[#C4A030] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Donation History</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-800 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : donations.length === 0 ? (
          <Card className="bg-[#0A0A0A] border-gray-800">
            <CardContent className="py-16 text-center">
              <Heart className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">No donations yet</h3>
              <p className="text-gray-500 text-sm mb-6">
                Your donation history will appear here after your first contribution.
              </p>
              <Button
                onClick={() => navigate("/donate")}
                className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-bold"
              >
                Browse Campaigns
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">
              {donations.length} donation{donations.length !== 1 ? "s" : ""} total
            </p>

            {donations.map((donation) => (
              <div
                key={donation.id}
                className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-base">
                          {formatAmount(donation.amount)}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {formatDate(donation.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                      Completed
                    </Badge>
                  </div>

                  {donation.message && (
                    <p className="text-gray-400 text-sm italic mb-3 pl-13">
                      "{donation.message}"
                    </p>
                  )}

                  <Separator className="bg-gray-800 mb-3" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-gray-600" />
                      <span className="text-gray-600 text-xs font-mono">
                        {donation.stripePaymentId?.slice(0, 20)}…
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadReceipt(donation)}
                        className="flex items-center gap-1 text-[#D4AF37] hover:text-[#C4A030] text-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Receipt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-[#0A0A0A] border border-[#D4AF37]/20 rounded-xl p-4 mt-6">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
                <p className="text-[#D4AF37] text-sm font-semibold">Membership Invoices</p>
              </div>
              <p className="text-gray-500 text-xs mb-3">
                View subscription invoices and manage your payment method through your billing portal.
              </p>
              <Button
                onClick={() => navigate("/settings")}
                variant="outline"
                size="sm"
                className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs"
              >
                Open Billing Portal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
