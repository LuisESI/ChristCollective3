import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import AuthExperience from "@/components/AuthExperience";
import { Helmet } from "react-helmet";

export default function MobileAuthPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Get redirect parameter from URL
  const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';

  // Handle navigation only when user data is confirmed
  useEffect(() => {
    console.log('📱 MobileAuthPage - isLoading:', isLoading, 'user:', user?.username || 'null', 'shouldRedirect:', shouldRedirect);
    
    if (!isLoading && user && shouldRedirect) {
      console.log('🔄 User confirmed, redirecting to:', redirectTo);
      alert(`User confirmed: ${user.username}, navigating to ${redirectTo}`); // Debug alert
      setLocation(redirectTo);
    } else if (!isLoading && user) {
      console.log('✅ User already authenticated on page load');
      alert(`Already authenticated as ${user.username}`); // Debug alert
      setLocation(redirectTo);
    }
  }, [isLoading, user, shouldRedirect, setLocation, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleLoginSuccess = () => {
    console.log('✅ Login successful, waiting for React Query to update...');
    alert('Login successful! Waiting 500ms for React Query...'); // Debug alert
    
    // Wait 500ms to ensure React Query cache has updated
    setTimeout(() => {
      console.log('⏰ 500ms delay complete, triggering redirect');
      setShouldRedirect(true);
    }, 500);
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
