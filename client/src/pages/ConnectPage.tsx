import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationsList } from "@/components/NotificationsList";
import { Bell, Users, MessageSquare, Activity } from "lucide-react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";

export default function ConnectPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Helmet>
          <title>Connect - Christ Collective</title>
          <meta name="description" content="Stay connected with the Christ Collective community through notifications and updates" />
        </Helmet>
        <Card className="w-full max-w-md bg-black border-gray-600">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-white">Authentication Required</h2>
            <p className="text-gray-400 mb-6">Please log in to view your notifications and connect with the community.</p>
            <Button onClick={() => navigate("/auth")} className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <Helmet>
        <title>Connect - Christ Collective</title>
        <meta name="description" content="Stay connected with the Christ Collective community through notifications and connections" />
      </Helmet>

      <div className="flex h-screen pt-16">
        {/* Left Sidebar - Notifications */}
        <div className="w-80 bg-gray-900 border-r border-gray-700 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="h-6 w-6 text-[#D4AF37]" />
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
              {unreadCount.count > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount.count}
                </span>
              )}
            </div>
            <NotificationsList />
          </div>
        </div>

        {/* Main Content - Connections */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Your Connections</h1>
                <p className="text-gray-400">
                  Manage your network and discover new members of the Christ Collective community.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Quick Actions */}
                <Card className="bg-gray-800 border-gray-700 hover:border-[#D4AF37] transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-[#D4AF37] bg-opacity-20 rounded-lg">
                        <Users className="h-6 w-6 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Profile & Network</h3>
                        <p className="text-gray-400 text-sm">Manage your profile and view connections</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => navigate("/profile")}
                        className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-black"
                      >
                        View Your Profile
                      </Button>
                      <Button 
                        onClick={() => navigate("/profile")}
                        variant="outline"
                        className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Edit Profile Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Discovery */}
                <Card className="bg-gray-800 border-gray-700 hover:border-[#D4AF37] transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-blue-500 bg-opacity-20 rounded-lg">
                        <MessageSquare className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Discover Community</h3>
                        <p className="text-gray-400 text-sm">Find creators, ministries, and businesses</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => navigate("/creators")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Browse Creators
                      </Button>
                      <Button 
                        onClick={() => navigate("/ministries")}
                        variant="outline"
                        className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Explore Ministries
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Feed Section */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-6 w-6 text-green-400" />
                      <h3 className="text-xl font-semibold text-white">Community Feed</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      onClick={() => navigate("/feed")}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 h-20 flex-col"
                    >
                      <MessageSquare className="h-6 w-6 mb-2" />
                      <span>Your Feed</span>
                    </Button>
                    <Button 
                      onClick={() => navigate("/campaigns")}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 h-20 flex-col"
                    >
                      <Bell className="h-6 w-6 mb-2" />
                      <span>Campaigns</span>
                    </Button>
                    <Button 
                      onClick={() => navigate("/businesses")}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 h-20 flex-col"
                    >
                      <Users className="h-6 w-6 mb-2" />
                      <span>Businesses</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}