import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationsList } from "@/components/NotificationsList";
import { Bell, Users, MessageSquare, Activity, TrendingUp } from "lucide-react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";

export default function ConnectPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: unreadCount = { count: 0 } } = useQuery({
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
        <meta name="description" content="Stay connected with the Christ Collective community through notifications and updates" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#D4AF37] to-white bg-clip-text text-transparent">
              Stay Connected
            </h1>
            <p className="text-gray-400 text-lg">
              Keep up with your community activity, notifications, and connections
            </p>
          </div>

          {/* Tabs for different connection features */}
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-800 border-gray-700">
              <TabsTrigger 
                value="notifications" 
                className="flex items-center space-x-2 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
                {unreadCount.count > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                    {unreadCount.count}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="flex items-center space-x-2 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
              <TabsTrigger 
                value="connections" 
                className="flex items-center space-x-2 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Connections</span>
              </TabsTrigger>
              <TabsTrigger 
                value="trending" 
                className="flex items-center space-x-2 data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Trending</span>
              </TabsTrigger>
            </TabsList>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <NotificationsList />
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Activity Feed</h3>
                  <p className="text-gray-400">
                    Your recent activities and interactions will appear here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Your Connections</h3>
                  <p className="text-gray-400 mb-6">
                    Manage your followers, following, and network connections.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => navigate("/profile")}
                      variant="outline" 
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      View Profile
                    </Button>
                    <Button 
                      onClick={() => navigate("/creators")}
                      variant="outline" 
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Discover Creators
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trending Tab */}
            <TabsContent value="trending" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Trending Content</h3>
                  <p className="text-gray-400 mb-6">
                    Discover what's popular in the Christ Collective community.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => navigate("/feed")}
                      variant="outline" 
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      View Feed
                    </Button>
                    <Button 
                      onClick={() => navigate("/ministries")}
                      variant="outline" 
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Explore Ministries
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}