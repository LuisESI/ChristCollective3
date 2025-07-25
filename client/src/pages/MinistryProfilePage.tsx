import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Church, MapPin, Phone, Mail, Globe, Users, ArrowLeft, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MinistryFormData {
  name: string;
  description: string;
  denomination: string;
  website: string;
  location: string;
  address: string;
  phone: string;
  email: string;
}

export default function MinistryProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<MinistryFormData>({
    name: "",
    description: "",
    denomination: "",
    website: "",
    location: "",
    address: "",
    phone: "",
    email: "",
  });

  // Check if user already has a ministry profile
  const { data: existingProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/user/ministry-profile"],
    queryFn: async () => {
      const response = await fetch("/api/user/ministry-profile");
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch ministry profile");
      return response.json();
    },
    enabled: !!user,
  });

  const createMinistryMutation = useMutation({
    mutationFn: async (data: MinistryFormData) => {
      const response = await fetch("/api/ministries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create ministry profile");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ministry Profile Created!",
        description: "Your ministry profile has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
      navigate("/explore");
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create ministry profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Ministry name and description are required",
        variant: "destructive",
      });
      return;
    }

    createMinistryMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof MinistryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (existingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Church className="w-6 h-6 text-primary" />
                Ministry Profile Already Exists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You already have a ministry profile set up. You can view and manage it from the Explore page.
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate("/explore")} className="flex-1">
                  <Church className="w-4 h-4 mr-2" />
                  View Ministry Profiles
                </Button>
                <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Ministry Profile - Christ Collective</title>
        <meta name="description" content="Create your ministry profile to connect with and serve the Christian community." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Church className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Ministry Profile</h1>
              <p className="text-gray-600">
                Share your ministry's mission and connect with the community you serve
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Church className="w-5 h-5" />
                  Ministry Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Ministry Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Grace Community Church"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Describe your ministry's mission and vision..."
                        rows={4}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="denomination">Denomination</Label>
                      <Select value={formData.denomination} onValueChange={(value) => handleInputChange("denomination", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select denomination (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baptist">Baptist</SelectItem>
                          <SelectItem value="methodist">Methodist</SelectItem>
                          <SelectItem value="presbyterian">Presbyterian</SelectItem>
                          <SelectItem value="pentecostal">Pentecostal</SelectItem>
                          <SelectItem value="catholic">Catholic</SelectItem>
                          <SelectItem value="episcopal">Episcopal</SelectItem>
                          <SelectItem value="lutheran">Lutheran</SelectItem>
                          <SelectItem value="nondenominational">Non-denominational</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Contact & Location
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="contact@ministry.org"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="https://www.ministry.org"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">City, State</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="Dallas, TX"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Full Address (Optional)</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="123 Faith Street, Dallas, TX 75201"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/")}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMinistryMutation.isPending}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {createMinistryMutation.isPending ? "Creating..." : "Create Ministry Profile"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}