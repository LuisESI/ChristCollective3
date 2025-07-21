import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield, Eye, EyeOff, Mail, Phone, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";

export default function PrivacySettingsPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for privacy settings
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  // Initialize settings from user data
  useEffect(() => {
    if (user) {
      setShowEmail(user.showEmail || false);
      setShowPhone(user.showPhone || false);
      setShowLocation(user.showLocation || false);
    }
  }, [user]);

  // Mutation to update privacy settings
  const updatePrivacyMutation = useMutation({
    mutationFn: async (settings: { showEmail: boolean; showPhone: boolean; showLocation: boolean }) => {
      const response = await apiRequest("PUT", "/api/user/privacy-settings", settings);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update privacy settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updatePrivacyMutation.mutate({
      showEmail,
      showPhone,
      showLocation,
    });
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Privacy Settings - Christ Collective</title>
        <meta name="description" content="Manage your privacy settings and control what information is visible on your profile." />
      </Helmet>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-black border-b border-border p-4 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/profile")}
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-[#D4AF37]" />
              <h1 className="text-xl font-bold text-white">Privacy Settings</h1>
            </div>
          </div>
          <p className="text-gray-300 text-sm mt-1 ml-11">Control what others can see on your profile</p>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Profile Visibility Card */}
          <Card className="mb-6 bg-black border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Eye className="h-5 w-5 text-[#D4AF37]" />
                <span>Profile Visibility</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Choose what contact information to display on your public profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Setting */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <Label htmlFor="show-email" className="text-white font-medium">
                      Email Address
                    </Label>
                    <p className="text-sm text-gray-400">
                      {user.email || "No email address set"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-email"
                  checked={showEmail}
                  onCheckedChange={setShowEmail}
                  disabled={!user.email}
                />
              </div>

              <Separator className="bg-gray-700" />

              {/* Phone Setting */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <Label htmlFor="show-phone" className="text-white font-medium">
                      Phone Number
                    </Label>
                    <p className="text-sm text-gray-400">
                      {user.phone || "No phone number set"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-phone"
                  checked={showPhone}
                  onCheckedChange={setShowPhone}
                  disabled={!user.phone}
                />
              </div>

              <Separator className="bg-gray-700" />

              {/* Location Setting */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <Label htmlFor="show-location" className="text-white font-medium">
                      Location
                    </Label>
                    <p className="text-sm text-gray-400">
                      {user.location || "No location set"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-location"
                  checked={showLocation}
                  onCheckedChange={setShowLocation}
                  disabled={!user.location}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Info Card */}
          <Card className="mb-6 bg-black border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <EyeOff className="h-5 w-5 text-[#D4AF37]" />
                <span>Privacy Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-300">
                <p>• When visibility is turned off, your contact information will be hidden from other users</p>
                <p>• You can always change these settings later</p>
                <p>• Your profile name and photo are always visible to other community members</p>
                <p>• Admins may have access to contact information for platform security purposes</p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSaveSettings}
            disabled={updatePrivacyMutation.isPending}
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium"
          >
            {updatePrivacyMutation.isPending ? "Saving..." : "Save Privacy Settings"}
          </Button>

          {/* Navigation hint */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              To update your contact information, go to{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto text-[#D4AF37] hover:text-[#B8941F]"
                onClick={() => navigate("/profile")}
              >
                Edit Profile
              </Button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}