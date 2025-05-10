import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageIcon, Upload } from "lucide-react";
import { Helmet } from "react-helmet";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  goal: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Goal must be a positive number"
  ),
  image: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateCampaignPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is authenticated
  if (!isLoading && !isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      goal: "",
      image: "",
      endDate: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest("POST", "/api/campaigns", {
        title: values.title,
        description: values.description,
        goal: parseFloat(values.goal),
        image: values.image,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create campaign");
      }
      
      const campaign = await response.json();
      
      toast({
        title: "Campaign Created!",
        description: "Your campaign has been created successfully.",
      });
      
      // Redirect to the campaign page
      navigate(`/campaigns/${campaign.slug}`);
    } catch (error: any) {
      toast({
        title: "Error creating campaign",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create a Campaign - Christ Collective</title>
        <meta name="description" content="Create a fundraising campaign and share your story with our community. Set a goal and start receiving support." />
        <meta property="og:title" content="Create a Campaign - Christ Collective" />
        <meta property="og:description" content="Create a fundraising campaign and share your story with our community." />
      </Helmet>
      
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Create a Campaign</h1>
          <p className="text-gray-600 mb-8">
            Share your story, set a goal, and let our community support your cause.
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Provide information about your campaign to inspire others to donate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Give your campaign a clear title" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Keep it concise and compelling.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fundraising Goal</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                              $
                            </span>
                            <Input 
                              type="number"
                              min="1"
                              step="0.01"
                              placeholder="Enter amount needed"
                              className="pl-8"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Set a realistic goal for your campaign.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          When will your campaign end? Leave blank for no end date.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell your story and explain the impact of donations"
                            rows={8}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Share why this cause matters and how donations will help.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Image (Optional)</FormLabel>
                        <FormControl>
                          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                            <ImageIcon className="mx-auto text-gray-400 text-3xl mb-3" size={32} />
                            <p className="text-gray-500 mb-2">
                              Drag and drop an image here, or enter an image URL
                            </p>
                            <p className="text-xs text-gray-400 mb-4">Recommended size: 1200 x 675 pixels</p>
                            <Input 
                              placeholder="Enter image URL"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          A compelling image can significantly increase donations.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/donate")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="min-w-[120px]"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Creating...</span>
                        </div>
                      ) : (
                        "Create Campaign"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
