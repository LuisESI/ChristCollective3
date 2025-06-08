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
  additionalImages: z.array(z.string()).optional(),
  video: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateCampaignPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Main image
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Additional images
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);
  
  // Video
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Check if user is authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to create a campaign.
          </p>
          <a 
            href="/api/login"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Sign In to Continue
          </a>
        </div>
      </div>
    );
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

  // Handle main image selection
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
  
  // Handle additional images selection
  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setAdditionalImages(prev => [...prev, ...newFiles]);
      
      // Create previews for each file
      const newPreviews: string[] = [];
      
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === newFiles.length) {
            setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
      
      // Update form value
      form.setValue("additionalImages", Array(newFiles.length).fill("uploading..."));
    }
  };
  
  // Handle video selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVideo(file);
      form.setValue("video", "uploading...");
    }
  };
  
  // Handle video URL input
  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url);
    setSelectedVideo(null);
    form.setValue("video", url);
  };
  
  // Handle main image drop
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
  
  // Handle drop for additional images
  const handleAdditionalImagesDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setAdditionalImages(prev => [...prev, ...newFiles]);
      
      // Create previews for each file
      const newPreviews: string[] = [];
      
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === newFiles.length) {
            setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
      
      // Update form value
      form.setValue("additionalImages", Array(newFiles.length).fill("uploading..."));
    }
  };
  
  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Remove main image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    form.setValue("image", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Remove an additional image
  const handleRemoveAdditionalImage = (index: number) => {
    const newFiles = [...additionalImages];
    newFiles.splice(index, 1);
    setAdditionalImages(newFiles);
    
    const newPreviews = [...additionalImagePreviews];
    newPreviews.splice(index, 1);
    setAdditionalImagePreviews(newPreviews);
    
    // Update form value
    form.setValue("additionalImages", form.getValues().additionalImages?.filter((_, i) => i !== index) || []);
  };
  
  // Remove video
  const handleRemoveVideo = () => {
    setSelectedVideo(null);
    setVideoUrl("");
    form.setValue("video", "");
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Upload main image if selected
      let imageUrl = values.image;
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.message || "Failed to upload main image");
        }
        
        const { url } = await uploadResponse.json();
        imageUrl = url;
      }
      
      // Upload additional images if any
      let additionalImageUrls: string[] = [];
      if (additionalImages.length > 0) {
        // Upload each additional image
        for (const file of additionalImages) {
          const formData = new FormData();
          formData.append("image", file);
          
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.message || "Failed to upload additional image");
          }
          
          const { url } = await uploadResponse.json();
          additionalImageUrls.push(url);
        }
      }
      
      // Upload video if selected, or use the provided URL
      let videoUrl = values.video;
      if (selectedVideo) {
        const formData = new FormData();
        formData.append("image", selectedVideo);
        
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.message || "Failed to upload video");
        }
        
        const { url } = await uploadResponse.json();
        videoUrl = url;
      }
      
      // Create campaign with all media
      const response = await apiRequest("POST", "/api/campaigns", {
        title: values.title,
        description: values.description,
        goal: values.goal, // Keep as string
        image: imageUrl,
        additionalImages: additionalImageUrls,
        video: videoUrl,
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
                        <FormLabel className="text-black dark:text-white">Campaign Title</FormLabel>
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
                        <FormLabel className="text-black dark:text-white">Fundraising Goal</FormLabel>
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
                        <FormLabel className="text-black dark:text-white">End Date (Optional)</FormLabel>
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
                        <FormLabel className="text-black dark:text-white">Campaign Description</FormLabel>
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
                        <FormLabel className="text-black dark:text-white">Main Campaign Image</FormLabel>
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
                                <p className="text-sm text-gray-300 mt-2">Main image selected</p>
                              </div>
                            ) : (
                              <>
                                <ImageIcon className="mx-auto text-gray-400 text-3xl mb-3" size={32} />
                                <p className="text-gray-500 mb-2">
                                  Drag and drop your main image here, or select a file
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
                          This will be the main image displayed for your campaign.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="additionalImages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black dark:text-white">Additional Images (Optional)</FormLabel>
                        <FormControl>
                          <div>
                            {/* Display uploaded images */}
                            {additionalImagePreviews.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                {additionalImagePreviews.map((preview, index) => (
                                  <div key={index} className="relative">
                                    <img 
                                      src={preview} 
                                      alt={`Additional image ${index + 1}`} 
                                      className="w-full h-24 object-cover rounded-md"
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => handleRemoveAdditionalImage(index)}
                                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Add more images area */}
                            <div 
                              className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center"
                              onDrop={handleAdditionalImagesDrop}
                              onDragOver={handleDragOver}
                            >
                              <ImageIcon className="mx-auto text-gray-400 text-2xl mb-2" size={24} />
                              <p className="text-gray-500 text-sm mb-2">
                                Add more images to your campaign
                              </p>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                ref={additionalImagesInputRef}
                                onChange={handleAdditionalImagesChange}
                                className="hidden"
                                id="additional-images"
                              />
                              <Button 
                                type="button" 
                                variant="outline"
                                size="sm"
                                onClick={() => additionalImagesInputRef.current?.click()}
                              >
                                <Upload className="mr-2" size={14} />
                                Add Images
                              </Button>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload multiple images to better showcase your campaign.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="video"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black dark:text-white">Campaign Video (Optional)</FormLabel>
                        <FormControl>
                          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                            {selectedVideo ? (
                              <div className="relative">
                                <div className="mx-auto p-4 bg-gray-800 rounded-md mb-2 text-white">
                                  <p className="font-medium">Video Selected: {selectedVideo.name}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                </div>
                                <button 
                                  type="button"
                                  onClick={handleRemoveVideo}
                                  className="mt-2 text-red-500 underline text-sm"
                                >
                                  Remove video
                                </button>
                              </div>
                            ) : videoUrl ? (
                              <div className="relative">
                                <div className="mx-auto p-4 bg-gray-800 rounded-md mb-2 text-white">
                                  <p className="font-medium">Video URL:</p>
                                  <p className="text-xs text-gray-400 mt-1 break-all">{videoUrl}</p>
                                </div>
                                <button 
                                  type="button"
                                  onClick={handleRemoveVideo}
                                  className="mt-2 text-red-500 underline text-sm"
                                >
                                  Remove video
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-col items-center mb-4">
                                  <p className="text-gray-500 mb-2">
                                    Upload a video or enter a video URL (YouTube, Vimeo, etc.)
                                  </p>
                                  <input
                                    type="file"
                                    accept="video/*"
                                    ref={videoInputRef}
                                    onChange={handleVideoChange}
                                    className="hidden"
                                    id="campaign-video"
                                  />
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => videoInputRef.current?.click()}
                                    className="mb-4"
                                  >
                                    <Upload className="mr-2" size={16} />
                                    Upload Video
                                  </Button>
                                  
                                  <div className="text-gray-400 mb-2">or</div>
                                  
                                  <Input 
                                    placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                                    value={videoUrl}
                                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                                    className="max-w-md"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          A video can help tell your story more effectively and increase engagement.
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
