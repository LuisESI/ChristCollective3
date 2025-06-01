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
  const { isAuthenticated } = useAuth();
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
  const tiers = membershipTiers.length > 0 ? membershipTiers : defaultTiers;
  
  // Industry options (derived from profiles)
  const industries = profiles.length > 0 
    ? ["all", ...new Set(profiles.map((p: BusinessProfile) => p.industry).filter(Boolean))]
    : ["all", "Technology", "Healthcare", "Education", "Retail", "Construction", "Finance", "Marketing"];
  
  // Filter and search profiles
  const filteredProfiles = profiles.filter((profile: BusinessProfile) => {
    const matchesSearch = !searchQuery || 
      profile.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesIndustry = industryFilter === "all" || profile.industry === industryFilter;
    
    return matchesSearch && matchesIndustry;
  });
  
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
              <a href="/api/login">Join Our Business Network</a>
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
                
                {isAuthenticated && (
                  <Button asChild className="w-full md:w-auto">
                    <Link href="/profile">
                      <a>
                        <Briefcase className="mr-2" size={16} />
                        Manage Your Profile
                      </a>
                    </Link>
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
                          <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                            <Link href={`/business/profile/${profile.id}`}>
                              <a>View Profile</a>
                            </Link>
                          </Button>
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
                    <Button asChild>
                      <Link href="/profile">
                        <a>Create Your Business Profile</a>
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <a href="/api/login">Join Our Network</a>
                    </Button>
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
                    <span className="text-sm font-medium text-gray-700">{filteredProfiles.length}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((filteredProfiles.length / 100) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {100 - filteredProfiles.length > 0 
                      ? `${100 - filteredProfiles.length} spots remaining for free lifetime membership`
                      : "Founding member program complete!"}
                  </p>
                </div>
              </div>
              
              {/* Founding Member Benefits */}
              <div className="max-w-4xl mx-auto">
                <Card className="bg-white border-2 border-primary/20 rounded-xl shadow-lg">
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                        <Users className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Founding Member Benefits</h3>
                      <p className="text-gray-600">Everything you need to grow your business network</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Business Directory Access</span>
                            <p className="text-sm text-gray-600">Connect with Christian business owners nationwide</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Monthly Newsletter</span>
                            <p className="text-sm text-gray-600">Stay updated with industry insights and opportunities</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Online Prayer Group</span>
                            <p className="text-sm text-gray-600">Join fellowship with like-minded professionals</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Networking Events</span>
                            <p className="text-sm text-gray-600">Exclusive access to member-only events</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Business Spotlight</span>
                            <p className="text-sm text-gray-600">Get featured in our community showcase</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-primary mt-1 mr-3 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Lifetime Access</span>
                            <p className="text-sm text-gray-600">No recurring fees, ever</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <Button 
                        size="lg" 
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                        disabled={filteredProfiles.length >= 100}
                      >
                        {filteredProfiles.length >= 100 ? "Program Complete" : "Join as Founding Member - FREE"}
                      </Button>
                      <p className="text-xs text-gray-500 mt-3">
                        {filteredProfiles.length < 100 
                          ? "Limited time offer - join now while spots are available"
                          : "Thank you to all our founding members!"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-16 max-w-4xl mx-auto">
                <h3 className="text-2xl font-semibold mb-6 text-center">Frequently Asked Questions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h4 className="font-semibold mb-2 text-black">What's included in founding membership?</h4>
                    <p className="text-gray-600">
                      Founding members get lifetime access to our business directory, monthly newsletters, online prayer groups, networking events, business spotlight opportunities, and all future features - completely free.
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h4 className="font-semibold mb-2 text-black">How many spots are left?</h4>
                    <p className="text-gray-600">
                      We're offering free lifetime membership to our first 100 members. Currently {100 - filteredProfiles.length} spots remain. Once we reach 100 members, we'll introduce paid membership tiers.
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h4 className="font-semibold mb-2 text-black">How do I connect with other businesses?</h4>
                    <p className="text-gray-600">
                      Once you join, you'll have access to our business directory where you can browse profiles and connect directly with other Christian business owners. We also host regular virtual networking events.
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h4 className="font-semibold mb-2 text-black">What happens after 100 members?</h4>
                    <p className="text-gray-600">
                      Founding members keep their lifetime access forever. New members after the first 100 will be offered paid membership plans, but founding members will always have free access to all features.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      <section className="py-16 bg-[#121212] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Grow Your Business with Like-Minded Christians?</h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
            Join our growing network of Christian business owners and professionals today.
          </p>
          <Button 
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isAuthenticated ? (
              <Link href="/profile">
                <a>Create Your Business Profile</a>
              </Link>
            ) : (
              <a href="/api/login">Join Our Network</a>
            )}
          </Button>
          
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">2,500+</div>
              <p className="text-gray-300">Business Members</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">120+</div>
              <p className="text-gray-300">Industries</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <p className="text-gray-300">Monthly Events</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">85%</div>
              <p className="text-gray-300">Connection Rate</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
