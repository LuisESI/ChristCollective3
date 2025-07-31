import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Church, Upload, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertMinistryProfileSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Ministry name is required"),
  description: z.string().min(1, "Description is required"),
  denomination: z.string().optional(),
  location: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  email: z.string().email("Valid email is required").min(1, "Email is required"),
  phone: z.string().min(1, "Phone number is required"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  logo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function MinistryCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      denomination: "",
      location: "",
      address: "",
      website: "",
      email: "",
      phone: "",
      logo: "",
    },
  });

  const createMinistryMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("/api/ministries", {
        method: "POST",
        data: data,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Ministry profile submitted for admin approval! You'll be notified once it's reviewed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/ministry-profile"] });
      navigate("/ministry-profile");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ministry profile",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image file must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      form.setValue('logo', result.url);
      setLogoPreview(result.url);
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: FormValues) => {
    createMinistryMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/ministry-profile")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#D4AF37] rounded-lg flex items-center justify-center">
              <Church className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create Ministry Profile</h1>
              <p className="text-gray-400">Share your ministry's mission with the community</p>
              <p className="text-yellow-400 text-sm mt-1">⚠️ Profile requires admin approval before going live</p>
            </div>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Ministry Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo Upload Section */}
                <div className="space-y-4">
                  <Label className="text-gray-300">Ministry Logo</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={logoPreview} />
                      <AvatarFallback className="bg-gray-700 text-gray-300">
                        <Church className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Upload Logo
                      </Button>
                      <p className="text-sm text-gray-400">JPG, PNG up to 5MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Ministry Name *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="bg-gray-800 border-gray-600 text-white"
                            placeholder="e.g., Grace Community Church"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="denomination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Denomination</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue placeholder="Select denomination" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baptist">Baptist</SelectItem>
                            <SelectItem value="methodist">Methodist</SelectItem>
                            <SelectItem value="presbyterian">Presbyterian</SelectItem>
                            <SelectItem value="pentecostal">Pentecostal</SelectItem>
                            <SelectItem value="episcopal">Episcopal</SelectItem>
                            <SelectItem value="lutheran">Lutheran</SelectItem>
                            <SelectItem value="catholic">Catholic</SelectItem>
                            <SelectItem value="orthodox">Orthodox</SelectItem>
                            <SelectItem value="non-denominational">Non-denominational</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Ministry Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          value={field.value || ""} 
                          className="bg-gray-800 border-gray-600 text-white min-h-[120px]"
                          placeholder="Describe your ministry's mission, values, and what makes it unique..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Full Address *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          value={field.value || ""} 
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="123 Main Street, Dallas, TX 75201"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">City, State</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            value={field.value || ""} 
                            className="bg-gray-800 border-gray-600 text-white"
                            placeholder="e.g., Dallas, TX"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Website</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""}
                            className="bg-gray-800 border-gray-600 text-white"
                            placeholder="https://yourministry.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Contact Email *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            value={field.value || ""} 
                            type="email"
                            className="bg-gray-800 border-gray-600 text-white"
                            placeholder="contact@yourministry.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Contact Phone *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            value={field.value || ""} 
                            className="bg-gray-800 border-gray-600 text-white"
                            placeholder="(555) 123-4567"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/ministry-profile")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMinistryMutation.isPending}
                    className="bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                  >
                    {createMinistryMutation.isPending ? "Submitting..." : "Submit for Approval"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}