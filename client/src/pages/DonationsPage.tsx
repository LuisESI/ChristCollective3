import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, ImageIcon, Plus } from "lucide-react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/useAuth";
import CTASection from "@/components/home/CTASection";
import { buildApiUrl } from "@/lib/api-config";

type Campaign = {
  id: string;
  title: string;
  description: string;
  image?: string;
  goal: string;
  currentAmount: string;
  slug: string;
};

export default function DonationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [, navigate] = useLocation();
  
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/campaigns?search=${encodeURIComponent(searchQuery)}` 
        : "/api/campaigns";
      const res = await fetch(buildApiUrl(url), { credentials: "include" });
      if (res.status === 401) {
        return [];
      }
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    }
  });

  function calculateProgress(current: string, goal: string): number {
    const currentAmount = parseFloat(current) || 0;
    const goalAmount = parseFloat(goal) || 1;
    const percentage = (currentAmount / goalAmount) * 100;
    return Math.min(percentage, 100);
  }

  function formatCurrency(amount: string): string {
    const value = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the search state and query dependency
  };

  const handleCreateCampaign = () => {
    if (isAuthenticated) {
      navigate("/donate/create");
    } else {
      window.location.href = "/api/login";
    }
  };

  return (
    <>
      <Helmet>
        <title>Donate & Support - Christ Collective</title>
        <meta name="description" content="Support meaningful charitable initiatives or create your own campaign to help those in need. Join our community of giving." />
        <meta property="og:title" content="Donate & Support - Christ Collective" />
        <meta property="og:description" content="Support meaningful charitable initiatives that reflect Christian values. Make a difference today." />
      </Helmet>
      
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-black">Support Our Causes</h1>
            <p className="text-lg text-black">
              Browse our collection of charitable campaigns and support the causes that align with your values.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <form onSubmit={handleSearch} className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full md:w-80"
              />
            </form>
            
            <Button 
              onClick={handleCreateCampaign}
              className="w-full md:w-auto"
            >
              <Plus className="mr-2" size={16} />
              Create New Campaign
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="w-full h-48 bg-gray-200" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2 w-3/4" />
                    <div className="h-4 bg-gray-100 rounded mb-4 w-full" />
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4" />
                    <div className="h-10 bg-gray-200 rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign: Campaign) => (
                <Card key={campaign.id} className="overflow-hidden hover:shadow-md transition-shadow bg-black border-gray-700">
                  {campaign.image ? (
                    <img 
                      src={campaign.image} 
                      alt={campaign.title} 
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <ImageIcon size={48} className="text-gray-400" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-white">
                      <Link href={`/donate/${campaign.slug}`}>
                        <span className="hover:text-primary transition-colors cursor-pointer">
                          {campaign.title}
                        </span>
                      </Link>
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {campaign.description.length > 100
                        ? campaign.description.substring(0, 100) + '...'
                        : campaign.description}
                    </p>
                    <div className="mb-4">
                      <Progress value={calculateProgress(campaign.currentAmount, campaign.goal)} className="h-2.5" />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>{formatCurrency(campaign.currentAmount)} raised</span>
                        <span>{formatCurrency(campaign.goal)} goal</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/donate/checkout/${campaign.id}`} className="flex-1">
                        <button className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                          Donate Now
                        </button>
                      </Link>
                      <Link href={`/donate/${campaign.slug}`} className="flex-1">
                        <button className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No campaigns found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery ? `No results for "${searchQuery}"` : "There are no active campaigns at the moment."}
              </p>
              {isAuthenticated ? (
                <Link href="/campaigns/create">
                  <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    Create a Campaign
                  </button>
                </Link>
              ) : (
                <a href="/api/login" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  Sign in to Create a Campaign
                </a>
              )}
            </div>
          )}
        </div>
      </section>
      
      <CTASection />
    </>
  );
}
