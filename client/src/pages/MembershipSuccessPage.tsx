import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";

export default function MembershipSuccessPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subId = params.get("sub_id");
    if (subId && user) {
      apiRequest(`/api/membership-subscriptions/${subId}/activate`, { method: "GET" })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/membership-subscriptions/me"] });
        })
        .catch(() => {});
    }
  }, [user]);

  return (
    <>
      <Helmet>
        <title>Welcome to the Family | Christ Collective</title>
      </Helmet>
      <div className="min-h-screen bg-black text-white flex items-center justify-center pb-24">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex p-4 rounded-full bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/30 mb-6">
            <CheckCircle className="w-12 h-12 text-[#D4AF37]" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Welcome to the Family!</h1>
          <p className="text-gray-400 mb-8">
            Your membership is now active. Thank you for joining Christ Collective.
          </p>
          <Button
            className="bg-[#D4AF37] hover:bg-[#C4A030] text-black font-bold px-8 py-5"
            onClick={() => navigate("/profile")}
          >
            Go to Profile
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </>
  );
}
