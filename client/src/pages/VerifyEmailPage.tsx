import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { buildApiUrl } from "@/lib/api-config";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");
  const redirect = params.get("redirect");

  const [status, setStatus] = useState<"loading" | "success" | "already" | "expired" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please check your email for the correct link.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(buildApiUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`), {
          credentials: "include",
        });
        const data = await response.json();

        if (response.ok) {
          if (data.alreadyVerified) {
            setStatus("already");
          } else {
            setStatus("success");
          }
          setMessage(data.message);
        } else {
          if (data.expired) {
            setStatus("expired");
          } else {
            setStatus("error");
          }
          setMessage(data.message);
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    };

    verifyEmail();
  }, [token]);

  const handleContinue = () => {
    const authRedirect = redirect ? `/auth?redirect=${encodeURIComponent(redirect)}` : "/auth";
    setLocation(authRedirect);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="h-12 mx-auto mb-4" />
        </div>

        <Card className="bg-[#0A0A0A] border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-xl">Email Verification</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {status === "loading" && (
              <div className="space-y-4">
                <Loader2 className="h-16 w-16 text-[#D4AF37] mx-auto animate-spin" />
                <p className="text-gray-400">Verifying your email address...</p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-white text-lg font-semibold">Email Verified!</h3>
                <p className="text-gray-400">{message}</p>
                <Button
                  onClick={handleContinue}
                  className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold"
                >
                  Continue to Sign In
                </Button>
              </div>
            )}

            {status === "already" && (
              <div className="space-y-4">
                <CheckCircle className="h-16 w-16 text-[#D4AF37] mx-auto" />
                <h3 className="text-white text-lg font-semibold">Already Verified</h3>
                <p className="text-gray-400">{message}</p>
                <Button
                  onClick={handleContinue}
                  className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold"
                >
                  Go to Sign In
                </Button>
              </div>
            )}

            {status === "expired" && (
              <div className="space-y-4">
                <Mail className="h-16 w-16 text-yellow-500 mx-auto" />
                <h3 className="text-white text-lg font-semibold">Link Expired</h3>
                <p className="text-gray-400">{message}</p>
                <Button
                  onClick={() => setLocation("/auth")}
                  className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold"
                >
                  Go to Sign In
                </Button>
                <p className="text-gray-500 text-sm">
                  Sign in to request a new verification email.
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                <h3 className="text-white text-lg font-semibold">Verification Failed</h3>
                <p className="text-gray-400">{message}</p>
                <Button
                  onClick={() => setLocation("/auth")}
                  className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold"
                >
                  Go to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
