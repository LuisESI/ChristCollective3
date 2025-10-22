import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api-config";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
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

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData, {
      onSuccess: () => {
        // Delay navigation to ensure session cookie is set and auth context updates
        setTimeout(() => {
          setLocation("/");
        }, 400);
      },
      onError: (error) => {
        console.error("Login failed:", error);
        toast({
          title: "Login Failed",
          description: error.message || "An error occurred during login",
          variant: "destructive",
        });
      }
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!registerData.username || !registerData.password || !registerData.phone) {
      toast({
        title: "Missing Information",
        description: "Username, password, and phone number are required",
        variant: "destructive",
      });
      return;
    }
    
    // Validate password confirmation
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(registerData.phone.replace(/[\s\-\(\)]/g, ''))) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = registerData;
      await registerMutation.mutateAsync(registrationData);
      
      // Guide user based on their selected type
      if (registerData.userType === "creator") {
        toast({
          title: "Welcome, Creator! 🎬",
          description: "Ready to share your faith-based content? Let's set up your creator profile and get you started with sponsorship opportunities.",
        });
        setLocation("/creator-profile");
      } else if (registerData.userType === "business_owner") {
        toast({
          title: "Welcome, Business Owner! 💼",
          description: "Time to connect with fellow Christian professionals. Let's create your business profile and explore networking opportunities.",
        });
        setLocation("/business");
      } else if (registerData.userType === "ministry") {
        toast({
          title: "Welcome to Ministry! ⛪",
          description: "Called to serve? Let's help you connect with your community and organize impactful ministry events.",
        });
        setLocation("/ministry-profile");
      } else {
        // No user type selected - go to main feed
        toast({
          title: "Welcome to Christ Collective! ✨",
          description: "Explore our community and discover how you can make a difference through faith.",
        });
        setLocation("/");
      }
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Auth forms */}
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <Logo className="h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Christ Collective</h1>
            <p className="text-gray-600 mt-2">Join our community of faith-driven individuals</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-username">Username or Email</Label>
                      <Input
                        id="login-username"
                        type="text"
                        value={loginData.usernameOrEmail}
                        onChange={(e) => setLoginData({ ...loginData, usernameOrEmail: e.target.value })}
                        placeholder="Enter your username or email"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPasswordModal(true)}
                          className="text-primary hover:underline text-sm font-medium"
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
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join our community and start making a difference
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={registerData.firstName}
                          onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                          placeholder="First name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={registerData.lastName}
                          onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                          placeholder="Last name"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-username">Username *</Label>
                      <Input
                        id="register-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        placeholder="Choose a username"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="userType">Are you a... (Optional)</Label>
                      <Select 
                        value={registerData.userType} 
                        onValueChange={(value) => setRegisterData({ ...registerData, userType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="creator">
                            Content Creator - Share your faith through content
                          </SelectItem>
                          <SelectItem value="business_owner">
                            Business Owner - Connect with Christian professionals  
                          </SelectItem>
                          <SelectItem value="ministry">
                            Ministry - Serve and lead your community
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Selecting your role helps us guide you to the right features after registration.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="register-password">Password *</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        placeholder="Create a password"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm Password *</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side - Hero content */}
        <div className="hidden lg:block">
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-bold text-gray-900">
              Unite in Faith, <span className="text-primary">Grow Together</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-lg mx-auto">
              Join a community where faith meets action. Support causes you believe in, connect with like-minded businesses, and make a lasting impact.
            </p>
            <div className="grid grid-cols-1 gap-4 max-w-md mx-auto mt-8">
              <div className="bg-white rounded-lg p-6 border-2 border-primary shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <h3 className="font-semibold text-gray-900 mb-2">Support Causes</h3>
                <p className="text-gray-600 text-sm">Donate to verified campaigns and see your impact grow</p>
              </div>
              <div className="bg-white rounded-lg p-6 border-2 border-primary shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <h3 className="font-semibold text-gray-900 mb-2">Network & Connect</h3>
                <p className="text-gray-600 text-sm">Build meaningful relationships with Christian businesses</p>
              </div>
              <div className="bg-white rounded-lg p-6 border-2 border-primary shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <h3 className="font-semibold text-gray-900 mb-2">Create Content</h3>
                <p className="text-gray-600 text-sm">Share your faith journey and get sponsored</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPasswordModal} onOpenChange={setShowForgotPasswordModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Reset Password</DialogTitle>
            <DialogDescription className="text-gray-700">
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="forgot-email" className="text-sm mb-2 block text-black">Email Address</Label>
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
              className="w-full h-12"
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