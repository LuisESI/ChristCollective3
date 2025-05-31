import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, ImageIcon, Plus } from "lucide-react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/useAuth";

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
  const { isAuthenticated } = useAuth();
  
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["/api/campaigns", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/campaigns?search=${encodeURIComponent(searchQuery)}` 
        : "/api/campaigns";
      const res = await fetch(url, { credentials: "include" });
      // Don't throw error for 401, just return empty array
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
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-black">Support Our Causes</h1>
            <p className="text-lg text-black max-w-4xl mx-auto">
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
            
            <Button asChild variant="default" className="w-full md:w-auto">
              {isAuthenticated ? (
                <Link href="/donate/create">
                  <span className="inline-flex items-center cursor-pointer">
                    <Plus className="mr-2" size={16} />
                    Create New Campaign
                  </span>
                </Link>
              ) : (
                <a href="/api/login" className="inline-flex items-center">
                  <Plus className="mr-2" size={16} />
                  Create New Campaign
                </a>
              )}
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
                <Card key={campaign.id} className="overflow-hidden hover:shadow-md transition-shadow bg-gray-800 border-gray-700">
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
                      <Link href={`/campaigns/${campaign.slug}`}>
                        <span className="hover:text-primary transition-colors cursor-pointer">
                          {campaign.title}
                        </span>
                      </Link>
                    </h3>
                    <p className="text-gray-200 mb-4">
                      {campaign.description.length > 100
                        ? campaign.description.substring(0, 100) + '...'
                        : campaign.description}
                    </p>
                    <div className="mb-4">
                      <Progress value={calculateProgress(campaign.currentAmount, campaign.goal)} className="h-2.5" />
                      <div className="flex justify-between mt-2 text-sm text-gray-300">
                        <span>{formatCurrency(campaign.currentAmount)} raised</span>
                        <span>{formatCurrency(campaign.goal)} goal</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button asChild variant="default" className="flex-1">
                        <Link href={`/donate/checkout/${campaign.id}`}>
                          <span className="cursor-pointer">Donate Now</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={`/campaigns/${campaign.slug}`}>
                          <span className="cursor-pointer">View Details</span>
                        </Link>
                      </Button>
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
              <Button asChild variant="default">
                {isAuthenticated ? (
                  <Link href="/campaigns/create">
                    <span className="cursor-pointer">Create a Campaign</span>
                  </Link>
                ) : (
                  <a href="/api/login">Sign in to Create a Campaign</a>
                )}
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
