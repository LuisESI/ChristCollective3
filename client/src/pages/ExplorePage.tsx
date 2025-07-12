import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, TrendingUp, Users, DollarSign, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function ExplorePage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    enabled: !!user,
  });

  const { data: creators, isLoading: creatorsLoading } = useQuery({
    queryKey: ["/api/creators"],
    enabled: !!user,
  });

  const { data: businesses, isLoading: businessesLoading } = useQuery({
    queryKey: ["/api/businesses"],
    enabled: !!user,
  });

  const { data: ministries, isLoading: ministriesLoading } = useQuery({
    queryKey: ["/api/ministries"],
    enabled: !!user,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  const categories = [
    { id: "all", label: "All", icon: TrendingUp },
    { id: "campaigns", label: "Campaigns", icon: DollarSign },
    { id: "creators", label: "Creators", icon: Star },
    { id: "businesses", label: "Businesses", icon: Users },
    { id: "ministries", label: "Ministries", icon: Star },
  ];

  const filteredCampaigns = campaigns?.filter((campaign: any) =>
    campaign.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCreators = creators?.filter((creator: any) =>
    creator.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBusinesses = businesses?.filter((business: any) =>
    business.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMinistries = ministries?.filter((ministry: any) =>
    ministry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ministry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Explore</h1>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns, creators, businesses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Category Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <Icon className="h-4 w-4" />
                <span>{category.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Trending Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Trending Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <Badge variant="secondary">#1</Badge>
                <div>
                  <p className="font-medium">Faith-Based Businesses</p>
                  <p className="text-sm text-muted-foreground">Growing 15% this week</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <Badge variant="secondary">#2</Badge>
                <div>
                  <p className="font-medium">Mission Trips</p>
                  <p className="text-sm text-muted-foreground">45 new campaigns</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns Section */}
        {(selectedCategory === "all" || selectedCategory === "campaigns") && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Featured Campaigns</h3>
            {campaignsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCampaigns?.slice(0, 6).map((campaign: any) => (
                  <Card key={campaign.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/donate/${campaign.slug}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{campaign.title?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{campaign.description?.substring(0, 80)}...</p>
                          <div className="flex items-center justify-between mt-3">
                            <Badge variant="secondary">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${campaign.raised?.toLocaleString() || 0}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(((campaign.raised || 0) / (campaign.goal || 1)) * 100)}% funded
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Creators Section */}
        {(selectedCategory === "all" || selectedCategory === "creators") && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Popular Creators</h3>
            {creatorsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCreators?.slice(0, 6).map((creator: any) => (
                  <Card key={creator.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/creators/${creator.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={creator.avatar} />
                          <AvatarFallback>{creator.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-yellow-400">{creator.displayName}</h4>
                          <p className="text-sm text-gray-600">{creator.description?.substring(0, 60)}...</p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline">{creator.platform}</Badge>
                            <span className="text-sm text-gray-500">
                              {creator.followers?.toLocaleString()} followers
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Businesses Section */}
        {(selectedCategory === "all" || selectedCategory === "businesses") && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Featured Businesses</h3>
            {businessesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBusinesses?.slice(0, 6).map((business: any) => (
                  <Card key={business.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/business/profile/${business.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{business.businessName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{business.businessName}</h4>
                          <p className="text-sm text-gray-600 mt-1">{business.description?.substring(0, 80)}...</p>
                          <div className="flex items-center mt-3">
                            <Badge variant="outline">{business.industry}</Badge>
                            <span className="text-sm text-gray-500 ml-2">
                              {business.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ministries Section */}
        {(selectedCategory === "all" || selectedCategory === "ministries") && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Featured Ministries</h3>
            {ministriesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMinistries?.slice(0, 6).map((ministry: any) => (
                  <Card key={ministry.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/ministry/profile/${ministry.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={ministry.logo} />
                          <AvatarFallback>{ministry.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{ministry.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{ministry.description?.substring(0, 80)}...</p>
                          <div className="flex items-center mt-3">
                            <Badge variant="outline">{ministry.denomination}</Badge>
                            <span className="text-sm text-gray-500 ml-2">
                              {ministry.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}