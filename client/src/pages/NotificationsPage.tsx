import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationsList } from "@/components/NotificationsList";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "@phosphor-icons/react";

export default function NotificationsPage() {
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
          <title>Notifications - Christ Collective</title>
        </Helmet>
        <Card className="w-full max-w-md bg-black border-gray-800">
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

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 px-4 py-5">
          <Bell size={22} weight="fill" className="text-[#D4AF37]" />
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          {unreadCount.count > 0 && (
            <span className="bg-[#D4AF37] text-black text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount.count}
            </span>
          )}
        </div>

        <NotificationsList />
      </div>
    </div>
  );
}