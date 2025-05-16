import { useState, useRef } from "react";
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
import { ImageIcon, Upload, X } from "lucide-react";
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Update the form field with a placeholder - will replace with URL later
      form.setValue("image", "uploading...");
    }
  };
  
  // Handle image drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Update the form field with a placeholder - will replace with URL later
      form.setValue("image", "uploading...");
    }
  };
  
  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    form.setValue("image", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      let imageUrl = values.image;
      
      // If we have a selected image file, upload it first
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.message || "Failed to upload image");
        }
        
        const { url } = await uploadResponse.json();
        imageUrl = url; // Use the URL returned from the server
      }
      
      const response = await apiRequest("POST", "/api/campaigns", {
        title: values.title,
        description: values.description,
        goal: parseFloat(values.goal),
        image: imageUrl,
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
                          <div 
                            className={`border-2 border-dashed ${imagePreview ? 'border-primary' : 'border-gray-300'} rounded-md p-6 text-center relative`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                          >
                            {imagePreview ? (
                              <div className="relative">
                                <img 
                                  src={imagePreview} 
                                  alt="Campaign preview" 
                                  className="mx-auto h-40 object-contain mb-2"
                                />
                                <button 
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                                <p className="text-sm text-gray-300 mt-2">Image selected</p>
                              </div>
                            ) : (
                              <>
                                <ImageIcon className="mx-auto text-gray-400 text-3xl mb-3" size={32} />
                                <p className="text-gray-500 mb-2">
                                  Drag and drop an image here, or select a file
                                </p>
                                <p className="text-xs text-gray-400 mb-4">Recommended size: 1200 x 675 pixels</p>
                                <input
                                  type="file"
                                  accept="image/*"
                                  ref={fileInputRef}
                                  onChange={handleImageChange}
                                  className="hidden"
                                  id="campaign-image"
                                />
                                <div className="flex space-x-2 justify-center">
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    <Upload className="mr-2" size={16} />
                                    Select Image
                                  </Button>
                                  <div className="text-gray-400 flex items-center">or</div>
                                  <Input 
                                    placeholder="Enter image URL"
                                    {...field}
                                    className="max-w-[250px]"
                                    onChange={(e) => {
                                      field.onChange(e);
                                      if (e.target.value) {
                                        setImagePreview(e.target.value);
                                        setSelectedImage(null);
                                      } else {
                                        setImagePreview(null);
                                      }
                                    }}
                                  />
                                </div>
                              </>
                            )}
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
