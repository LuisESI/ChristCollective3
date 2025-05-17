import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ImageIcon, X } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  goal: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0, 
    { message: "Goal must be a positive number" }
  ),
  isActive: z.boolean().default(true),
  image: z.string().optional(),
  additionalImages: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditCampaignPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Fetch campaign data
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ["/api/campaigns", id],
    queryFn: async () => {
      try {
        // First try to get by ID directly
        const res = await apiRequest("GET", `/api/user/campaigns`);
        const campaigns = await res.json();
        const thisCampaign = campaigns.find((c: any) => c.id === id);
        
        if (thisCampaign) {
          return thisCampaign;
        }
        
        // If not found, try the slug route as fallback
        const slugRes = await apiRequest("GET", `/api/campaigns/${id}`);
        return slugRes.json();
      } catch (error) {
        console.error("Error fetching campaign:", error);
        throw new Error("Failed to fetch campaign");
      }
    },
    enabled: !!id && isAuthenticated,
  });
  
  // Set up form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      goal: "",
      isActive: true,
      image: "",
      additionalImages: [],
    },
  });
  
  // Update form values when campaign data is loaded
  useEffect(() => {
    if (campaign) {
      form.reset({
        title: campaign.title,
        description: campaign.description,
        goal: campaign.goal,
        isActive: campaign.isActive,
        image: campaign.image || "",
        additionalImages: campaign.additionalImages || [],
      });
      
      if (campaign.image) {
        setPreviewImage(campaign.image);
      }
      
      console.log("Campaign loaded successfully:", campaign);
    }
  }, [campaign, form]);
  
  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };
  
  // Remove selected image
  const removeImage = () => {
    setImageFile(null);
    setPreviewImage(null);
    form.setValue("image", "");
  };
  
  // Upload image to server
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.getValues("image"); // Return existing image if no new one
    
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", imageFile);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload image");
      }
      
      return data.url;
    } catch (error: any) {
      toast({
        title: "Image Upload Failed",
        description: error.message || "Could not upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Update campaign mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("PUT", `/api/campaigns/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update campaign");
      }
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Campaign Updated",
        description: "Your campaign has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      navigate("/manage-campaigns");
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update campaign",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    try {
      // Upload image if a new one was selected
      if (imageFile) {
        const imageUrl = await uploadImage();
        if (imageUrl) {
          data.image = imageUrl;
        }
      }
      
      // If no image was selected and none existed before, use a default image
      if (!data.image) {
        data.image = "";
      }
      
      updateMutation.mutate(data);
    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message || "An error occurred while submitting the form",
        variant: "destructive",
      });
    }
  };
  
  // Show loading state
  if (authLoading || campaignLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="mb-6">You need to be logged in to edit a campaign.</p>
          <Button asChild>
            <a href="/api/login">Log In</a>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Edit Campaign | Christ Collective</title>
        <meta name="description" content="Edit your fundraising campaign details, images, and goals" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Edit Campaign</CardTitle>
              <CardDescription>
                Update your campaign information below
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
                          <Input placeholder="Give your campaign a clear title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell your story and explain the impact of donations" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Explain the purpose of your campaign and how the funds will be used.
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
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                              $
                            </span>
                            <Input className="pl-8" type="number" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Set the amount you aim to raise for this campaign.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active Campaign</FormLabel>
                          <FormDescription>
                            Active campaigns are visible to everyone and can receive donations.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <FormLabel>Campaign Image</FormLabel>
                    <div className="flex flex-col space-y-2">
                      {previewImage ? (
                        <div className="relative">
                          <img 
                            src={previewImage} 
                            alt="Campaign Preview" 
                            className="w-full h-48 object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                          <ImageIcon className="mx-auto text-gray-400 text-3xl mb-3" size={32} />
                          <p className="text-gray-500 mb-2">
                            Drag and drop an image here, or click to select a file
                          </p>
                          <p className="text-xs text-gray-400">Recommended size: 1200 x 675 pixels</p>
                          <Button type="button" variant="outline" className="mt-4" onClick={() => document.getElementById('image-upload')?.click()}>
                            Select Image
                          </Button>
                        </div>
                      )}
                      <Input
                        id="image-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate("/manage-campaigns")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateMutation.isPending || isUploading}
                    >
                      {(updateMutation.isPending || isUploading) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}