import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isNativeApp } from "./platform";

/**
 * Hook to check if user is authenticated and redirect to auth page if not
 * Used for actions that require authentication
 */
export const useAuthGuard = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const requireAuth = (action: () => void, message?: string) => {
    if (!user) {
      toast({
        title: "Sign in Required",
        description: message || "Please sign in to continue",
        variant: "default",
      });
      
      // Navigate to appropriate auth page based on platform
      if (isNativeApp()) {
        setLocation("/auth/mobile");
      } else {
        setLocation("/auth");
      }
      return false;
    }
    
    action();
    return true;
  };

  return { requireAuth, isAuthenticated: !!user };
};
