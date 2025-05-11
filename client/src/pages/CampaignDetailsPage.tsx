import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Share2, Heart, Users, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { Helmet } from "react-helmet";

export default function CampaignDetailsPage() {
  const { slug } = useParams();

  const { data: campaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: [`/api/campaigns/${slug}`],
  });

  const { data: donations = [], isLoading: isLoadingDonations } = useQuery({
    queryKey: [campaign?.id ? `/api/campaigns/${campaign.id}/donations` : null],
    enabled: !!campaign?.id,
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

  if (isLoadingCampaign) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4 w-3/4" />
            <div className="w-full h-64 bg-gray-200 rounded-lg mb-6" />
            <div className="h-6 bg-gray-200 rounded mb-2 w-1/2" />
            <div className="h-4 bg-gray-100 rounded mb-2 w-full" />
            <div className="h-4 bg-gray-100 rounded mb-2 w-full" />
            <div className="h-4 bg-gray-100 rounded mb-4 w-3/4" />
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6" />
            <div className="h-10 bg-gray-200 rounded w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
          <p className="text-gray-300 mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/donate">
              <a>Browse Campaigns</a>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{campaign.title} - Christ Collective</title>
        <meta name="description" content={campaign.description.substring(0, 160)} />
        <meta property="og:title" content={`${campaign.title} - Christ Collective`} />
        <meta property="og:description" content={campaign.description.substring(0, 160)} />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <div className="bg-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Link href="/donate">
            <a className="text-primary hover:text-primary/80 inline-flex items-center mb-6">
              ← Back to All Campaigns
            </a>
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-6">{campaign.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="md:col-span-2">
              {campaign.image ? (
                <img 
                  src={campaign.image} 
                  alt={campaign.title} 
                  className="w-full h-auto rounded-lg mb-6"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-6">
                  <ImageIcon size={64} className="text-gray-400" />
                </div>
              )}
              
              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold mb-4">About this campaign</h2>
                <p className="whitespace-pre-line">{campaign.description}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl">
                    {formatCurrency(campaign.currentAmount)}
                  </CardTitle>
                  <CardDescription>
                    raised of {formatCurrency(campaign.goal)} goal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress 
                    value={calculateProgress(campaign.currentAmount, campaign.goal)} 
                    className="h-2.5 mb-4" 
                  />
                  
                  <div className="flex justify-between text-sm text-gray-500 mb-6">
                    <div className="flex items-center">
                      <Users className="mr-1" size={16} />
                      <span>{donations.length} donors</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarDays className="mr-1" size={16} />
                      <span>
                        {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  
                  <Button asChild className="w-full mb-3">
                    <Link href={`/donate/checkout/${campaign.id}`}>
                      <a>Donate Now</a>
                    </Link>
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1 flex items-center justify-center">
                      <Heart className="mr-2" size={16} />
                      Save
                    </Button>
                    <Button variant="outline" className="flex-1 flex items-center justify-center">
                      <Share2 className="mr-2" size={16} />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Creator</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center">
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarImage 
                      src={campaign.user?.profileImageUrl} 
                      alt={campaign.user?.firstName || "Campaign Creator"} 
                    />
                    <AvatarFallback>
                      {campaign.user?.firstName?.[0] || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {campaign.user?.firstName 
                        ? `${campaign.user.firstName} ${campaign.user.lastName || ''}`
                        : "Campaign Creator"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {campaign.user?.location || "Christ Collective Member"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-6">Recent Donations</h2>
            
            {isLoadingDonations ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full mr-4" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                      </div>
                      <div className="h-5 bg-gray-200 rounded w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : donations.length > 0 ? (
              <div className="space-y-4">
                {donations.map((donation: any) => (
                  <Card key={donation.id}>
                    <CardContent className="p-4 flex items-center">
                      <Avatar className="h-10 w-10 mr-4">
                        <AvatarImage 
                          src={donation.user?.profileImageUrl} 
                          alt={donation.isAnonymous ? "Anonymous" : (donation.user?.firstName || "Donor")}
                        />
                        <AvatarFallback>
                          {donation.isAnonymous 
                            ? "A" 
                            : (donation.user?.firstName?.[0] || "D")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {donation.isAnonymous
                            ? "Anonymous"
                            : (donation.user?.firstName
                              ? `${donation.user.firstName} ${donation.user.lastName || ''}`
                              : "Generous Donor")}
                        </h3>
                        {donation.message && (
                          <p className="text-sm text-gray-500">{donation.message}</p>
                        )}
                      </div>
                      <div className="font-medium">{formatCurrency(donation.amount)}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500 mb-4">No donations yet. Be the first to contribute!</p>
                  <Button asChild>
                    <Link href={`/donate/checkout/${campaign.id}`}>
                      <a>Make a Donation</a>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
