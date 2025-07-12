import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Calendar, MapPin, Briefcase, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function ConnectPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  const { data: businesses, isLoading: businessesLoading } = useQuery({
    queryKey: ["/api/businesses"],
    enabled: !!user,
  });

  const { data: creators, isLoading: creatorsLoading } = useQuery({
    queryKey: ["/api/creators"],
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Connect</h1>
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Friends
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Welcome Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-[#D4AF37] rounded-full p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Build Your Christian Network</h2>
                <p className="text-muted-foreground">Connect with like-minded believers, business owners, and content creators in your community.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="businesses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          {/* Businesses Tab */}
          <TabsContent value="businesses">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Christian Businesses</h3>
                <Button variant="outline" size="sm" onClick={() => navigate("/business")}>
                  View All
                </Button>
              </div>
              
              {businessesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {businesses?.slice(0, 5).map((business: any) => (
                    <Card key={business.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>{business.businessName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{business.businessName}</h4>
                              <p className="text-sm text-gray-600 mt-1">{business.description?.substring(0, 100)}...</p>
                              <div className="flex items-center mt-2 space-x-2">
                                <Badge variant="outline">
                                  <Briefcase className="h-3 w-3 mr-1" />
                                  {business.industry}
                                </Badge>
                                <Badge variant="outline">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {business.location}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Button size="sm" variant="outline">
                              Connect
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/business/profile/${business.id}`)}>
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Creators Tab */}
          <TabsContent value="creators">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Content Creators</h3>
                <Button variant="outline" size="sm" onClick={() => navigate("/creators")}>
                  View All
                </Button>
              </div>
              
              {creatorsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {creators?.slice(0, 5).map((creator: any) => (
                    <Card key={creator.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={creator.avatar} />
                              <AvatarFallback>{creator.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{creator.displayName}</h4>
                              <p className="text-sm text-gray-600 mt-1">{creator.description?.substring(0, 100)}...</p>
                              <div className="flex items-center mt-2 space-x-2">
                                <Badge variant="outline">{creator.platform}</Badge>
                                <span className="text-sm text-gray-500">
                                  {creator.followers?.toLocaleString()} followers
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Button size="sm" variant="outline">
                              Follow
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/creators/${creator.id}`)}>
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community">
            <div className="space-y-6">
              {/* Community Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Community Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#D4AF37]">2,847</div>
                      <div className="text-sm text-gray-600">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#D4AF37]">156</div>
                      <div className="text-sm text-gray-600">Businesses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#D4AF37]">89</div>
                      <div className="text-sm text-gray-600">Creators</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#D4AF37]">432</div>
                      <div className="text-sm text-gray-600">Active Campaigns</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="bg-[#D4AF37] text-white rounded-lg p-2 text-center min-w-[60px]">
                        <div className="text-sm font-medium">JAN</div>
                        <div className="text-lg font-bold">15</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Christian Entrepreneurs Meetup</h4>
                        <p className="text-sm text-gray-600">Monthly networking event for faith-based business owners</p>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          Downtown Community Center
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        RSVP
                      </Button>
                    </div>

                    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="bg-[#D4AF37] text-white rounded-lg p-2 text-center min-w-[60px]">
                        <div className="text-sm font-medium">JAN</div>
                        <div className="text-lg font-bold">22</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Content Creator Workshop</h4>
                        <p className="text-sm text-gray-600">Learn strategies for Christian content creation</p>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          Online Event
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        RSVP
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Discussion Forums */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Community Discussions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <div>
                        <h4 className="font-medium">Faith & Business Balance</h4>
                        <p className="text-sm text-gray-600">How do you maintain your faith while running a business?</p>
                      </div>
                      <Badge variant="secondary">23 replies</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <div>
                        <h4 className="font-medium">Christian Content Ideas</h4>
                        <p className="text-sm text-gray-600">Share your best faith-based content strategies</p>
                      </div>
                      <Badge variant="secondary">18 replies</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <div>
                        <h4 className="font-medium">Prayer Requests</h4>
                        <p className="text-sm text-gray-600">Community prayer and support</p>
                      </div>
                      <Badge variant="secondary">45 replies</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}