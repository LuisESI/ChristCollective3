import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Settings, Mail, Phone, MapPin,
  Bell, BookOpen, Shield, User, Palette,
  LogOut, HelpCircle, Info, Lock, Globe, MessageSquare,
  Volume2, Smartphone, History
} from "lucide-react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { isNativeApp } from "@/lib/platform";

export default function SettingsPage() {
  const { user, isLoading, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const [wordOfDayNotification, setWordOfDayNotification] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);


  useEffect(() => {
    if (!isLoading && !user) {
      const authRoute = isNativeApp() ? "/auth/mobile" : "/auth";
      navigate(`${authRoute}?redirect=/settings`);
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      setShowEmail((user as any).showEmail || false);
      setShowPhone((user as any).showPhone || false);
      setShowLocation((user as any).showLocation || false);
      setWordOfDayNotification((user as any).wordOfDayNotification !== false);
      setPushNotifications((user as any).pushNotificationsEnabled !== false);
      setEmailNotifications((user as any).emailNotificationsEnabled !== false);
    }
  }, [user]);

  const updatePrivacyMutation = useMutation({
    mutationFn: async (settings: { showEmail: boolean; showPhone: boolean; showLocation: boolean }) => {
      const response = await apiRequest("/api/user/privacy-settings", { method: "PUT", data: settings });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update privacy settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Privacy settings saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateNotificationMutation = useMutation({
    mutationFn: async (settings: { wordOfDayNotification: boolean; pushNotificationsEnabled: boolean; emailNotificationsEnabled: boolean }) => {
      const response = await apiRequest("/api/user/notification-settings", { method: "PUT", data: settings });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update notification settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Notification settings saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSavePrivacy = () => {
    updatePrivacyMutation.mutate({ showEmail, showPhone, showLocation });
  };

  const handleSaveNotifications = () => {
    updateNotificationMutation.mutate({
      wordOfDayNotification,
      pushNotificationsEnabled: pushNotifications,
      emailNotificationsEnabled: emailNotifications,
    });
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Settings - Christ Collective</title>
        <meta name="description" content="Manage your account, privacy, notification, and app settings." />
      </Helmet>
      <div className="min-h-screen bg-black text-white pb-20">
        <div className="bg-black border-b border-gray-800 p-4 sticky top-0 z-10">
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
              <Settings className="h-5 w-5 text-[#D4AF37]" />
              <h1 className="text-xl font-bold text-white">Settings</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">

          {/* Donation History */}
          <div className="bg-[#0A0A0A] rounded-xl border border-gray-800 overflow-hidden">
            <button
              onClick={() => navigate("/billing-history")}
              className="w-full flex items-center justify-between p-4 hover:bg-[#111] transition-colors"
            >
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="text-white text-sm font-medium">Donation History</p>
                  <p className="text-gray-500 text-xs">View all your past donations & receipts</p>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-600 rotate-180" />
            </button>
          </div>

          {/* Account Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Account</h2>
            </div>
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => navigate("/edit-profile")}
                className="w-full flex items-center justify-between p-4 hover:bg-[#111] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">Edit Profile</p>
                    <p className="text-gray-500 text-xs">Update your name, bio, and profile picture</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-gray-600 rotate-180" />
              </button>

              <Separator className="bg-gray-800" />

              <button
                onClick={() => navigate("/reset-password")}
                className="w-full flex items-center justify-between p-4 hover:bg-[#111] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">Change Password</p>
                    <p className="text-gray-500 text-xs">Update your account password</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-gray-600 rotate-180" />
              </button>

              <Separator className="bg-gray-800" />

              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Email</p>
                    <p className="text-gray-500 text-xs">{(user as any).email || "Not set"}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-800" />

              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Username</p>
                    <p className="text-gray-500 text-xs">@{(user as any).username || "Not set"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Notifications</h2>
            </div>
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label htmlFor="wotd-notif" className="text-white text-sm font-medium cursor-pointer">
                      Word of the Day
                    </Label>
                    <p className="text-gray-500 text-xs">Get a daily Bible verse every morning at 7 AM</p>
                  </div>
                </div>
                <Switch
                  id="wotd-notif"
                  checked={wordOfDayNotification}
                  onCheckedChange={setWordOfDayNotification}
                />
              </div>

              <Separator className="bg-gray-800" />

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label htmlFor="push-notif" className="text-white text-sm font-medium cursor-pointer">
                      Push Notifications
                    </Label>
                    <p className="text-gray-500 text-xs">Receive notifications for messages and activity</p>
                  </div>
                </div>
                <Switch
                  id="push-notif"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <Separator className="bg-gray-800" />

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label htmlFor="email-notif" className="text-white text-sm font-medium cursor-pointer">
                      Email Notifications
                    </Label>
                    <p className="text-gray-500 text-xs">Receive email updates about your account</p>
                  </div>
                </div>
                <Switch
                  id="email-notif"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator className="bg-gray-800" />

              <div className="p-4">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={updateNotificationMutation.isPending}
                  className="w-full bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium"
                  size="sm"
                >
                  {updateNotificationMutation.isPending ? "Saving..." : "Save Notification Settings"}
                </Button>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Privacy</h2>
            </div>
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label htmlFor="show-email" className="text-white text-sm font-medium cursor-pointer">
                      Show Email
                    </Label>
                    <p className="text-gray-500 text-xs">
                      {(user as any).email ? "Display email on your public profile" : "No email address set"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-email"
                  checked={showEmail}
                  onCheckedChange={setShowEmail}
                  disabled={!(user as any).email}
                />
              </div>

              <Separator className="bg-gray-800" />

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label htmlFor="show-phone" className="text-white text-sm font-medium cursor-pointer">
                      Show Phone Number
                    </Label>
                    <p className="text-gray-500 text-xs">
                      {(user as any).phone ? "Display phone on your public profile" : "No phone number set"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-phone"
                  checked={showPhone}
                  onCheckedChange={setShowPhone}
                  disabled={!(user as any).phone}
                />
              </div>

              <Separator className="bg-gray-800" />

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label htmlFor="show-location" className="text-white text-sm font-medium cursor-pointer">
                      Show Location
                    </Label>
                    <p className="text-gray-500 text-xs">
                      {(user as any).location ? "Display location on your public profile" : "No location set"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-location"
                  checked={showLocation}
                  onCheckedChange={setShowLocation}
                  disabled={!(user as any).location}
                />
              </div>

              <Separator className="bg-gray-800" />

              <div className="p-4">
                <Button
                  onClick={handleSavePrivacy}
                  disabled={updatePrivacyMutation.isPending}
                  className="w-full bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium"
                  size="sm"
                >
                  {updatePrivacyMutation.isPending ? "Saving..." : "Save Privacy Settings"}
                </Button>
              </div>
            </div>
          </div>

          {/* App Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">App</h2>
            </div>
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Theme</p>
                    <p className="text-gray-500 text-xs">Dark mode (default)</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-800" />

              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Sound Effects</p>
                    <p className="text-gray-500 text-xs">Notification and interaction sounds</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-800" />

              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Language</p>
                    <p className="text-gray-500 text-xs">English (US)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Support</h2>
            </div>
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => navigate("/about")}
                className="w-full flex items-center justify-between p-4 hover:bg-[#111] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">About Christ Collective</p>
                    <p className="text-gray-500 text-xs">Learn about our mission and community</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-gray-600 rotate-180" />
              </button>

              <Separator className="bg-gray-800" />

              <button
                onClick={() => navigate("/donate")}
                className="w-full flex items-center justify-between p-4 hover:bg-[#111] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">Support & Donate</p>
                    <p className="text-gray-500 text-xs">Help us grow the community</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-gray-600 rotate-180" />
              </button>

              <Separator className="bg-gray-800" />

              <div className="p-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Contact Us</p>
                    <p className="text-gray-500 text-xs">support@christcollective.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => logoutMutation.mutate()}
                className="w-full flex items-center gap-3 p-4 hover:bg-[#111] transition-colors"
              >
                <LogOut className="w-5 h-5 text-red-400" />
                <p className="text-red-400 text-sm font-medium">Log Out</p>
              </button>
            </div>
          </div>

          <div className="text-center py-4">
            <p className="text-gray-600 text-xs">Christ Collective v1.0</p>
          </div>
        </div>
      </div>
    </>
  );
}
