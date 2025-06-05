import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  User,
  Briefcase,
  Heart,
  ImageIcon,
  CreditCard,
  Globe,
  Phone,
  Mail,
  MapPin,
  Pencil,
  CheckCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Helmet } from "react-helmet";

// Form schema for user profile
const userProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
});

// Form schema for business profile
const businessProfileSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(1, "Please select an industry"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  website: z.string().url().optional().or(z.literal("")),
  location: z.string().optional(),
  logo: z.string().url().optional().or(z.literal("")),
  networkingGoals: z.string().optional(),
});

type UserProfileFormValues = z.infer<typeof userProfileSchema>;
type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/auth");
    }
  }, [isAuthLoading, user, navigate]);

  // Fetch user's business profile if exists
  const { 
    data: businessProfile, 
    isLoading: isBusinessProfileLoading 
  } = useQuery({
    queryKey: ["/api/user/business-profile"],
    enabled: !!user,
    retry: false,
  });

  // Fetch user's campaigns
  const { 
    data: userCampaigns = [], 
    isLoading: isCampaignsLoading 
  } = useQuery({
    queryKey: ["/api/user/campaigns"],
    enabled: !!user,
  });

  // Fetch user's donations
  const { 
    data: userDonations = [], 
    isLoading: isDonationsLoading 
  } = useQuery({
    queryKey: ["/api/user/donations"],
    enabled: !!user,
  });

  // User profile form
  const userProfileForm = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      location: user?.location || "",
      bio: user?.bio || "",
    },
  });

  // Business profile form
  const businessProfileForm = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      companyName: businessProfile?.companyName || "",
      industry: businessProfile?.industry || "",
      description: businessProfile?.description || "",
      website: businessProfile?.website || "",
      location: businessProfile?.location || "",
      logo: businessProfile?.logo || "",
      networkingGoals: businessProfile?.networkingGoals || "",
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      userProfileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
      });
    }
  }, [user, userProfileForm]);

  // Update form values when business profile is loaded
  useEffect(() => {
    if (businessProfile) {
      businessProfileForm.reset({
        companyName: businessProfile.companyName || "",
        industry: businessProfile.industry || "",
        description: businessProfile.description || "",
        website: businessProfile.website || "",
        location: businessProfile.location || "",
        logo: businessProfile.logo || "",
        networkingGoals: businessProfile.networkingGoals || "",
      });
    }
  }, [businessProfile, businessProfileForm]);

  // Mutation to update user profile
  const updateUserProfileMutation = useMutation({
    mutationFn: async (data: UserProfileFormValues) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to create/update business profile
  const updateBusinessProfileMutation = useMutation({
    mutationFn: async (data: BusinessProfileFormValues) => {
      let response;
      if (businessProfile) {
        response = await apiRequest("PUT", `/api/business-profiles/${businessProfile.id}`, data);
      } else {
        response = await apiRequest("POST", "/api/business-profiles", data);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update business profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/business-profile"] });
      toast({
        title: "Business Profile Updated",
        description: "Your business profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handlers
  const onUserProfileSubmit = (data: UserProfileFormValues) => {
    updateUserProfileMutation.mutate(data);
  };

  const onBusinessProfileSubmit = (data: BusinessProfileFormValues) => {
    updateBusinessProfileMutation.mutate(data);
  };

  if (isAuthLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Industry options
  const industries = [
    "Technology",
    "Healthcare",
    "Education",
    "Retail",
    "Finance",
    "Manufacturing",
    "Construction",
    "Agriculture",
    "Energy",
    "Transportation",
    "Food & Beverage",
    "Media & Entertainment",
    "Hospitality",
    "Real Estate",
    "Consulting",
    "Legal Services",
    "Nonprofit",
    "Marketing",
    "Design",
    "Other"
  ];

  function formatCurrency(amount: string | number): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  }

  return (
    <>
      <Helmet>
        <title>Your Profile - Christ Collective</title>
        <meta name="description" content="Manage your profile, campaigns, donations, and business presence on Christ Collective." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
            <p className="text-gray-600">Manage your personal information, campaigns, donations, and business profile.</p>
          </header>
          
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <Card className="md:w-1/3">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || "User"} />
                    <AvatarFallback className="text-xl">
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : (user?.email?.split('@')[0] || "User")}
                  </h2>
                  <p className="text-gray-500 mb-6">{user?.email}</p>
                  
                  <div className="grid grid-cols-2 w-full gap-4 text-center">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {userCampaigns.length}
                      </div>
                      <div className="text-sm text-gray-500">Campaigns</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {userDonations.length}
                      </div>
                      <div className="text-sm text-gray-500">Donations</div>
                    </div>
                  </div>
                  
                  <div className="w-full mt-6">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.location.href = "/api/logout"}
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:w-2/3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader>
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      <User className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="business" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Business</span>
                    </TabsTrigger>
                    <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Heart className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Campaigns</span>
                    </TabsTrigger>
                    <TabsTrigger value="donations" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Donations</span>
                    </TabsTrigger>
                  </TabsList>
                  <CardDescription>
                    {activeTab === "profile" && "Manage your personal information and profile settings."}
                    {activeTab === "business" && "Update your business profile and networking preferences."}
                    {activeTab === "campaigns" && "View and manage your fundraising campaigns."}
                    {activeTab === "donations" && "Track your donation history and impact."}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <TabsContent value="profile" className="space-y-6">
                    <Form {...userProfileForm}>
                      <form onSubmit={userProfileForm.handleSubmit(onUserProfileSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={userProfileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="First Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={userProfileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Last Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={userProfileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Email" {...field} disabled />
                              </FormControl>
                              <FormDescription>
                                Your email address is managed by your login provider.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={userProfileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Phone Number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={userProfileForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="City, State, Country" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={userProfileForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us a bit about yourself" 
                                  rows={4}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="space-y-2">
                          <ImageUpload
                            currentImage={user?.profileImageUrl || ""}
                            onImageChange={async (imageUrl) => {
                              // Force refresh user data to get the updated profile image
                              await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                              await queryClient.refetchQueries({ queryKey: ["/api/user"] });
                              // Small delay to ensure the update is visible
                              setTimeout(() => {
                                queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                              }, 1000);
                              toast({
                                title: "Profile picture saved",
                                description: "Your profile picture has been updated and saved automatically.",
                              });
                            }}
                            uploadEndpoint="/api/upload/profile-image"
                            fieldName="image"
                            label="Profile Picture (saves automatically)"
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          disabled={updateUserProfileMutation.isPending || !userProfileForm.formState.isDirty}
                        >
                          {updateUserProfileMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="business">
                    {isBusinessProfileLoading ? (
                      <div className="py-8 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : businessProfile ? (
                      <Form {...businessProfileForm}>
                        <form onSubmit={businessProfileForm.handleSubmit(onBusinessProfileSubmit)} className="space-y-6">
                          <FormField
                            control={businessProfileForm.control}
                            name="companyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Company Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={businessProfileForm.control}
                              name="industry"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Industry</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select an industry" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {industries.map((industry) => (
                                        <SelectItem key={industry} value={industry}>
                                          {industry}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={businessProfileForm.control}
                              name="website"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Website</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={businessProfileForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Location</FormLabel>
                                <FormControl>
                                  <Input placeholder="City, State, Country" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={businessProfileForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe your business, services, and mission" 
                                    rows={4}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="space-y-2">
                            <ImageUpload
                              currentImage={businessProfile?.logo || ""}
                              onImageChange={(logoUrl) => {
                                businessProfileForm.setValue("logo", logoUrl);
                                queryClient.invalidateQueries({ queryKey: ["/api/user/business-profile"] });
                                toast({
                                  title: "Business logo updated",
                                  description: "Your business logo has been successfully updated.",
                                });
                              }}
                              uploadEndpoint="/api/upload/business-logo"
                              fieldName="logo"
                              label="Business Logo"
                            />
                          </div>
                          
                          <FormField
                            control={businessProfileForm.control}
                            name="networkingGoals"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Networking Goals</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="What are you hoping to achieve through our business network?" 
                                    rows={3}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-between items-center">
                            <div>
                              {businessProfile.membershipTierId && (
                                <div className="text-sm text-gray-500">
                                  <span className="font-medium">Current Membership:</span> {businessProfile.membershipTier?.name || "Active Membership"}
                                </div>
                              )}
                            </div>
                            
                            <Button 
                              type="submit" 
                              disabled={updateBusinessProfileMutation.isPending || !businessProfileForm.formState.isDirty}
                            >
                              {updateBusinessProfileMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                'Save Changes'
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <div className="py-8 text-center">
                        <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-medium mb-2">Create Your Business Profile</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          Join our Christian business network to connect with other professionals and grow your business.
                        </p>
                        
                        <Form {...businessProfileForm}>
                          <form onSubmit={businessProfileForm.handleSubmit(onBusinessProfileSubmit)} className="space-y-6 max-w-md mx-auto text-left">
                            <FormField
                              control={businessProfileForm.control}
                              name="companyName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Company Name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={businessProfileForm.control}
                              name="industry"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Industry</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select an industry" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {industries.map((industry) => (
                                        <SelectItem key={industry} value={industry}>
                                          {industry}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={businessProfileForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Business Description</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Describe your business, services, and mission" 
                                      rows={4}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="text-center">
                              <Button 
                                type="submit" 
                                disabled={updateBusinessProfileMutation.isPending}
                                className="w-full"
                              >
                                {updateBusinessProfileMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                  </>
                                ) : (
                                  'Create Business Profile'
                                )}
                              </Button>
                              <p className="mt-2 text-xs text-gray-500">
                                You can add more details after creating your profile.
                              </p>
                            </div>
                          </form>
                        </Form>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="campaigns">
                    {isCampaignsLoading ? (
                      <div className="py-8 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : userCampaigns.length > 0 ? (
                      <div className="space-y-4">
                        {userCampaigns.map((campaign: any) => (
                          <Card key={campaign.id}>
                            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <div className="flex-shrink-0 w-full sm:w-32 h-24 bg-gray-100 rounded-md flex items-center justify-center">
                                {campaign.image ? (
                                  <img 
                                    src={campaign.image} 
                                    alt={campaign.title} 
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                ) : (
                                  <ImageIcon className="h-8 w-8 text-gray-400" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="font-semibold truncate">{campaign.title}</h3>
                                <div className="text-sm text-gray-500 mb-2">
                                  Created on {formatDate(campaign.createdAt)}
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm">
                                  <div className="bg-gray-100 px-2 py-1 rounded-full">
                                    {formatCurrency(campaign.currentAmount)} raised
                                  </div>
                                  <div className="bg-gray-100 px-2 py-1 rounded-full">
                                    Goal: {formatCurrency(campaign.goal)}
                                  </div>
                                  <div className={`px-2 py-1 rounded-full ${
                                    campaign.isActive 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-red-100 text-red-800"
                                  }`}>
                                    {campaign.isActive ? "Active" : "Inactive"}
                                  </div>
                                </div>
                              </div>
                              
                              <Button 
                                asChild
                                variant="ghost" 
                                size="sm"
                              >
                                <Link href={`/campaigns/${campaign.slug}`} className="flex items-center">
                                  View <ArrowRight className="ml-1 h-4 w-4" />
                                </Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        
                        <div className="text-center pt-4">
                          <Link href="/campaigns/create">
                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                              Create New Campaign
                            </button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Campaigns Yet</h3>
                        <p className="text-gray-500 mb-6">
                          Share your story and start raising funds for causes you care about.
                        </p>
                        <Link href="/campaigns/create">
                          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                            Create Your First Campaign
                          </button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="donations">
                    {isDonationsLoading ? (
                      <div className="py-8 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : userDonations.length > 0 ? (
                      <div className="space-y-4">
                        {userDonations.map((donation: any) => (
                          <Card key={donation.id}>
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row justify-between">
                                <div>
                                  <h3 className="font-semibold">
                                    {donation.campaign?.title || "Campaign"}
                                  </h3>
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <CalendarDays size={14} className="mr-1" />
                                    {formatDate(donation.createdAt)}
                                  </div>
                                  {donation.message && (
                                    <p className="text-sm text-gray-600 mt-2 italic">
                                      "{donation.message}"
                                    </p>
                                  )}
                                </div>
                                <div className="mt-2 sm:mt-0 text-right">
                                  <div className="font-semibold text-lg">
                                    {formatCurrency(donation.amount)}
                                  </div>
                                  {donation.isAnonymous && (
                                    <div className="text-xs text-gray-500">Anonymous donation</div>
                                  )}
                                  <Button 
                                    asChild
                                    variant="ghost" 
                                    size="sm"
                                    className="mt-2"
                                  >
                                    <Link href={`/campaigns/${donation.campaign?.slug || "#"}`}>View Campaign</Link>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        <div className="text-center pt-4">
                          <Link href="/donate">
                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                              Browse More Campaigns
                            </button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Donations Yet</h3>
                        <p className="text-gray-500 mb-6">
                          When you make donations, they will appear here.
                        </p>
                        <Link href="/donate">
                          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                            Browse Campaigns
                          </button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
