import { useParams, Link, useLocation } from "wouter";
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
import { CalendarDays, Share2, Heart, Users, ImageIcon, PlayIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { Campaign, Donation } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import DonationSuccessPage from "./DonationSuccessPage";

export default function CampaignDetailsPage() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const { toast } = useToast();

  // Check for success parameter and redirect to success page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isSuccess = urlParams.get('success') === 'true';
    const paymentIntent = urlParams.get('payment_intent');
    const campaignId = urlParams.get('campaignId');
    
    if (isSuccess && paymentIntent && campaignId) {
      // Render the success page instead of campaign details
      return;
    }
  }, []);

  // If this is a success redirect, render the success page
  const urlParams = new URLSearchParams(window.location.search);
  const isSuccess = urlParams.get('success') === 'true';
  const paymentIntent = urlParams.get('payment_intent');
  const campaignId = urlParams.get('campaignId');
  
  if (isSuccess && paymentIntent && campaignId) {
    return <DonationSuccessPage />;
  }

  const { data: campaign = {} as Campaign, isLoading: isLoadingCampaign } = useQuery<Campaign>({
    queryKey: [`/api/campaigns/${slug}`],
  });

  const { data: donations = [], isLoading: isLoadingDonations } = useQuery<Donation[]>({
    queryKey: [campaign && 'id' in campaign ? `/api/campaigns/${campaign.id}/donations` : null],
    enabled: !!(campaign && 'id' in campaign),
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

  const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0.5; // Capture frame at 0.5 seconds

      video.onloadedmetadata = () => {
        video.currentTime = 0.5;
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnail);
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };

      video.onerror = () => reject(new Error('Video load error'));
      video.onabort = () => reject(new Error('Video load aborted'));
      video.src = videoUrl;
      video.load();
    });
  };

  useEffect(() => {
    if (campaign.video) {
      generateVideoThumbnail(campaign.video)
        .then(thumbnail => {
          setVideoThumbnail(thumbnail);
          // If there's no image, default to showing video
          if (!campaign.image) {
            setMediaType('video');
            setSelectedMedia(campaign.video);
          }
        })
        .catch(error => console.error('Error generating video thumbnail:', error));
    }
  }, [campaign.video, campaign.image]);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text: campaign.description,
          url: url,
        });
      } catch (error) {
        // User cancelled sharing, do nothing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Campaign link has been copied to your clipboard.",
        });
      } catch (error) {
        toast({
          title: "Unable to copy link",
          description: "Please copy the URL from your browser's address bar.",
          variant: "destructive",
        });
      }
    }
  };

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
          <Link href="/donate">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Browse Campaigns
            </button>
          </Link>
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

      <section className="bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <Link href="/donate" className="text-primary hover:text-primary/80 inline-flex items-center mb-6 font-medium">
              ← Back to All Campaigns
            </Link>

            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-black">{campaign.title}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="md:col-span-2">
              {/* Main media display (image or video) */}
              <div className="mb-4">
                {(campaign.image || campaign.video) ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer relative">
                        {/* Show video thumbnail if video exists and no image, or if video is selected */}
                        {campaign.video && (!campaign.image || mediaType === 'video') && videoThumbnail ? (
                          <img 
                            src={mediaType === 'video' && selectedMedia === campaign.video ? videoThumbnail : (videoThumbnail || campaign.image)} 
                            alt={campaign.title} 
                            className="w-full h-auto rounded-lg object-cover aspect-video"
                          />
                        ) : campaign.image ? (
                          <img 
                            src={selectedMedia || campaign.image} 
                            alt={campaign.title} 
                            className="w-full h-auto rounded-lg object-cover aspect-video"
                          />
                        ) : (
                          <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                            <PlayIcon size={64} className="text-gray-400" />
                          </div>
                        )}

                        {(mediaType === 'video' || (campaign.video && !campaign.image)) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                            <PlayIcon size={64} className="text-white" />
                          </div>
                        )}
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl bg-gray-900 border-gray-800">
                      <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4 text-white" />
                        <span className="sr-only">Close</span>
                      </DialogClose>
                      {mediaType === 'image' ? (
                        <img 
                          src={selectedMedia || campaign.image} 
                          alt={campaign.title} 
                          className="w-full h-auto max-h-[80vh] object-contain"
                        />
                      ) : (
                        <video
                          src={selectedMedia || campaign.video}
                          controls
                          className="w-full h-auto max-h-[80vh]"
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center mb-6">
                    <ImageIcon size={64} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Media gallery (additional images and video) */}
              <div className="grid grid-cols-6 gap-2 mb-6">
                {/* Main image thumbnail */}
                {campaign.image && (
                  <div 
                    className={`relative rounded-md overflow-hidden cursor-pointer aspect-square ${selectedMedia === campaign.image || (!selectedMedia && mediaType === 'image') ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => {
                      setSelectedMedia(campaign.image);
                      setMediaType('image');
                    }}
                  >
                    <img 
                      src={campaign.image} 
                      alt={`${campaign.title} - main`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Additional images thumbnails */}
                {campaign.additionalImages && campaign.additionalImages.length > 0 && campaign.additionalImages.map((img: string, idx: number) => (
                  <div 
                    key={`img-${idx}`}
                    className={`relative rounded-md overflow-hidden cursor-pointer aspect-square ${selectedMedia === img ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => {
                      setSelectedMedia(img);
                      setMediaType('image');
                    }}
                  >
                    <img 
                      src={img} 
                      alt={`${campaign.title} - ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}

                {/* Video thumbnail (if available) */}
                {campaign.video && (
                  <div 
                    className={`relative rounded-md overflow-hidden cursor-pointer aspect-square ${mediaType === 'video' ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => {
                      setSelectedMedia(campaign.video);
                      setMediaType('video');
                    }}
                  >
                    {videoThumbnail ? (
                      <img 
                        src={videoThumbnail} 
                        alt={`${campaign.title} - video`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <PlayIcon className="text-gray-400" size={24} />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayIcon size={32} className="text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground text-xs p-1 rounded">
                      Video
                    </div>
                  </div>
                )}
              </div>

              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold mb-4 text-black">About this campaign</h2>
                <p className="whitespace-pre-line text-gray-600">{campaign.description}</p>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="rounded-2xl">
                <CardHeader className="pb-2 bg-black rounded-t-2xl">
                  <CardTitle className="text-2xl text-black dark:text-white">
                    {formatCurrency(campaign.currentAmount)}
                  </CardTitle>
                  <CardDescription className="text-gray-700 dark:text-gray-300">
                    raised of {formatCurrency(campaign.goal)} goal
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-black rounded-b-2xl">
                  <Progress 
                    value={calculateProgress(campaign.currentAmount, campaign.goal)} 
                    className="h-2.5 mb-4" 
                  />

                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-6">
                    <div className="flex items-center">
                      <Users className="mr-1" size={16} />
                      <span>{donations.length} donors</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarDays className="mr-1" size={16} />
                      <span>
                        {campaign.createdAt ? format(new Date(campaign.createdAt), "MMM d, yyyy") : ""}
                      </span>
                    </div>
                  </div>

                  <Link href={`/donate/checkout/${campaign.id}`}>
                    <button className="w-full mb-3 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                      Donate Now
                    </button>
                  </Link>

                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1 flex items-center justify-center">
                      <Heart className="mr-2" size={16} />
                      Save
                    </Button>
                    <Button variant="outline" className="flex-1 flex items-center justify-center" onClick={handleShare}>
                      <Share2 className="mr-2" size={16} />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader className="bg-black rounded-t-2xl">
                  <CardTitle>Creator</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center bg-black rounded-b-2xl">
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
                    <p className="text-sm text-gray-800 dark:text-gray-300">
                      {campaign.user?.location || "Christ Collective Member"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-6 text-black">Recent Donations</h2>

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
                      </div>
                      <div className="font-medium">{formatCurrency(donation.amount)}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-2xl">
                <CardContent className="p-6 text-center bg-black rounded-2xl">
                  <p className="text-gray-300 mb-4">No donations yet. Be the first to contribute!</p>
                  <Link href={`/donate/checkout/${campaign.id}`}>
                    <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                      Make a Donation
                    </button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      </section>
    </>
  );
}