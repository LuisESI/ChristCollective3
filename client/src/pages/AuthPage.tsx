import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import AuthExperience from "@/components/AuthExperience";
import { Helmet } from "react-helmet";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  const urlRedirect = new URLSearchParams(window.location.search).get('redirect');
  const redirectTo = urlRedirect || localStorage.getItem('authRedirect') || '/';

  useEffect(() => {
    if (urlRedirect) {
      localStorage.setItem('authRedirect', urlRedirect);
    }
  }, [urlRedirect]);

  useEffect(() => {
    if (!isLoading && user) {
      localStorage.removeItem('authRedirect');
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
    localStorage.removeItem('authRedirect');
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
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full flex justify-center">
          <AuthExperience variant="desktop" onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    </>
  );
}
