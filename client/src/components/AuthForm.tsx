import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api-config";

export default function AuthForm() {
  const [, setLocation] = useLocation();
  const { loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  
  const [loginData, setLoginData] = useState({
    usernameOrEmail: "",
    password: ""
  });
  
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    userType: ""
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(buildApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reset email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "If an account with that email exists, a password reset link has been sent.",
      });
      setShowForgotPasswordModal(false);
      setForgotPasswordEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    forgotPasswordMutation.mutate(forgotPasswordEmail);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    loginMutation.mutate(loginData, {
      onSuccess: () => {
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in",
        });
        // Delay navigation to ensure session cookie is set and auth context updates
        setTimeout(() => {
          setLocation("/feed");
        }, 400);
      },
      onError: (error: any) => {
        toast({
          title: "Login Failed",
          description: error.message || "Please check your credentials and try again",
          variant: "destructive",
        });
      }
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.username || !registerData.password || !registerData.phone) {
      toast({
        title: "Missing Information",
        description: "Username, password, and phone number are required",
        variant: "destructive",
      });
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { confirmPassword, ...registrationData } = registerData;
      await registerMutation.mutateAsync(registrationData);
      
      toast({
        title: "Welcome to Christ Collective!",
        description: "Your account has been created successfully",
      });
      
      if (registerData.userType === "creator") {
        setLocation("/creator-profile");
      } else if (registerData.userType === "business_owner") {
        setLocation("/business");
      } else if (registerData.userType === "ministry") {
        setLocation("/ministry-profile");
      } else {
        setLocation("/feed");
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      {/* Logo and welcome section */}
      <div className="flex flex-col items-center mb-8">
        <Logo className="h-16 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Christ Collective</h1>
        <p className="text-gray-600 text-center">Join our community of faith-driven individuals</p>
      </div>

      {/* Auth content */}
      <div className="w-full max-w-md">
        {/* Toggle buttons */}
        <div className="flex gap-0 mb-6 bg-black rounded-lg p-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
              mode === "login" 
                ? "bg-white text-black" 
                : "bg-transparent text-white"
            }`}
            data-testid="button-show-login"
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
              mode === "register" 
                ? "bg-white text-black" 
                : "bg-transparent text-white"
            }`}
            data-testid="button-show-register"
          >
            Sign Up
          </button>
        </div>

        {/* Auth form container */}
        <div className="bg-black rounded-2xl p-6">
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h2 className="text-white text-xl font-semibold mb-1">Sign In</h2>
                <p className="text-gray-400 text-sm">Enter your credentials to access your account</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="login-username" className="text-white text-sm mb-2 block">Username or Email</Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={loginData.usernameOrEmail}
                    onChange={(e) => setLoginData({ ...loginData, usernameOrEmail: e.target.value })}
                    placeholder="Enter your username or email"
                    className="h-12 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    required
                    data-testid="input-username"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="login-password" className="text-white text-sm">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-yellow-500 hover:text-yellow-400 text-sm font-medium underline"
                      data-testid="button-forgot-password"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="h-12 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    required
                    data-testid="input-password"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-base" 
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h2 className="text-white text-xl font-semibold mb-1">Sign Up</h2>
                <p className="text-gray-400 text-sm">Create your account to get started</p>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-white text-sm mb-2 block">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                      placeholder="First name"
                      className="h-11 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                      required
                      data-testid="input-firstname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-white text-sm mb-2 block">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                      placeholder="Last name"
                      className="h-11 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                      required
                      data-testid="input-lastname"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="register-username" className="text-white text-sm mb-2 block">Username</Label>
                  <Input
                    id="register-username"
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    placeholder="Choose a username"
                    className="h-11 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    required
                    data-testid="input-register-username"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-white text-sm mb-2 block">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="h-11 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    required
                    data-testid="input-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-white text-sm mb-2 block">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="h-11 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    required
                    data-testid="input-phone"
                  />
                </div>
                
                <div>
                  <Label htmlFor="userType" className="text-white text-sm mb-2 block">I am a... (Optional)</Label>
                  <Select 
                    value={registerData.userType} 
                    onValueChange={(value) => setRegisterData({ ...registerData, userType: value })}
                  >
                    <SelectTrigger className="h-11 bg-gray-900 border-gray-700 text-white" data-testid="select-usertype">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="creator">Content Creator</SelectItem>
                      <SelectItem value="business_owner">Business Owner</SelectItem>
                      <SelectItem value="ministry">Ministry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="register-password" className="text-white text-sm mb-2 block">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Create a password"
                    className="h-11 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    required
                    data-testid="input-register-password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirm-password" className="text-white text-sm mb-2 block">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    className="h-11 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    required
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-base" 
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "Creating Account..." : "Sign Up"}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPasswordModal} onOpenChange={setShowForgotPasswordModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="forgot-email" className="text-sm mb-2 block">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-12"
                required
                data-testid="input-forgot-password-email"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              disabled={forgotPasswordMutation.isPending}
              data-testid="button-send-reset-link"
            >
              {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
