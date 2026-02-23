import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import AuthExperience from "@/components/AuthExperience";
import { Helmet } from "react-helmet";

export default function MobileAuthPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  const urlRedirect = new URLSearchParams(window.location.search).get('redirect');
  const redirectTo = urlRedirect || localStorage.getItem('authRedirect') || '/';

  useEffect(() => {
    if (urlRedirect) {
      localStorage.setItem('authRedirect', urlRedirect);
    }
  }, [urlRedirect]);

  useEffect(() => {
    if (!isLoading && user && !hasRedirected.current) {
      hasRedirected.current = true;
      localStorage.removeItem('authRedirect');
      setTimeout(() => {
        setLocation(redirectTo);
      }, 100);
    }
  }, [isLoading, user, setLocation, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleLoginSuccess = () => {
    // Navigation will happen automatically via useEffect when user data updates
  };

  return (
    <>
      <Helmet>
        <title>Sign In | Christ Collective</title>
        <meta name="description" content="Sign in to Christ Collective to connect with your community and make a difference through faith." />
      </Helmet>
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <AuthExperience variant="mobile" onLoginSuccess={handleLoginSuccess} />
      </div>
    </>
  );
}
