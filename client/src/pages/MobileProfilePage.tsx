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
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-lg">
                  {user.firstName?.[0] || user.username?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username}
                </h2>
                <p className="text-muted-foreground">@{user.username}</p>
                <div className="flex items-center mt-2">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-2 text-sm">
              {user.email && (
                <div className="flex items-center text-foreground">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  {user.email}
                </div>
              )}
              {user.phone && (
                <div className="flex items-center text-foreground">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  {user.phone}
                </div>
              )}
              {user.location && (
                <div className="flex items-center text-foreground">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  {user.location}
                </div>
              )}
              {user.bio && (
                <div className="flex items-start text-foreground mt-3">
                  <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                  <p>{user.bio}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Your Impact</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#D4AF37]">
                    ${userStats?.totalDonated?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-white">Donated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#D4AF37]">
                    {userStats?.campaignsSupported || 0}
                  </div>
                  <div className="text-sm text-white">Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#D4AF37]">
                    {userStats?.connectionsCount || 0}
                  </div>
                  <div className="text-sm text-white">Connections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#D4AF37]">
                    {userStats?.achievementsCount || 0}
                  </div>
                  <div className="text-sm text-white">Achievements</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Campaigns */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
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