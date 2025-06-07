import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Briefcase, Filter, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet";

type BusinessProfile = {
  id: number;
  companyName: string;
  industry: string;
  description: string;
  logo?: string;
  location: string;
  networkingGoals?: string;
  user: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
};

type MembershipTier = {
  id: number;
  name: string;
  price: string;
  description: string;
  features: string[];
};

export default function BusinessNetworkPage() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  
  // Fetch business profiles
  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ["/api/business-profiles"],
  });
  
  // Fetch membership tiers
  const { data: membershipTiers = [], isLoading: isLoadingTiers } = useQuery({
    queryKey: ["/api/membership-tiers"],
  });
  
  // Fetch live statistics
  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/statistics"],
  });
  
  // Default membership tiers if API fails or while loading
  const defaultTiers: MembershipTier[] = [
    {
      id: 1,
      name: "Basic Membership",
      price: "9",
      description: "Perfect for startups and small businesses",
      features: [
        "Basic profile in our business directory",
        "Access to monthly virtual networking events",
        "Join industry-specific groups",
        "Email support"
      ]
    },
    {
      id: 2,
      name: "Professional Membership",
      price: "29",
      description: "For established businesses and professionals",
      features: [
        "Enhanced profile with portfolio showcase",
        "Priority access to all networking events",
        "1:1 business matchmaking service",
        "Access to exclusive resources and training",
        "Priority support"
      ]
    },
    {
      id: 3,
      name: "Executive Membership",
      price: "99",
      description: "For industry leaders and executives",
      features: [
        "Premium featured profile with brand spotlight",
        "VIP access to all events including exclusive executive roundtables",
        "Dedicated business advisor",
        "Opportunity to host and speak at events",
        "All Professional benefits plus executive coaching sessions"
      ]
    }
  ];
  
  // Use API data if available, otherwise use default tiers
  const tiers = Array.isArray(membershipTiers) && membershipTiers.length > 0 ? membershipTiers : defaultTiers;
  
  // Industry options (derived from profiles)
  const industries = Array.isArray(profiles) && profiles.length > 0 
    ? ["all", ...new Set(profiles.map((p: BusinessProfile) => p.industry).filter(Boolean))]
    : ["all", "Technology", "Healthcare", "Education", "Retail", "Construction", "Finance", "Marketing"];
  
  // Filter and search profiles
  const filteredProfiles = Array.isArray(profiles) ? profiles.filter((profile: BusinessProfile) => {
    const matchesSearch = !searchQuery || 
      profile.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesIndustry = industryFilter === "all" || profile.industry === industryFilter;
    
    return matchesSearch && matchesIndustry;
  }) : [];
  
  return (
    <>
      <Helmet>
        <title>Business Network - Christ Collective</title>
        <meta name="description" content="Connect with other Christian business owners and professionals who share your values. Join our business network today." />
        <meta property="og:title" content="Business Network - Christ Collective" />
        <meta property="og:description" content="Connect with other Christian business owners and professionals who share your values." />
      </Helmet>
      
      <section className="hero-section h-[280px] flex items-center justify-center bg-black">
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Christian Business Network</h1>
          <p className="text-lg md:text-xl max-w-5xl mx-auto mb-8">
            Connect with Christian business owners and professionals who share your values and faith.
          </p>
          {!isAuthenticated && (
            <Button 
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <a href="/auth">Join Our Business Network</a>
            </Button>
          )}
        </div>
      </section>
      
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="directory" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-10">
              <TabsTrigger value="directory" className="text-lg">Directory</TabsTrigger>
              <TabsTrigger value="membership" className="text-lg">Membership</TabsTrigger>
            </TabsList>
            
            <TabsContent value="directory" className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="w-full md:w-auto flex flex-1 gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 dark:text-gray-400" size={18} />
                    <Input
                      type="text"
                      placeholder="Search businesses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Filter size={16} className="mr-2" />
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry === "all" ? "All Industries" : industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {isAuthenticated ? (
                  <Link href="/profile">
                    <button className="w-full md:w-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                      <Briefcase className="mr-2" size={16} />
                      Manage Your Profile
                    </button>
                  </Link>
                ) : (
                  <Button 
                    asChild
                    className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white"
                  >
                    <a href="/auth">Join Our Network</a>
                  </Button>
                )}
              </div>
              
              {isLoadingProfiles ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
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
              ) : filteredProfiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProfiles.map((profile: BusinessProfile) => (
                    <Card key={profile.id} className="hover:shadow-md transition-shadow bg-black border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-center mb-4">
                          {profile.logo ? (
                            <Avatar className="h-12 w-12 mr-4">
                              <AvatarImage src={profile.logo} alt={profile.companyName} />
                              <AvatarFallback>{profile.companyName.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <Avatar className="h-12 w-12 mr-4">
                              <AvatarFallback>{profile.companyName.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <h3 className="font-semibold text-white">{profile.companyName}</h3>
                            <p className="text-sm text-primary">{profile.industry}</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-200 mb-4 line-clamp-3">
                          {profile.description}
                        </p>
                        
                        <div className="flex justify-between items-center text-sm">
                          {profile.location && (
                            <span className="text-gray-300">
                              📍 {profile.location}
                            </span>
                          )}
                          {isAuthenticated ? (
                            <Link href={`/business/profile/${profile.id}`}>
                              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 text-primary hover:text-primary/80">
                                View Profile
                              </button>
                            </Link>
                          ) : (
                            <a href="/auth" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 text-primary hover:text-primary/80">
                              View Profile
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No businesses found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery || industryFilter !== "all" 
                      ? "No results match your search criteria. Try adjusting your filters."
                      : "There are no business profiles yet. Be the first to join our network!"}
                  </p>
                  {isAuthenticated ? (
                    <Link href="/profile">
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                        Create Your Business Profile
                      </button>
                    </Link>
                  ) : (
                    <a href="/auth" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                      Join Our Network
                    </a>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="membership" className="space-y-10">
              <div className="max-w-4xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Founding Member Program</h2>
                <p className="text-lg text-gray-600 mb-8">
                  Join our exclusive founding member program! The first 100 members get lifetime access for FREE.
                </p>
                
                {/* Progress Bar */}
                <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Founding Members</span>
                    <span className="text-sm font-medium text-gray-700">{(statistics as any)?.communityMembers || 0}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(((statistics as any)?.communityMembers || 0) / 100 * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {100 - ((statistics as any)?.communityMembers || 0) > 0 
                      ? `${100 - ((statistics as any)?.communityMembers || 0)} spots remaining for free lifetime membership`
                      : "Founding member program complete!"}
                  </p>
                </div>
                
                {isAuthenticated ? (
                  <Link href="/profile">
                    <button className="bg-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors">
                      Join as Founding Member - FREE
                    </button>
                  </Link>
                ) : (
                  <a href="/auth" className="bg-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors inline-block">
                    Join as Founding Member - FREE
                  </a>
                )}
              </div>
              
              {/* Membership Tiers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {tiers.map((tier: MembershipTier) => (
                  <Card key={tier.id} className="relative">
                    <CardContent className="p-8">
                      <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                      <div className="text-3xl font-bold text-primary mb-4">
                        ${tier.price}<span className="text-sm text-gray-500">/month</span>
                      </div>
                      <p className="text-gray-600 mb-6">{tier.description}</p>
                      
                      <ul className="space-y-3 mb-8">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle size={16} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button className="w-full">Choose Plan</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{(statistics as any)?.communityMembers || 0}+</div>
                  <p className="text-gray-600">Community Members</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">12+</div>
                  <p className="text-gray-600">Industries Represented</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                  <p className="text-gray-600">Support Available</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </>
  );
}