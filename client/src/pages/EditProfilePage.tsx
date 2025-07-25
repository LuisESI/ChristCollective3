import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Briefcase, Church, Edit, Save, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Import form components
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Form schemas
const creatorProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  content: z.string().optional(),
  audience: z.string().optional(),
  youtubeUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  tiktokUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  profileImage: z.string().optional(),
});

const businessProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  description: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  employeeCount: z.string().optional(),
  foundedYear: z.string().optional(),
  profileImage: z.string().optional(),
});

export default function EditProfilePage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  // Fetch user profiles
  const { data: creatorStatus } = useQuery({
    queryKey: ["/api/user/creator-status"],
    enabled: !!user,
  });

  const { data: businessProfiles } = useQuery({
    queryKey: ["/api/business-profiles"],
    enabled: !!user,
  });

  const userBusinessProfile = businessProfiles?.find((profile: any) => profile.userId === user?.id);

  // Creator form
  const creatorForm = useForm({
    resolver: zodResolver(creatorProfileSchema),
    defaultValues: {
      name: creatorStatus?.creatorProfile?.name || "",
      bio: creatorStatus?.creatorProfile?.bio || "",
      content: creatorStatus?.creatorProfile?.content || "",
      audience: creatorStatus?.creatorProfile?.audience || "",
      youtubeUrl: "",
      instagramUrl: "",
      tiktokUrl: "",
      twitterUrl: "",
      facebookUrl: "",
      linkedinUrl: "",
      profileImage: creatorStatus?.creatorProfile?.profileImage || "",
    },
  });

  // Business form
  const businessForm = useForm({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      companyName: userBusinessProfile?.companyName || "",
      industry: userBusinessProfile?.industry || "",
      description: userBusinessProfile?.description || "",
      website: userBusinessProfile?.website || "",
      location: userBusinessProfile?.location || "",
      employeeCount: userBusinessProfile?.employeeCount || "",
      foundedYear: userBusinessProfile?.foundedYear || "",
      profileImage: userBusinessProfile?.profileImage || "",
    },
  });

  // Update form defaults when data loads
  useEffect(() => {
    if (creatorStatus?.creatorProfile) {
      const creator = creatorStatus.creatorProfile;
      creatorForm.reset({
        name: creator.name || "",
        bio: creator.bio || "",
        content: creator.content || "",
        audience: creator.audience || "",
        youtubeUrl: "",
        instagramUrl: "",
        tiktokUrl: "",
        twitterUrl: "",
        facebookUrl: "",
        linkedinUrl: "",
        profileImage: creator.profileImage || "",
      });
    }
  }, [creatorStatus, creatorForm]);

  useEffect(() => {
    if (userBusinessProfile) {
      businessForm.reset({
        companyName: userBusinessProfile.companyName || "",
        industry: userBusinessProfile.industry || "",
        description: userBusinessProfile.description || "",
        website: userBusinessProfile.website || "",
        location: userBusinessProfile.location || "",
        employeeCount: userBusinessProfile.employeeCount || "",
        foundedYear: userBusinessProfile.foundedYear || "",
        profileImage: userBusinessProfile.profileImage || "",
      });
    }
  }, [userBusinessProfile, businessForm]);

  // Mutations
  const updateCreatorMutation = useMutation({
    mutationFn: async (data: any) => {
      const platforms = [];
      if (data.youtubeUrl) platforms.push({ platform: "youtube", profileUrl: data.youtubeUrl });
      if (data.instagramUrl) platforms.push({ platform: "instagram", profileUrl: data.instagramUrl });
      if (data.tiktokUrl) platforms.push({ platform: "tiktok", profileUrl: data.tiktokUrl });
      if (data.twitterUrl) platforms.push({ platform: "twitter", profileUrl: data.twitterUrl });
      if (data.facebookUrl) platforms.push({ platform: "facebook", profileUrl: data.facebookUrl });
      if (data.linkedinUrl) platforms.push({ platform: "linkedin", profileUrl: data.linkedinUrl });

      const { youtubeUrl, instagramUrl, tiktokUrl, twitterUrl, facebookUrl, linkedinUrl, ...profileData } = data;
      
      if (creatorStatus?.creatorProfile?.id) {
        return apiRequest(`/api/content-creators/${creatorStatus.creatorProfile.id}`, {
          method: "PUT",
          body: { ...profileData, platforms },
        });
      } else {
        return apiRequest("/api/content-creators", {
          method: "POST",
          body: { ...profileData, platforms },
        });
      }
    },
    onSuccess: () => {
      toast({ title: "Creator profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/creator-status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating creator profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async (data: any) => {
      if (userBusinessProfile?.id) {
        return apiRequest(`/api/business-profiles/${userBusinessProfile.id}`, {
          method: "PUT",
          body: data,
        });
      } else {
        return apiRequest("/api/business-profiles", {
          method: "POST",
          body: data,
        });
      }
    },
    onSuccess: () => {
      toast({ title: "Business profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/business-profiles"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating business profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onCreatorSubmit = (data: any) => {
    updateCreatorMutation.mutate(data);
  };

  const onBusinessSubmit = (data: any) => {
    updateBusinessMutation.mutate(data);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  const hasCreatorProfile = creatorStatus?.isCreator;
  const hasBusinessProfile = !!userBusinessProfile;

  return (
    <>
      <Helmet>
        <title>Edit Profile - Christ Collective</title>
        <meta name="description" content="Edit your profile settings and manage your creator, business, and ministry profiles." />
      </Helmet>
      <div className="min-h-screen bg-black text-white pb-20">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/profile")}
                className="text-white hover:bg-white/10 p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold">Edit Profile</h1>
              <div className="w-9" /> {/* Spacer */}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Profile Overview */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16 ring-2 ring-gray-700">
                <AvatarImage src={user.profileImageUrl || ''} alt={user.firstName || user.username} />
                <AvatarFallback className="bg-gray-800 text-white text-lg font-bold">
                  {user.firstName?.[0] || user.username?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username}
                </h2>
                <div className="flex gap-2 mt-1">
                  {hasCreatorProfile && (
                    <Badge className="bg-[#D4AF37] text-black text-xs">Creator</Badge>
                  )}
                  {hasBusinessProfile && (
                    <Badge className="bg-blue-600 text-white text-xs">Business</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="creator" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Creator Profile
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Business Profile
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300">Username</label>
                    <p className="text-white">{user.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Email</label>
                    <p className="text-white">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300">Phone</label>
                    <p className="text-white">{user.phone || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Profile Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Edit className="w-5 h-5 text-[#D4AF37]" />
                        <div>
                          <h3 className="font-medium text-white">Content Creator</h3>
                          <p className="text-sm text-gray-400">Share your faith-based content</p>
                        </div>
                      </div>
                      {hasCreatorProfile ? (
                        <Badge className="bg-green-600 text-white">Active</Badge>
                      ) : (
                        <Button 
                          onClick={() => setActiveTab("creator")}
                          variant="outline" 
                          size="sm"
                          className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Create
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-blue-500" />
                        <div>
                          <h3 className="font-medium text-white">Business Profile</h3>
                          <p className="text-sm text-gray-400">Connect with Christian professionals</p>
                        </div>
                      </div>
                      {hasBusinessProfile ? (
                        <Badge className="bg-green-600 text-white">Active</Badge>
                      ) : (
                        <Button 
                          onClick={() => setActiveTab("business")}
                          variant="outline" 
                          size="sm"
                          className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Create
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Creator Profile Tab */}
            <TabsContent value="creator" className="space-y-4">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    {hasCreatorProfile ? "Edit Creator Profile" : "Create Creator Profile"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...creatorForm}>
                    <form onSubmit={creatorForm.handleSubmit(onCreatorSubmit)} className="space-y-4">
                      <FormField
                        control={creatorForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Display Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-800 border-gray-600 text-white"
                                placeholder="Your creator name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={creatorForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="bg-gray-800 border-gray-600 text-white"
                                placeholder="Tell your audience about yourself..."
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={creatorForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Content Type</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-gray-800 border-gray-600 text-white"
                                  placeholder="e.g., Biblical Education"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={creatorForm.control}
                          name="audience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Target Audience</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-gray-800 border-gray-600 text-white"
                                  placeholder="e.g., Young Adults"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Social Media URLs */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-white">Social Media Links</h4>
                        <div className="grid gap-3">
                          <FormField
                            control={creatorForm.control}
                            name="youtubeUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300">YouTube</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="bg-gray-800 border-gray-600 text-white"
                                    placeholder="https://youtube.com/@username"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={creatorForm.control}
                            name="instagramUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300">Instagram</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="bg-gray-800 border-gray-600 text-white"
                                    placeholder="https://instagram.com/username"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={creatorForm.control}
                            name="tiktokUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300">TikTok</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="bg-gray-800 border-gray-600 text-white"
                                    placeholder="https://tiktok.com/@username"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                        disabled={updateCreatorMutation.isPending}
                      >
                        {updateCreatorMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                            Saving...
                          </div>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {hasCreatorProfile ? "Update Creator Profile" : "Create Creator Profile"}
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Business Profile Tab */}
            <TabsContent value="business" className="space-y-4">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    {hasBusinessProfile ? "Edit Business Profile" : "Create Business Profile"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...businessForm}>
                    <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-4">
                      <FormField
                        control={businessForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Company Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-800 border-gray-600 text-white"
                                placeholder="Your company name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={businessForm.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Industry</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                  <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="consulting">Consulting</SelectItem>
                                <SelectItem value="ministry">Ministry</SelectItem>
                                <SelectItem value="nonprofit">Non-Profit</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={businessForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Company Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="bg-gray-800 border-gray-600 text-white"
                                placeholder="Describe your company and mission..."
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={businessForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Website</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-gray-800 border-gray-600 text-white"
                                  placeholder="https://yourcompany.com"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={businessForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Location</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-gray-800 border-gray-600 text-white"
                                  placeholder="City, State"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={businessForm.control}
                          name="employeeCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Employee Count</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue placeholder="Select size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-gray-800 border-gray-600">
                                  <SelectItem value="1">Just me</SelectItem>
                                  <SelectItem value="2-10">2-10 employees</SelectItem>
                                  <SelectItem value="11-50">11-50 employees</SelectItem>
                                  <SelectItem value="51-200">51-200 employees</SelectItem>
                                  <SelectItem value="201-500">201-500 employees</SelectItem>
                                  <SelectItem value="500+">500+ employees</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={businessForm.control}
                          name="foundedYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Founded Year</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-gray-800 border-gray-600 text-white"
                                  placeholder="2020"
                                  type="number"
                                  min="1900"
                                  max={new Date().getFullYear()}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                        disabled={updateBusinessMutation.isPending}
                      >
                        {updateBusinessMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            Saving...
                          </div>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {hasBusinessProfile ? "Update Business Profile" : "Create Business Profile"}
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}