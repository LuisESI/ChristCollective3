import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, 
  DollarSign, 
  Building, 
  Video, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Globe,
  X
} from "lucide-react";

type SponsorshipApplication = {
  id: number;
  name: string;
  email: string;
  platform: string;
  profileUrl: string;
  content: string;
  audience?: string;
  subscriberCount?: number;
  message: string;
  status: string;
  createdAt: string;
  user: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
};

type Campaign = {
  id: string;
  title: string;
  description: string;
  goal: string;
  currentAmount: string;
  status: string;
  createdAt: string;
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

type BusinessProfile = {
  id: number;
  companyName: string;
  industry: string;
  description: string;
  location: string;
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [selectedApplication, setSelectedApplication] = useState<SponsorshipApplication | null>(null);

  // Redirect if not admin
  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  // Fetch sponsorship applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<SponsorshipApplication[]>({
    queryKey: ["/api/admin/sponsorship-applications"],
  });

  // Fetch campaigns for admin review
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/campaigns"],
  });

  // Fetch business profiles
  const { data: businessProfiles = [], isLoading: businessLoading } = useQuery<BusinessProfile[]>({
    queryKey: ["/api/admin/business-profiles"],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    if (!status) {
      return <Badge variant="outline">No Status</Badge>;
    }
    
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-green-500 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-500 text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'active':
        return <Badge variant="outline" className="border-green-500 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="border-gray-500 text-gray-600">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Admin Dashboard | Christ Collective</title>
        <meta name="description" content="Administrative dashboard for managing Christ Collective platform content and users." />
      </Helmet>
      
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600">Manage applications, campaigns, and platform content</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Sponsorship Applications</CardTitle>
            <Video className="h-3 w-3 md:h-4 md:w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-gray-500">
              {applications.filter((app: SponsorshipApplication) => app.status === 'pending').length} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Active Campaigns</CardTitle>
            <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{campaigns.filter((c: Campaign) => c.status === 'active').length}</div>
            <p className="text-xs text-gray-500">
              {campaigns.length} total campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Business Members</CardTitle>
            <Building className="h-3 w-3 md:h-4 md:w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{businessProfiles.length}</div>
            <p className="text-xs text-gray-500">Registered businesses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Platform Users</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">-</div>
            <p className="text-xs text-gray-500">Total registered</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="applications" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="applications" className="text-xs md:text-sm py-2 md:py-3">
            <span className="hidden sm:inline">Sponsorship Applications</span>
            <span className="sm:hidden">Applications</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs md:text-sm py-2 md:py-3">Campaigns</TabsTrigger>
          <TabsTrigger value="business" className="text-xs md:text-sm py-2 md:py-3">
            <span className="hidden sm:inline">Business Profiles</span>
            <span className="sm:hidden">Business</span>
          </TabsTrigger>
        </TabsList>

        {/* Sponsorship Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Creator Applications</CardTitle>
              <CardDescription>Review and manage sponsorship applications from content creators</CardDescription>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Video className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                  <p>No sponsorship applications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application: SponsorshipApplication) => (
                    <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={application.user?.profileImageUrl || ''} />
                            <AvatarFallback>{application.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{application.name}</h3>
                              {getStatusBadge(application.status)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{application.email}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {application.platform}
                              </span>
                              {application.subscriberCount && (
                                <span>{application.subscriberCount.toLocaleString()} subscribers</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{application.content}</p>
                            <p className="text-xs text-gray-500">Applied: {formatDate(application.createdAt)}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-2"
                          onClick={() => setSelectedApplication(application)}
                        >
                          <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                          <span className="hidden md:inline">View Details</span>
                          <span className="md:hidden">View</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Management</CardTitle>
              <CardDescription>Monitor and manage donation campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                  <p>No campaigns to review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign: Campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{campaign.title}</h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Goal: ${campaign.goal} | Raised: ${campaign.currentAmount}</span>
                        <span>Created: {formatDate(campaign.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        By: {campaign.user?.firstName || ''} {campaign.user?.lastName || ''} ({campaign.user?.email || 'No email'})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Profiles Tab */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Network</CardTitle>
              <CardDescription>Registered business members and their profiles</CardDescription>
            </CardHeader>
            <CardContent>
              {businessLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : businessProfiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                  <p>No business profiles yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {businessProfiles.map((profile: BusinessProfile) => (
                    <div key={profile.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{profile.companyName}</h3>
                          <p className="text-sm text-gray-600">{profile.industry}</p>
                          <p className="text-sm text-gray-500 mt-1">{profile.location}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Contact: {profile.user?.firstName || ''} {profile.user?.lastName || ''} ({profile.user?.email || 'No email'})
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{profile.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Application Detail Modal */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedApplication?.user?.profileImageUrl || ''} />
                <AvatarFallback>{selectedApplication?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              {selectedApplication?.name}
            </DialogTitle>
            <DialogDescription>
              Sponsorship Application Details
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedApplication.status)}
                <span className="text-sm text-gray-500">
                  Applied: {formatDate(selectedApplication.createdAt)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{selectedApplication.email}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Platform & Audience</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span>{selectedApplication.platform}</span>
                    </div>
                    {selectedApplication.subscriberCount && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{selectedApplication.subscriberCount.toLocaleString()} subscribers</span>
                      </div>
                    )}
                    <div>
                      <a 
                        href={selectedApplication.profileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Profile →
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Content Description</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  {selectedApplication.content}
                </p>
              </div>

              {selectedApplication.audience && (
                <div>
                  <h4 className="font-semibold mb-2">Target Audience</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedApplication.audience}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Application Message</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  {selectedApplication.message}
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  Approve Application
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-500 text-red-600 hover:bg-red-50"
                  size="sm"
                >
                  Reject Application
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedApplication(null)}
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}