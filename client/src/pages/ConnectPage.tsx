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

      <div className="min-h-screen bg-black text-white pb-20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Connections Section */}
          <div className="mb-12">
            <h1 className="text-2xl font-bold text-white mb-6">Connect</h1>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button 
                onClick={() => navigate("/profile")}
                className="h-16 bg-[#D4AF37] hover:bg-[#B8941F] text-black"
              >
                Your Profile
              </Button>
              <Button 
                onClick={() => navigate("/creators")}
                variant="outline"
                className="h-16 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Browse Creators
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate("/feed")}
                variant="outline"
                className="h-16 border-gray-600 text-gray-300 hover:bg-gray-700 flex-col"
              >
                <MessageSquare className="h-5 w-5 mb-1" />
                Feed
              </Button>
              <Button 
                onClick={() => navigate("/ministries")}
                variant="outline"
                className="h-16 border-gray-600 text-gray-300 hover:bg-gray-700 flex-col"
              >
                <Activity className="h-5 w-5 mb-1" />
                Ministries
              </Button>
              <Button 
                onClick={() => navigate("/campaigns")}
                variant="outline"
                className="h-16 border-gray-600 text-gray-300 hover:bg-gray-700 flex-col"
              >
                <Bell className="h-5 w-5 mb-1" />
                Campaigns
              </Button>
            </div>
          </div>

          {/* Notifications Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Bell className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-lg font-medium text-white">Notifications</h2>
              {unreadCount.count > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount.count}
                </span>
              )}
            </div>
            <NotificationsList />
          </div>
        </div>
      </div>
    </div>
  );
}