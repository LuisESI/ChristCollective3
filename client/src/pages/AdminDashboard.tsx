import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Trash2, Clock, DollarSign, Users, Building } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Campaign } from "@shared/schema";

export default function AdminDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }, [authLoading, isAuthenticated, user, toast]);

  const { data: pendingCampaigns = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/admin/campaigns/pending"],
    enabled: user?.isAdmin === true,
  });

  const { data: allCampaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/admin/campaigns"],
    enabled: user?.isAdmin === true,
  });

  const approveMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      await apiRequest("POST", `/api/admin/campaigns/${campaignId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
      toast({
        title: "Campaign Approved",
        description: "The campaign has been approved and is now live.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to approve campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      await apiRequest("POST", `/api/admin/campaigns/${campaignId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
      toast({
        title: "Campaign Rejected",
        description: "The campaign has been rejected.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to reject campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      await apiRequest("DELETE", `/api/admin/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
      toast({
        title: "Campaign Deleted",
        description: "The campaign has been permanently deleted.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage campaigns, approvals, and platform content.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Pending Campaigns</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {pendingLoading ? "..." : pendingCampaigns?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Campaigns</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {campaignsLoading ? "..." : allCampaigns?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Raised</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {campaignsLoading 
                  ? "..." 
                  : formatCurrency(
                      allCampaigns?.reduce((sum: number, campaign: Campaign) => 
                        sum + (Number(campaign.currentAmount) || 0), 0
                      ) || 0
                    )
                }
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Platform Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                Active
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Campaigns Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Pending Campaign Approvals</h2>
          {pendingLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
                      <div className="flex space-x-2">
                        <div className="h-8 bg-gray-700 rounded w-20"></div>
                        <div className="h-8 bg-gray-700 rounded w-20"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingCampaigns?.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No pending campaigns to review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingCampaigns?.map((campaign: Campaign) => (
                <Card key={campaign.id} className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">{campaign.title}</CardTitle>
                        <CardDescription className="text-gray-400 mt-2">
                          Goal: {formatCurrency(Number(campaign.goal))} • 
                          Created: {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'Unknown'}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-900 text-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4 line-clamp-2">{campaign.description}</p>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => approveMutation.mutate(campaign.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-700 hover:bg-green-600 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => rejectMutation.mutate(campaign.id)}
                        disabled={rejectMutation.isPending}
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => deleteMutation.mutate(campaign.id)}
                        disabled={deleteMutation.isPending}
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* All Campaigns Management */}
        <div>
          <h2 className="text-2xl font-bold text-primary mb-4">All Campaigns</h2>
          {campaignsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-gray-700 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : allCampaigns?.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6 text-center">
                <Building className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No active campaigns found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allCampaigns?.map((campaign: Campaign) => (
                <Card key={campaign.id} className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">{campaign.title}</CardTitle>
                        <CardDescription className="text-gray-400 mt-2">
                          {formatCurrency(Number(campaign.currentAmount))} of {formatCurrency(Number(campaign.goal))} raised • 
                          Status: {campaign.status}
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-900 text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                          <div
                            className="bg-primary h-2 rounded-full shadow-lg shadow-primary/50"
                            style={{
                              width: `${Math.min(
                                (Number(campaign.currentAmount) / Number(campaign.goal)) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-400">
                          {Math.round((Number(campaign.currentAmount) / Number(campaign.goal)) * 100)}% funded
                        </p>
                      </div>
                      <Button
                        onClick={() => deleteMutation.mutate(campaign.id)}
                        disabled={deleteMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="ml-4 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}