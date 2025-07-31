import { useState } from "react";
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
import { ArrowLeft, Church, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertMinistryProfileSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertMinistryProfileSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  logo: true,
  socialLinks: true,
  isVerified: true,
}).extend({
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function MinistryCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
      isActive: true,
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
        description: "Ministry profile created successfully!",
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Location</FormLabel>
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
                        <FormLabel className="text-gray-300">Contact Email</FormLabel>
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
                        <FormLabel className="text-gray-300">Contact Phone</FormLabel>
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
                    {createMinistryMutation.isPending ? "Creating..." : "Create Ministry Profile"}
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