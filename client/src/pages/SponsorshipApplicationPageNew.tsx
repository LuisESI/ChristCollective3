import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Trash2 } from "lucide-react";

// Platform schema for individual platform entries
const platformSchema = z.object({
  platform: z.string().min(1, "Please select a platform"),
  profileUrl: z.string().url("Please provide a valid profile URL"),
  subscriberCount: z.coerce.number().min(0, "Subscriber count must be 0 or greater").optional(),
});

// Main application schema with multiple platforms
const applicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  platforms: z.array(platformSchema).min(1, "Please add at least one platform"),
  content: z.string().min(10, "Please describe your content in at least 10 characters"),
  audience: z.string().optional(),
  message: z.string().min(20, "Please tell us more about why you're applying (at least 20 characters)"),
});

type ApplicationValues = z.infer<typeof applicationSchema>;

function SponsorshipApplicationPage() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Create form
  const form = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : "",
      email: user?.email || "",
      platforms: [{ platform: "", profileUrl: "", subscriberCount: undefined }],
      content: "",
      audience: "",
      message: "",
    },
  });

  // Field array for platforms
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "platforms",
  });

  // Mutation for submitting the application
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async (data: ApplicationValues) => {
      console.log('Submitting application data:', data);
      const response = await apiRequest("POST", "/api/sponsorship-applications", data);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Application submission error:', errorData);
        
        // Handle specific validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((err: any) => 
            `${err.path ? err.path.join('.') + ': ' : ''}${err.message}`
          ).join(', ');
          throw new Error(`Validation errors: ${errorMessages}`);
        }
        
        throw new Error(errorData.message || "Failed to submit application");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your sponsorship application has been submitted successfully. We'll review it and get back to you soon.",
      });
      navigate("/profile");
    },
    onError: (error: Error) => {
      console.error('Application submission failed:', error);
      
      // Show more detailed error messages
      let description = error.message;
      
      if (error.message.includes("You already have a pending sponsorship application")) {
        description = "You already have a pending application. Please wait for review before submitting another.";
      } else if (error.message.includes("Invalid data") || error.message.includes("Validation errors")) {
        description = "Please check all fields are filled correctly. Ensure URLs are valid and all required fields are completed.";
      } else if (error.message.includes("Authentication") || error.message.includes("Unauthorized")) {
        description = "Please log in again and try submitting your application.";
      }
      
      toast({
        title: "Submission Failed",
        description,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ApplicationValues) => {
    if (!user) {
      toast({
        title: "Authentication Required", 
        description: "Please log in to submit a sponsorship application.",
        variant: "destructive",
      });
      return;
    }

    // Pre-submission validation
    const validationErrors: string[] = [];
    
    // Check if all platforms have valid URLs
    data.platforms.forEach((platform, index) => {
      if (!platform.platform) {
        validationErrors.push(`Platform ${index + 1}: Please select a platform`);
      }
      if (!platform.profileUrl) {
        validationErrors.push(`Platform ${index + 1}: Profile URL is required`);
      } else if (!platform.profileUrl.startsWith('http')) {
        validationErrors.push(`Platform ${index + 1}: URL must start with http:// or https://`);
      }
    });

    if (validationErrors.length > 0) {
      toast({
        title: "Please Fix Form Errors",
        description: validationErrors.join('; '),
        variant: "destructive",
      });
      return;
    }

    mutate(data);
  };

  // Redirect to login if not authenticated using useEffect
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('SponsorshipApplicationPage: User not authenticated, redirecting to auth');
      navigate("/auth");
    } else if (!isLoading && user) {
      console.log('SponsorshipApplicationPage: User authenticated, showing form');
    }
  }, [isLoading, user, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    console.log('SponsorshipApplicationPage: Loading authentication...');
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!user) {
    console.log('SponsorshipApplicationPage: No user, returning null');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Apply for Sponsorship | Christ Collective</title>
        <meta name="description" content="Apply to become a sponsored content creator with Christ Collective and share your faith-based content with our community." />
      </Helmet>
      
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-[#D4AF37]/20">
          <CardHeader className="text-center bg-gradient-to-r from-black to-gray-800 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">Sponsorship Application</CardTitle>
            <CardDescription className="text-gray-200">
              Join our community of faith-based content creators
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            {isError && error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Social Media Platforms Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-semibold">Social Media Platforms *</FormLabel>
                      <FormDescription>Add all platforms where you create content</FormDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ platform: "", profileUrl: "", subscriberCount: undefined })}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Platform
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg relative">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <FormField
                        control={form.control}
                        name={`platforms.${index}.platform` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Platform *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="YouTube">YouTube</SelectItem>
                                <SelectItem value="Instagram">Instagram</SelectItem>
                                <SelectItem value="TikTok">TikTok</SelectItem>
                                <SelectItem value="Twitter">Twitter/X</SelectItem>
                                <SelectItem value="Twitch">Twitch</SelectItem>
                                <SelectItem value="Facebook">Facebook</SelectItem>
                                <SelectItem value="Podcast">Podcast</SelectItem>
                                <SelectItem value="Blog">Blog/Website</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`platforms.${index}.profileUrl` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile URL *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://www.instagram.com/username" 
                                {...field}
                                onBlur={(e) => {
                                  field.onBlur();
                                  const value = e.target.value;
                                  if (value && !value.startsWith('http')) {
                                    form.setError(`platforms.${index}.profileUrl` as const, {
                                      type: 'manual',
                                      message: 'URL must start with http:// or https://'
                                    });
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                            <FormDescription className="text-xs text-gray-500">
                              Include the full URL (e.g., https://www.instagram.com/username)
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`platforms.${index}.subscriberCount` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Followers/Subscribers</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1000" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the type of content you create..."
                          className="resize-none"
                          {...field}
                        />
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
                        <Input placeholder="Young adults, families, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Why do you want to join? *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your faith journey and why you'd like to be sponsored..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-[#D4AF37] hover:bg-[#B8860B] text-black font-semibold"
                  disabled={isPending}
                >
                  {isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SponsorshipApplicationPage;