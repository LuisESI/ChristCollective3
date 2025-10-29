import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import AuthExperience from "@/components/AuthExperience";
import { Helmet } from "react-helmet";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  // Get redirect parameter from URL
  const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      setLocation(redirectTo);
    }
  }, [isLoading, user, setLocation, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleLoginSuccess = () => {
    // Navigate to redirect URL after login
    setTimeout(() => {
      setLocation(redirectTo);
    }, 400);
  };

  return (
    <>
      <Helmet>
        <title>Sign In | Christ Collective</title>
        <meta name="description" content="Sign in to Christ Collective to connect with your community and make a difference through faith." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <AuthExperience variant="desktop" onLoginSuccess={handleLoginSuccess} />
      </div>
    </>
  );
}
