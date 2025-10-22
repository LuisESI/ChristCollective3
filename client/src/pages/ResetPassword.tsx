import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api-config";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Extract token from URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast({
        title: "Invalid Link",
        description: "No reset token found in the URL",
        variant: "destructive",
      });
    }
  }, [toast]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string; confirmPassword: string }) => {
      const response = await fetch(buildApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset Successfully",
        description: "You have been automatically logged in",
      });
      
      // Delay navigation to allow session cookie to be set
      setTimeout(() => {
        setLocation("/feed");
      }, 400);
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: "Invalid Token",
        description: "No reset token found",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword,
      confirmPassword,
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      {/* Logo and title section */}
      <div className="flex flex-col items-center mb-8">
        <Logo className="h-16 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
        <p className="text-gray-600 text-center">Enter your new password below</p>
      </div>

      {/* Reset password form */}
      <div className="w-full max-w-md">
        <div className="bg-black rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-white text-xl font-semibold mb-1">Create New Password</h2>
              <p className="text-gray-400 text-sm">Your password must be at least 6 characters</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-password" className="text-white text-sm mb-2 block">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="h-12 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                  required
                  data-testid="input-new-password"
                />
              </div>
              
              <div>
                <Label htmlFor="confirm-new-password" className="text-white text-sm mb-2 block">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-12 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                  required
                  data-testid="input-confirm-new-password"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-base" 
              disabled={resetPasswordMutation.isPending || !token}
              data-testid="button-reset-password"
            >
              {resetPasswordMutation.isPending ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setLocation("/auth")}
              className="text-yellow-500 hover:text-yellow-400 text-sm font-medium"
              data-testid="button-back-to-login"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
