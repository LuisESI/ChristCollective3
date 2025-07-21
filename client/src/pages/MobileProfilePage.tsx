import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Edit, ArrowLeft, MessageCircle, User } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Helmet } from "react-helmet";

export default function MobileProfilePage() {
  const { user, isLoading, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  const { data: creatorProfile, isLoading: creatorLoading } = useQuery({
    queryKey: ["/api/user/creator-status"],
    enabled: !!user,
  });

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
        <title>Profile - Christ Collective</title>
        <meta name="description" content="Your profile on Christ Collective - connect with the Christian community." />
      </Helmet>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-black border-b border-border p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/feed")}
                className="text-white hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-bold text-white">
                {user.firstName && user.lastName 
                  ? `${user.firstName} (${user.isAdmin ? 'Admin' : 'User'})`
                  : user.username}
              </h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/profile")}
              className="text-white hover:bg-gray-800"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Creator Profile Content */}
        <div className="px-4 py-6">
          {/* Profile Header */}
          <div className="flex items-start space-x-4 mb-6">
            <Avatar className="h-20 w-20 border-4 border-[#D4AF37]">
              <AvatarImage src={user.profileImageUrl} />
              <AvatarFallback className="text-xl bg-gray-800 text-white">
                {user.firstName?.[0] || user.username?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-xl font-bold text-white">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} (${user.isAdmin ? 'Admin' : 'User'})`
                    : user.username}
                </h2>
              </div>
              
              {creatorProfile?.isCreator && (
                <Badge className="bg-[#D4AF37] text-black hover:bg-[#B8941F] mb-3">
                  Sponsored Creator
                </Badge>
              )}

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {creatorProfile?.creatorProfile?.totalPosts || 5}
                  </div>
                  <div className="text-xs text-gray-400">posts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {creatorProfile?.creatorProfile?.totalFollowers ? 
                      `${(creatorProfile.creatorProfile.totalFollowers / 1000).toFixed(1)}K` : 
                      "57.2K"}
                  </div>
                  <div className="text-xs text-gray-400">followers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {creatorProfile?.creatorProfile?.platformCount || 3}
                  </div>
                  <div className="text-xs text-gray-400">platforms</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mb-6">
            <p className="text-white text-sm leading-relaxed">
              {creatorProfile?.creatorProfile?.bio || 
               user.bio || 
               "Building a worldwide Christian community through digital ministry and connecting believers across denominations."}
            </p>
          </div>

          {/* Creator Info */}
          {creatorProfile?.isCreator && (
            <div className="mb-6">
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Content:</span> Biblical Education / Podcast • 
                <span className="font-medium"> Audience:</span> Young adults • 
                <span className="font-medium">Sponsored since</span> June 22, 2025
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button 
              className="bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium"
              onClick={() => {
                // TODO: Implement follow functionality
              }}
            >
              Follow
            </Button>
            <Button 
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800"
              onClick={() => {
                // TODO: Implement message functionality
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>

          {/* Social Platform Icons */}
          <div className="flex justify-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IG</span>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">YT</span>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TT</span>
            </div>
          </div>

          {/* Settings Access */}
          <Card 
            className="bg-black border-gray-600 cursor-pointer hover:bg-gray-900 transition-colors"
            onClick={() => navigate("/privacy-settings")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#D4AF37] rounded-lg">
                    <User className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Profile Settings</h3>
                    <p className="text-sm text-gray-400">Manage your personal information and profile settings.</p>
                  </div>
                </div>
                <Settings className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}