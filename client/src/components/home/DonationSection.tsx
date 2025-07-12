import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type Campaign = {
  id: string;
  title: string;
  description: string;
  image?: string;
  goal: string;
  currentAmount: string;
  slug: string;
};

export default function DonationSection() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal: "",
  });

  // Fetch featured campaigns with error handling
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, { credentials: "include" });
        if (!res.ok) {
          if (res.status === 401) {
            // Return empty array for unauthorized users
            return [];
          }
          throw new Error('Failed to fetch campaigns');
        }
        return res.json();
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        return [];
      }
    },
    select: (data: Campaign[]) => data.slice(0, 2), // Only take first 2 for featured section
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a campaign",
        variant: "destructive",
      });
      return;
    }
    
    // Redirect to full create campaign page
    window.location.href = "/campaigns/create";
  };

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

  return (
    <section id="donate" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">Make a Difference</h2>
          <div className="w-16 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Support our community initiatives or create your own charitable campaign to help those in need.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-black">Featured Campaigns</h3>
            
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2].map((i) => (
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
              <div className="space-y-6">
                {campaigns.map((campaign: Campaign) => (
                  <Card key={campaign.id} className="overflow-hidden hover:shadow-md transition-shadow border border-gray-700 bg-black">
                    {campaign.image ? (
                      <img 
                        src={campaign.image} 
                        alt={campaign.title} 
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-black flex items-center justify-center">
                        <ImageIcon size={48} className="text-gray-600" />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <h4 className="text-xl font-semibold mb-2 text-white">{campaign.title}</h4>
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
                      <Link href={`/donate/checkout/${campaign.id}`}>
                        <button className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                          <span>Donate Now</span>
                        </button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-300">No campaigns found.</p>
              </Card>
            )}
            
          </div>
          
          <div className="bg-black rounded-xl p-8 border border-gray-700 hover:border-primary transition-colors">
            <h3 className="text-2xl font-semibold mb-6 text-white">Start Your Own Campaign</h3>
            <p className="text-gray-400 mb-6">
              Creating a fundraising campaign is simple. Share your story, set a goal, and start receiving support from our community.
            </p>
            
            <form onSubmit={handleCreateCampaign} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-white font-medium mb-2">Campaign Title</label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Give your campaign a clear title"
                />
              </div>
              
              <div>
                <label htmlFor="goal" className="block text-white font-medium mb-2">Fundraising Goal</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    $
                  </span>
                  <Input
                    id="goal"
                    name="goal"
                    type="number"
                    value={formData.goal}
                    onChange={handleInputChange}
                    className="pl-8"
                    placeholder="Amount needed"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-white font-medium mb-2">Campaign Description</label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Tell your story and explain the impact of donations"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Campaign Image</label>
                <div className="border-2 border-dashed border-gray-600 rounded-md p-6 text-center">
                  <ImageIcon className="mx-auto text-gray-400 text-3xl mb-3" size={32} />
                  <p className="text-gray-400 mb-2">
                    Drag and drop an image here, or click to select a file
                  </p>
                  <p className="text-xs text-gray-500">Recommended size: 1200 x 675 pixels</p>
                  <input type="file" className="hidden" />
                  <Button type="button" variant="outline" className="mt-4">
                    Select Image
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Create Campaign
              </Button>
              
              <div className="text-center mt-14">
                <Link href="/donate">
                  <span className="inline-block text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer">
                    View All Campaigns <span className="ml-2">→</span>
                  </span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
