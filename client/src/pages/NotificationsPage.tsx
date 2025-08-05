import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationsList } from "@/components/NotificationsList";
import { Bell, TestTube } from "lucide-react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
  });

  // Test mutation to create sample notifications
  const createTestNotification = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/notifications/test", {
        method: "POST",
        body: { 
          message: `Test notification created at ${new Date().toLocaleTimeString()}`,
          type: "info"
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Test notification created!",
        description: "Check the bell icon for the animation",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create test notification",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Helmet>
          <title>Notifications - Christ Collective</title>
          <meta name="description" content="View your notifications from the Christ Collective community" />
        </Helmet>
        <Card className="w-full max-w-md bg-black border-gray-600">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-white">Authentication Required</h2>
            <p className="text-gray-400 mb-6">Please log in to view your notifications.</p>
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
        <title>Notifications - Christ Collective</title>
        <meta name="description" content="Stay updated with notifications from the Christ Collective community" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-[#D4AF37]" />
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            {unreadCount.count > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount.count}
              </span>
            )}
          </div>
          
          {/* Test Button for Animation */}
          <Button
            onClick={() => createTestNotification.mutate()}
            disabled={createTestNotification.isPending}
            variant="outline" 
            size="sm"
            className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {createTestNotification.isPending ? "Creating..." : "Test Animation"}
          </Button>
        </div>
        
        <NotificationsList />
      </div>
    </div>
  );
}