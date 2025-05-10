import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Briefcase, Filter } from "lucide-react";
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
      
      <section className="hero-section h-[400px] flex items-center justify-center">
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Christian Business Network</h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8">
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
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
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
                    <Card key={profile.id} className="hover:shadow-md transition-shadow">
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
                            <h3 className="font-semibold">{profile.companyName}</h3>
                            <p className="text-sm text-gray-300">{profile.industry}</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-200 mb-4 line-clamp-3">
                          {profile.description}
                        </p>
                        
                        <div className="flex justify-between items-center text-sm">
                          {profile.location && (
                            <span className="text-gray-500">
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
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Choose Your Membership</h2>
                <p className="text-lg text-gray-600">
                  Select the membership tier that best fits your business needs and networking goals.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {isLoadingTiers ? (
                  [1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-8">
                        <div className="h-6 bg-gray-200 rounded mb-2 w-1/2 mx-auto" />
                        <div className="h-8 bg-gray-200 rounded mb-2 w-1/3 mx-auto" />
                        <div className="h-4 bg-gray-100 rounded mb-6 w-2/3 mx-auto" />
                        <div className="space-y-3 mb-8">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="flex items-start">
                              <div className="w-4 h-4 bg-gray-200 rounded-full mt-1 mr-3" />
                              <div className="h-4 bg-gray-100 rounded w-full" />
                            </div>
                          ))}
                        </div>
                        <div className="h-10 bg-gray-200 rounded w-full" />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  tiers.map((tier, index) => {
                    const isPopular = index === 1;
                    
                    return (
                      <Card 
                        key={tier.id}
                        className={`
                          rounded-xl p-8 
                          ${isPopular 
                            ? 'border-2 border-primary relative transform hover:scale-105 transition-transform duration-300' 
                            : 'border hover:border-primary transition-colors'
                          }
                        `}
                      >
                        {isPopular && (
                          <div className="absolute top-0 right-0 bg-primary text-white font-medium py-1 px-4 rounded-bl-lg rounded-tr-lg">
                            Popular
                          </div>
                        )}
                        
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                          <div className="text-3xl font-bold mb-1">
                            ${tier.price}<span className="text-lg font-normal text-gray-400">/month</span>
                          </div>
                          <p className="text-gray-500">{tier.description}</p>
                        </div>
                        
                        <ul className="space-y-3 mb-8">
                          {tier.features.map((feature, i) => (
                            <li key={i} className="flex items-start">
                              <svg className="text-primary mt-1 mr-3 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span className="text-gray-600">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <Button
                          asChild
                          className={`w-full ${
                            isPopular
                              ? "bg-primary hover:bg-primary/90 text-white"
                              : "bg-transparent border border-primary text-primary hover:bg-primary hover:text-white"
                          }`}
                        >
                          {isAuthenticated ? (
                            <Link href={`/membership/checkout/${tier.id}`}>
                              <a>Get Started</a>
                            </Link>
                          ) : (
                            <a href="/api/login">Get Started</a>
                          )}
                        </Button>
                      </Card>
                    );
                  })
                )}
              </div>
              
              <div className="mt-16 max-w-4xl mx-auto">
                <h3 className="text-2xl font-semibold mb-6 text-center">Frequently Asked Questions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h4 className="font-semibold mb-2">What's included in the membership?</h4>
                    <p className="text-gray-600">
                      Each membership tier includes access to our business directory, networking events, and resources. Higher tiers offer enhanced visibility, priority access, and dedicated support.
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h4 className="font-semibold mb-2">Can I upgrade my membership later?</h4>
                    <p className="text-gray-600">
                      Yes, you can upgrade your membership at any time. Your new benefits will begin immediately, and your billing will be adjusted accordingly.
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h4 className="font-semibold mb-2">How do I connect with other businesses?</h4>
                    <p className="text-gray-600">
                      Once you join, you'll have access to our business directory where you can browse profiles and connect directly with other members. We also host regular virtual networking events.
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h4 className="font-semibold mb-2">Is there a refund policy?</h4>
                    <p className="text-gray-600">
                      We offer a 14-day satisfaction guarantee. If you're not satisfied with your membership within the first two weeks, contact us for a full refund.
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
