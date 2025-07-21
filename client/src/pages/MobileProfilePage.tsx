import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Settings, Edit, DollarSign, Users, Star, Calendar, LogOut, User, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function MobileProfilePage() {
  const { user, isLoading, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  const { data: userCampaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns/user"],
    enabled: !!user,
  });

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-black border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Profile Header - Matching /profile layout */}
        <div className="mb-6">
          <div className="flex items-start space-x-4 mb-6">
            <Avatar className="h-20 w-20 border-4 border-[#D4AF37]">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-xl bg-gray-800 text-white">
                {user.firstName?.[0] || user.username?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username}
                </h2>
                {user.isAdmin && (
                  <Badge className="bg-[#D4AF37] text-black hover:bg-[#B8941F]">
                    Admin
                  </Badge>
                )}
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {statsLoading ? "..." : (userStats?.campaignCount || userCampaigns?.length || 0)}
                  </div>
                  <div className="text-xs text-gray-400">campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {statsLoading ? "..." : (userStats?.donationCount || 0)}
                  </div>
                  <div className="text-xs text-gray-400">donations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {statsLoading ? "..." : (userStats?.totalDonated || 0)}
                  </div>
                  <div className="text-xs text-gray-400">donated</div>
                </div>
              </div>

              {/* Contact Info - Controlled by privacy settings */}
              <div className="space-y-1 text-sm">
                {user.showEmail && user.email && (
                  <div className="text-white">{user.email}</div>
                )}
                {user.showLocation && user.location && (
                  <div className="flex items-center text-white">
                    <MapPin className="h-4 w-4 mr-1 text-red-500" />
                    {user.location}
                  </div>
                )}
                {user.showPhone && user.phone && (
                  <div className="flex items-center text-white">
                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                    {user.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate("/profile")}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button 
              variant="outline"
              onClick={handleLogout}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Settings Card */}
        <Card 
          className="mb-6 bg-black border-gray-600 cursor-pointer hover:bg-gray-900 transition-colors"
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

        {/* My Campaigns */}
        <Card className="mb-6 bg-black border-gray-600">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span>My Campaigns</span>
              <Button variant="outline" size="sm" onClick={() => navigate("/donate/create")}>
                Create New
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : userCampaigns?.length > 0 ? (
              <div className="space-y-3">
                {userCampaigns.slice(0, 3).map((campaign: any) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{campaign.title}</h4>
                      <div className="flex items-center mt-1 space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${campaign.raised?.toLocaleString() || 0}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/donate/${campaign.slug}`)}>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No campaigns yet</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/donate/create")}>
                  Create Your First Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="flex items-center space-x-2" onClick={() => navigate("/manage-campaigns")}>
                <DollarSign className="h-4 w-4" />
                <span>Manage Campaigns</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2" onClick={() => navigate("/business")}>
                <Users className="h-4 w-4" />
                <span>Network</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2" onClick={() => navigate("/creators")}>
                <Star className="h-4 w-4" />
                <span>Creators</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2" onClick={() => navigate("/creator-profile")}>
                <Briefcase className="h-4 w-4" />
                <span>Creator Profile</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings & Account */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Account & Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button 
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => navigate("/profile")}
              >
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5 text-gray-500" />
                  <span>Account Settings</span>
                </div>
                <Badge variant="outline">Edit</Badge>
              </button>
              
              <Separator />
              
              <button 
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors text-red-600"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </div>
                {logoutMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Badge */}
        {user.role === 'admin' && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-[#D4AF37] text-white">
                    Admin
                  </Badge>
                  <span className="text-sm font-medium">Administrator Access</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                  Admin Panel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}