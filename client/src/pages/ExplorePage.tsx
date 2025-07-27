import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, TrendingUp, Users, DollarSign, Star } from "lucide-react";
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
    queryKey: ["/api/content-creators"],
    enabled: !!user,
  });

  const { data: businesses, isLoading: businessesLoading } = useQuery({
    queryKey: ["/api/business-profiles"],
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

  const filteredCampaigns = campaigns && Array.isArray(campaigns) ? campaigns.filter((campaign: any) =>
    campaign.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredCreators = creators && Array.isArray(creators) ? creators.filter((creator: any) =>
    creator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.content?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredBusinesses = businesses && Array.isArray(businesses) ? businesses.filter((business: any) =>
    business.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredMinistries = ministries && Array.isArray(ministries) ? ministries.filter((ministry: any) =>
    ministry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ministry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Explore</h1>
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
                  <Card key={campaign.id} className="hover:shadow-md transition-shadow border-gray-600 overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/donate/${campaign.slug}`)}>
                    {/* Black Header Section */}
                    <div className="bg-black px-3 py-2 border-b border-gray-600">
                      <div className="flex items-center">
                        <span className="text-[#D4AF37] font-semibold text-xs tracking-wide">CHRIST COLLECTIVE</span>
                      </div>
                    </div>
                    
                    {/* Black Content Section */}
                    <div className="bg-black px-3 py-3">
                      <div className="flex gap-3">
                        {/* Left side - Campaign cover image */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                            {campaign.imageUrl ? (
                              <img 
                                src={campaign.imageUrl} 
                                alt={campaign.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-gray-500 text-xs text-center">
                                <div className="w-6 h-6 mx-auto mb-1">📷</div>
                                <div className="text-[10px]">Cover</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right side - Campaign content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-sm mb-2">{campaign.title}</h4>
                          <p className="text-gray-300 text-xs mb-2 leading-relaxed">
                            {campaign.description?.substring(0, 50)}...
                          </p>
                          
                          {/* Stats Row */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></div>
                              <span className="text-[#D4AF37] font-semibold text-xs">
                                ${(campaign.currentAmount || campaign.raised || 401).toLocaleString()} raised
                              </span>
                            </div>
                            <span className="text-gray-400 text-xs">
                              ${(campaign.goal || 10000).toLocaleString()} goal
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Donate Button - Full width below */}
                      <button className="w-full bg-[#D4AF37] text-black font-semibold py-2 rounded-md text-xs hover:bg-[#B8941F] transition-colors mt-3">
                        Donate Now
                      </button>
                    </div>
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
                  <Card key={creator.id} className="hover:shadow-md transition-shadow cursor-pointer bg-black border-gray-600"
                        onClick={() => navigate(`/creators/${creator.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={creator.profileImage} />
                          <AvatarFallback>{creator.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-yellow-400">{creator.name}</h4>
                          <p className="text-sm text-white">{creator.bio?.substring(0, 60)}...</p>
                          <div className="flex items-center mt-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 leading-none">{creator.content}</Badge>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full mr-4" />
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                          <div className="h-4 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="h-4 bg-gray-100 rounded mb-3 w-full" />
                      <div className="h-4 bg-gray-100 rounded mb-3 w-full" />
                      <div className="h-4 bg-gray-100 rounded mb-4 w-3/4" />
                      <div className="flex justify-between">
                        <div className="h-6 bg-gray-200 rounded w-1/3" />
                        <div className="h-6 bg-gray-200 rounded w-1/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses?.slice(0, 6).map((business: any) => (
                  <Card key={business.id} className="hover:shadow-md transition-shadow cursor-pointer bg-black border-gray-600"
                        onClick={() => navigate(`/business/profile/${business.id}`)}>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        {business.logo ? (
                          <Avatar className="h-12 w-12 mr-4">
                            <AvatarImage src={business.logo} alt={business.companyName} />
                            <AvatarFallback>{business.companyName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar className="h-12 w-12 mr-4">
                            <AvatarFallback>{business.companyName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <h3 className="font-semibold text-yellow-400">{business.companyName}</h3>
                          <div className="inline-flex items-center justify-center w-auto min-w-[60px] h-6 px-3 bg-white rounded-full">
                            <p className="text-xs text-black font-medium">{business.industry}</p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-white mb-4 line-clamp-3">
                        {business.description}
                      </p>
                      
                      <div className="flex justify-between items-center text-sm">
                        {business.location && (
                          <span className="text-gray-300">
                            📍 {business.location}
                          </span>
                        )}
                        <Button variant="ghost" size="sm" className="text-yellow-400 hover:text-yellow-500">
                          View Profile
                        </Button>
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
                  <Card key={ministry.id} className="hover:shadow-md transition-shadow cursor-pointer bg-black border-gray-600"
                        onClick={() => navigate(`/ministry/profile/${ministry.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={ministry.logo} />
                          <AvatarFallback>{ministry.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-yellow-400">{ministry.name}</h4>
                          <p className="text-sm text-white mt-1">{ministry.description?.substring(0, 80)}...</p>
                          <div className="flex items-center mt-3">
                            <Badge variant="outline">{ministry.denomination}</Badge>
                            <span className="text-sm text-gray-300 ml-2">
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