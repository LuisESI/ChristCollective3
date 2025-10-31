import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import AuthExperience from "@/components/AuthExperience";
import { Helmet } from "react-helmet";

export default function MobileAuthPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  // Get redirect parameter from URL
  const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';

  useEffect(() => {
    if (!isLoading && user) {
      console.log('🔄 User already authenticated, redirecting to:', redirectTo);
      setLocation(redirectTo);
    }
  }, [isLoading, user, setLocation, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleLoginSuccess = () => {
    console.log('✅ Login successful, waiting for user data to propagate...');
    // Don't navigate here - let the useEffect above handle it when user data is available
    // The useEffect will trigger when React Query updates the user data
    // Note: sessionStorage 'justLoggedIn' flag is set by AuthExperience component
  };

  return (
    <>
      <Helmet>
        <title>Sign In | Christ Collective</title>
        <meta name="description" content="Sign in to Christ Collective to connect with your community and make a difference through faith." />
      </Helmet>
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <AuthExperience variant="mobile" onLoginSuccess={handleLoginSuccess} />
      </div>
    </>
  );
}
