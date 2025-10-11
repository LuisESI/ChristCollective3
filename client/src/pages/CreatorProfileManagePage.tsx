import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreatorStatus } from "@/hooks/useCreatorStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Trash2, User, Edit, Save, Calendar, Globe, Users, Play } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const platformOptions = [
  "YouTube", "Instagram", "TikTok", "Twitter", "Facebook", "LinkedIn", "Twitch", "Podcast"
];

const platformSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  profileUrl: z.string().url("Please enter a valid URL"),
  subscriberCount: z.number().optional(),
});

const creatorProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  content: z.string().min(1, "Content description is required"),
  audience: z.string().optional(),
  bio: z.string().optional(),
  platforms: z.array(platformSchema).min(1, "Please add at least one platform"),
});

type CreatorProfileFormData = z.infer<typeof creatorProfileSchema>;

export default function CreatorProfileManagePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: creatorStatus, isLoading: creatorLoading } = useCreatorStatus();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreatorProfileFormData>({
    resolver: zodResolver(creatorProfileSchema),
    defaultValues: {
      name: creatorStatus?.creatorProfile?.name || "",
      content: creatorStatus?.creatorProfile?.content || "",
      audience: creatorStatus?.creatorProfile?.audience || "",
      bio: creatorStatus?.creatorProfile?.bio || "",
      platforms: creatorStatus?.creatorProfile?.platforms || [{ platform: "", profileUrl: "", subscriberCount: undefined }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "platforms",
  });

  // Update form when creator data loads
  React.useEffect(() => {
    if (creatorStatus?.creatorProfile) {
      const profile = creatorStatus.creatorProfile;
      form.reset({
        name: profile.name,
        content: profile.content,
        audience: profile.audience || "",
        bio: profile.bio || "",
        platforms: profile.platforms.length > 0 ? profile.platforms : [{ platform: "", profileUrl: "", subscriberCount: undefined }],
      });
    }
  }, [creatorStatus, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: CreatorProfileFormData) => {
      if (!creatorStatus?.creatorProfile?.id) {
        throw new Error("Creator profile not found");
      }
      return apiRequest("PUT", `/api/content-creators/${creatorStatus.creatorProfile.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/creator-status'] });
      toast({
        title: "Profile Updated",
        description: "Your creator profile has been updated successfully.",
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

  const onSubmit = (data: CreatorProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  // Redirect if not authenticated or not a creator
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  if (!creatorLoading && !creatorStatus?.isCreator) {
    navigate("/");
    return null;
  }

  if (authLoading || creatorLoading) {
    return (
      <div className="min-h-screen bg-black dark:bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const creatorProfile = creatorStatus?.creatorProfile;

  return (
    <div className="min-h-screen bg-black dark:bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/creators">
            <Button variant="ghost" className="mb-4 text-white dark:text-foreground hover:bg-gray-800 dark:hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Creators
            </Button>
          </Link>
          
          <div className="flex items-center gap-6 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={creatorProfile?.profileImage || ""} alt={creatorProfile?.name || "Creator"} />
              <AvatarFallback className="bg-gray-800 text-[#D4AF37] text-2xl font-bold">
                {creatorProfile?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-3xl font-bold text-white dark:text-foreground">{creatorProfile?.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-[#D4AF37] text-black hover:bg-[#B8941F]">
                  {creatorProfile?.isSponsored ? 'Sponsored Creator' : 'Creator'}
                </Badge>
                {creatorProfile?.isSponsored && (
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Since {new Date().toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Management Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Stats */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5" />
                  Profile Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm text-white">Content: {creatorProfile?.content}</span>
                </div>
                {creatorProfile?.audience && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-sm text-white">Audience: {creatorProfile.audience}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white">Platforms:</p>
                  <div className="flex flex-wrap gap-2">
                    {(creatorProfile?.platforms as any[])?.map((platform, index) => (
                      <div key={index} className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-1">
                        <Globe className="w-3 h-3" />
                        <span className="text-xs font-medium text-gray-700 capitalize">
                          {platform.platform}
                        </span>
                        {platform.subscriberCount && (
                          <Badge variant="outline" className="text-xs ml-1 bg-yellow-400 text-black border-yellow-500">
                            {platform.subscriberCount >= 1000000 
                              ? `${(platform.subscriberCount / 1000000).toFixed(1)}M`
                              : platform.subscriberCount >= 1000 
                              ? `${(platform.subscriberCount / 1000).toFixed(1)}K`
                              : platform.subscriberCount}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Edit className="w-5 h-5" />
                  Edit Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Creator Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your creator name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="audience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Audience</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Young adults, Families" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe the type of content you create" rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Tell us about yourself and your mission" rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Platforms */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Social Media Platforms</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ platform: "", profileUrl: "", subscriberCount: undefined })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Platform
                        </Button>
                      </div>

                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                          <FormField
                            control={form.control}
                            name={`platforms.${index}.platform`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Platform</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {platformOptions.map((platform) => (
                                      <SelectItem key={platform} value={platform}>
                                        {platform}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`platforms.${index}.profileUrl`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Profile URL</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="https://..." />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-end gap-2">
                            <FormField
                              control={form.control}
                              name={`platforms.${index}.subscriberCount`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel>Followers</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      placeholder="0"
                                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => remove(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="bg-[#D4AF37] hover:bg-[#B8941F] text-black"
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}