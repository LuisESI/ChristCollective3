import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Calendar, MapPin, Clock, Users, Save } from "lucide-react";
import { insertMinistryEventSchema, type InsertMinistryEvent } from "@shared/schema";
import { z } from "zod";

// Form schema that uses strings for dates (datetime-local inputs)
const eventFormSchema = insertMinistryEventSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  type: z.string().min(1, "Event type is required"),
});

type EventFormData = z.infer<typeof eventFormSchema>;

export default function EventCreatePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Get user's ministry profile to ensure they can create events
  const { data: ministryProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/user/ministry-profile"],
  });

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "",
      startDate: "",
      endDate: "",
      location: "",
      address: "",
      maxAttendees: undefined,
      isOnline: false,
      onlineLink: "",
      requiresRegistration: false,
      isPublished: true,
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      if (!ministryProfile?.id) throw new Error("No ministry profile found");
      
      // Convert string dates to Date objects for the API
      const eventData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        maxAttendees: data.maxAttendees ? Number(data.maxAttendees) : undefined,
      };
      
      return apiRequest(`/api/ministries/${ministryProfile.id}/events`, {
        method: "POST",
        data: eventData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "Your ministry event has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
      navigate("/profile");
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventFormData) => {
    createEventMutation.mutate(data);
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full border-b-2 border-primary h-8 w-8 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!ministryProfile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">Ministry Profile Required</h2>
          <p className="text-gray-500 mb-6">You need a ministry profile to create events.</p>
          <Button onClick={() => navigate("/ministry/create")} className="bg-primary hover:bg-primary/90">
            Create Ministry Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Event - Christ Collective</title>
        <meta name="description" content="Create a new ministry event for your community." />
      </Helmet>
      
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/create")}
                className="text-white hover:bg-white/10 p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold">Create Event</h1>
              <div className="w-9 h-9"></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Event Details
              </CardTitle>
              <CardDescription className="text-gray-400">
                Create a new event for your ministry community. Events will be visible to your followers and the broader community.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Event Title *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-gray-800 border-gray-600 text-white"
                              placeholder="Sunday Morning Service, Bible Study, etc."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Event Type *</FormLabel>
                          <FormControl>
                            <select 
                              {...field} 
                              className="w-full bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2"
                            >
                              <option value="">Select event type</option>
                              <option value="service">Service</option>
                              <option value="bible_study">Bible Study</option>
                              <option value="prayer">Prayer Meeting</option>
                              <option value="worship">Worship</option>
                              <option value="mission">Mission</option>
                              <option value="community_event">Community Event</option>
                            </select>
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
                          <FormLabel className="text-white">Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                              placeholder="Describe your event, what to expect, and any special instructions..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Start Date & Time *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="datetime-local"
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">End Date & Time</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="datetime-local"
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Location</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="bg-gray-800 border-gray-600 text-white"
                            placeholder="Event venue or online meeting link"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Additional Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maxAttendees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Max Attendees</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              className="bg-gray-800 border-gray-600 text-white"
                              placeholder="Leave blank for unlimited"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={createEventMutation.isPending}
                      className="bg-primary hover:bg-primary/90 flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createEventMutation.isPending ? "Creating..." : "Create Event"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/create")}
                      className="border-gray-600 hover:bg-gray-800"
                    >
                      Cancel
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