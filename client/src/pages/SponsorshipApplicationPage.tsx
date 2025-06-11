import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
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
import { AlertCircle } from "lucide-react";

// Form schema based on the sponsorship applications table
const applicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  platform: z.string().min(1, "Please select a platform"),
  profileUrl: z.string().url("Please provide a valid profile URL"),
  content: z.string().min(10, "Please describe your content in at least 10 characters"),
  audience: z.string().optional(),
  subscriberCount: z.coerce.number().min(0, "Subscriber count must be 0 or greater").optional(),
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
      platform: "",
      profileUrl: "",
      content: "",
      audience: "",
      subscriberCount: undefined,
      message: "",
    },
  });

  // Mutation for submitting the application
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async (data: ApplicationValues) => {
      const response = await apiRequest("POST", "/api/sponsorship-applications", data);
      if (!response.ok) {
        const errorData = await response.json();
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
      toast({
        title: "Submission Failed",
        description: error.message,
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
      
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Content Creator Sponsorship Application</h1>
          <p className="text-lg">
            Join our network of sponsored content creators sharing faith-based messages across various platforms.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Sponsorship Application</CardTitle>
            <CardDescription>
              Fill out this form to apply for content creator sponsorship with Christ Collective.
              We review all applications carefully and will contact you if your content aligns with our mission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error instanceof Error ? error.message : "An error occurred while submitting your application."}
                </AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your primary platform" />
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
                    name="profileUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile URL *</FormLabel>
                        <FormControl>
                          <Input placeholder="https://platform.com/your-profile" {...field} />
                        </FormControl>
                        <FormDescription>
                          Link to your channel, profile, or page
                        </FormDescription>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    name="subscriberCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follower/Subscriber Count</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1000" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Why do you want to be sponsored? *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your mission, goals, and how sponsorship would help you..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto bg-[#D4AF37] hover:bg-[#B8860B] text-black"
                    disabled={isPending}
                  >
                    {isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col text-sm text-gray-500">
            <p>
              * Required fields
            </p>
            <p className="mt-2">
              By submitting this application, you agree to our review process and understand that sponsorship decisions are made at the discretion of Christ Collective.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default SponsorshipApplicationPage;